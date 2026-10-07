import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAcceptedIncomingShare, requireContributor } from '$lib/server/sharing';
import { pool } from '$lib/server/db/postgres';

export const POST: RequestHandler = async ({ cookies, params, request }) => {
  const share = await requireContributor(cookies, params.shareId);
  if (!share.permissions.viewJournal) return json({ error: 'Journal access has not been shared.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const content = typeof body?.body === 'string' ? body.body : '';
  const authorMemberId = typeof body?.authorMemberId === 'string' ? body.authorMemberId : null;
  if (!title || !content.trim()) return json({ error: 'A journal title and body are required.' }, { status: 400 });
  if (authorMemberId) {
    const member = await pool.query(`SELECT id FROM members WHERE id = $1 AND system_id = $2 LIMIT 1`, [authorMemberId, share.systemId]);
    if (member.rows.length === 0) return json({ error: 'That member does not belong to the shared system.' }, { status: 400 });
  }
  const result = await pool.query(`
    INSERT INTO journal_entries (id, system_id, author_member_id, entry_type, title, body, tags, is_pinned, created_at, updated_at)
    VALUES ($1, $2, $3, 'journal', $4, $5, '[]', false, NOW(), NOW())
    RETURNING id, author_member_id, title, body, tags, is_pinned, created_at, updated_at
  `, [crypto.randomUUID(), share.systemId, authorMemberId, title, content]);
  return json({ entry: result.rows[0] }, { status: 201 });
};

export const PATCH: RequestHandler = async ({ cookies, params, request }) => {
  const share = await requireContributor(cookies, params.shareId);
  if (!share.permissions.viewJournal) return json({ error: 'Journal access has not been shared.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!id) return json({ error: 'A journal entry ID is required.' }, { status: 400 });
  const result = await pool.query(`
    UPDATE journal_entries SET title = $1, body = $2, updated_at = NOW()
    WHERE id = $3 AND system_id = $4 AND entry_type = 'journal'
    RETURNING id, title, body, updated_at
  `, [String(body.title ?? ''), String(body.body ?? ''), id, share.systemId]);
  if (result.rows.length === 0) return json({ error: 'Journal entry not found.' }, { status: 404 });
  return json({ entry: result.rows[0] });
};
