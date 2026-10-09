import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { getAuthenticatedSystem } from '$lib/server/system';
import { pool } from '$lib/server/db/postgres';

type LegacyMemberRow = {
  id: string;
  name: string;
  pronouns: string | null;
  aliases: string | null;
  role: string | null;
  status: string | null;
  about: string | null;
  interests: string | null;
  front_triggers: string | null;
  avatar: string | null;
  banner: string | null;
  is_fronting: number | string | boolean | null;
};

type CustomFieldRow = {
  id: string;
  member_id: string;
  label: string;
  type: string;
  value: string | null;
  description: string | null;
  sort_order: number | string | null;
};

function parseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

/**
 * One-time migration bridge for records that predate the encrypted vault.
 *
 * This endpoint is intentionally separate from /api/members, which remains
 * disabled. It requires an authenticated owner, a same-origin POST, and an
 * explicit confirmation. It only reads rows belonging to that owner's system.
 *
 * Legacy rows remain untouched. The browser encrypts the returned profiles
 * before writing them to /api/crypto/vault.
 */
export const POST: RequestHandler = async ({ cookies, request, url }) => {
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) {
    return json({ error: 'Cross-origin migration requests are not allowed.' }, { status: 403 });
  }

  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return json({ error: 'A JSON confirmation is required.' }, { status: 415 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      (body as Record<string, unknown>).confirm !== true) {
    return json({ error: 'Explicit migration confirmation is required.' }, { status: 400 });
  }

  const { system } = await getAuthenticatedSystem(cookies);

  const memberResult = await pool.query<LegacyMemberRow>(
    `SELECT m.id, m.name, m.pronouns, m.aliases, m.role, m.status, m.about,
            m.interests, m.front_triggers, m.avatar, m.banner, m.is_fronting
       FROM members m
      WHERE m.system_id = $1
        AND NOT EXISTS (
          SELECT 1
            FROM e2ee_vault_records v
           WHERE v.system_id = m.system_id
             AND v.record_type = 'member'
             AND v.record_id = m.id
        )
      ORDER BY m.name ASC, m.id ASC`,
    [system.id]
  );

  const memberIds = memberResult.rows.map((member) => member.id);
  let customFields: CustomFieldRow[] = [];

  if (memberIds.length > 0) {
    const fieldsResult = await pool.query<CustomFieldRow>(
      `SELECT cf.id, cf.member_id, cf.label, cf.type, cf.value, cf.description, cf.sort_order
         FROM custom_fields cf
         INNER JOIN members m ON m.id = cf.member_id
        WHERE m.system_id = $1 AND cf.member_id = ANY($2::text[])
        ORDER BY cf.sort_order ASC, cf.label ASC, cf.id ASC`,
      [system.id, memberIds]
    );
    customFields = fieldsResult.rows;
  }

  const fieldsByMember = new Map<string, CustomFieldRow[]>();
  for (const field of customFields) {
    const existing = fieldsByMember.get(field.member_id) ?? [];
    existing.push(field);
    fieldsByMember.set(field.member_id, existing);
  }

  const members = memberResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    pronouns: row.pronouns ?? '',
    aliases: parseArray(row.aliases),
    role: row.role ?? 'member',
    status: row.status ?? 'active',
    about: row.about ?? '',
    interests: parseArray(row.interests),
    frontTriggers: parseArray(row.front_triggers),
    avatar: row.avatar ?? '',
    banner: row.banner ?? '',
    isFronting: row.is_fronting === true || Number(row.is_fronting ?? 0) !== 0,
    customFields: (fieldsByMember.get(row.id) ?? []).map((field) => ({
      id: field.id,
      memberId: field.member_id,
      label: field.label,
      type: field.type,
      value: field.value ?? '',
      description: field.description ?? '',
      sortOrder: Number(field.sort_order ?? 0)
    }))
  }));

  return json(
    { members },
    { headers: { 'Cache-Control': 'no-store, private', 'Pragma': 'no-cache' } }
  );
};
