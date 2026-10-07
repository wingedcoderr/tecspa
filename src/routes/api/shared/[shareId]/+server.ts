import { json } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getIncomingShare, requireAcceptedIncomingShare, requireContributor } from '$lib/server/sharing';
import { pool } from '$lib/server/db/postgres';

async function getPayload(cookies: Cookies, shareId: string) {
  const share = await requireAcceptedIncomingShare(cookies, shareId);
  const p = share.permissions;

  const memberResult = p.viewMembers || p.viewFronting
    ? await pool.query(`
        SELECT id, name, pronouns, aliases, role, status, about, interests,
               front_triggers, avatar, banner, is_fronting
        FROM members
        WHERE system_id = $1
          AND ($2::boolean OR is_fronting = 1)
        ORDER BY name
      `, [share.systemId, p.viewMembers])
    : { rows: [] };

  const members = memberResult.rows.map((m) => {
    const isFronting = p.viewFronting && Number(m.is_fronting) === 1;
    const canSeeProfile = p.viewMembers;
    return {
      id: String(m.id),
      name: canSeeProfile || isFronting ? m.name : null,
      pronouns: canSeeProfile ? m.pronouns : null,
      aliases: canSeeProfile ? m.aliases : null,
      role: canSeeProfile ? m.role : null,
      status: canSeeProfile ? m.status : null,
      about: canSeeProfile ? m.about : null,
      interests: canSeeProfile ? m.interests : null,
      frontTriggers: canSeeProfile ? m.front_triggers : null,
      hasAvatar: canSeeProfile || isFronting ? Boolean(m.avatar) : false,
      hasBanner: canSeeProfile ? Boolean(m.banner) : false,
      isFronting
    };
  });

  let chat: unknown[] = [];
  if (p.viewChat) {
    const result = await pool.query(`
      SELECT c.id, c.sender_member_id, c.message, c.created_at,
             m.name AS sender_name
      FROM chat_messages c
      LEFT JOIN members m ON m.id = c.sender_member_id
      WHERE c.system_id = $1
      ORDER BY c.created_at ASC
      LIMIT 200
    `, [share.systemId]);
    chat = result.rows.map((row) => ({
      id: String(row.id),
      senderMemberId: row.sender_member_id ? String(row.sender_member_id) : null,
      senderName: p.viewMembers ? row.sender_name : 'system member',
      message: String(row.message),
      createdAt: String(row.created_at)
    }));
  }

  let journal: unknown[] = [];
  if (p.viewJournal) {
    const result = await pool.query(`
      SELECT j.id, j.author_member_id, j.title, j.body, j.tags,
             j.is_pinned, j.created_at, j.updated_at,
             m.name AS author_name
      FROM journal_entries j
      LEFT JOIN members m ON m.id = j.author_member_id
      WHERE j.system_id = $1 AND j.entry_type = 'journal'
      ORDER BY j.is_pinned DESC, j.updated_at DESC
      LIMIT 200
    `, [share.systemId]);
    journal = result.rows.map((row) => ({
      id: String(row.id),
      authorMemberId: row.author_member_id ? String(row.author_member_id) : null,
      authorName: p.viewMembers ? row.author_name : 'system member',
      title: String(row.title ?? ''),
      body: String(row.body ?? ''),
      tags: row.tags ?? [],
      isPinned: Boolean(row.is_pinned),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at)
    }));
  }

  let frontHistory: unknown[] = [];
  if (p.viewFrontHistory) {
    const result = await pool.query(`
      SELECT f.id, f.member_id, f.started_at, f.ended_at, f.note,
             m.name AS member_name
      FROM front_history f
      LEFT JOIN members m ON m.id = f.member_id
      WHERE f.system_id = $1
      ORDER BY f.started_at DESC
      LIMIT 200
    `, [share.systemId]);
    frontHistory = result.rows.map((row) => ({
      id: String(row.id),
      memberId: String(row.member_id),
      memberName: p.viewMembers ? row.member_name : 'system member',
      startedAt: String(row.started_at),
      endedAt: row.ended_at ? String(row.ended_at) : null,
      note: row.note ?? ''
    }));
  }

  return {
    share,
    system: { name: share.systemName, ownerUsername: share.recipientUsername },
    permissions: p,
    canEdit: share.role === 'contributor',
    members,
    chat,
    journal,
    frontHistory
  };
}

export const GET: RequestHandler = async ({ cookies, params }) => {
  return json(await getPayload(cookies, params.shareId));
};

export const PATCH: RequestHandler = async ({ cookies, params, request }) => {
  const share = await requireContributor(cookies, params.shareId);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return json({ error: 'Invalid shared-system update.' }, { status: 400 });

  if (typeof body.systemName === 'string') {
    const name = body.systemName.trim();
    if (!name) return json({ error: 'System name cannot be empty.' }, { status: 400 });
    await pool.query(`UPDATE systems SET name = $1, updated_at = NOW() WHERE id = $2`, [name, share.systemId]);
  }

  if (body.member && typeof body.member === 'object') {
    if (!share.permissions.viewMembers) {
      return json({ error: 'Member profiles have not been shared with this contributor.' }, { status: 403 });
    }
    const member = body.member as Record<string, unknown>;
    const memberId = typeof member.id === 'string' ? member.id : '';
    if (!memberId) return json({ error: 'A member ID is required.' }, { status: 400 });
    await pool.query(`
      UPDATE members
      SET name = $1, pronouns = $2, aliases = $3::jsonb, role = $4,
          status = $5, about = $6, interests = $7::jsonb,
          front_triggers = $8::jsonb
      WHERE id = $9 AND system_id = $10
    `, [
      String(member.name ?? ''),
      String(member.pronouns ?? ''),
      JSON.stringify(Array.isArray(member.aliases) ? member.aliases : []),
      String(member.role ?? 'member'),
      String(member.status ?? 'as-active'),
      String(member.about ?? ''),
      JSON.stringify(Array.isArray(member.interests) ? member.interests : []),
      JSON.stringify(Array.isArray(member.frontTriggers) ? member.frontTriggers : []),
      memberId,
      share.systemId
    ]);
  }

  if (typeof body.memberId === 'string' && typeof body.isFronting === 'boolean') {
    if (!share.permissions.viewFronting) {
      return json({ error: 'Fronting access has not been shared with this contributor.' }, { status: 403 });
    }
    await pool.query(`
      UPDATE members SET is_fronting = $1
      WHERE id = $2 AND system_id = $3
    `, [body.isFronting ? 1 : 0, body.memberId, share.systemId]);
  }

  return json(await getPayload(cookies, params.shareId));
};

