import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthenticatedSystem } from '$lib/server/system';
import { pool } from '$lib/server/db/postgres';

export const GET: RequestHandler = async ({ cookies, params }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const access = await pool.query(`SELECT 1 FROM communities c LEFT JOIN community_memberships m ON m.community_id=c.id AND m.system_id=$2 AND m.status='active' WHERE c.id=$1 AND c.status='active' AND (c.visibility='public' OR m.system_id IS NOT NULL)`, [params.communityId,system.id]);
  if (!access.rowCount) return json({ error: 'Community not found or access denied.' }, { status: 404 });
  const channels = await pool.query(`SELECT id,name,description,kind,position FROM community_channels WHERE community_id=$1 ORDER BY position,name`, [params.communityId]);
  return json({ channels: channels.rows });
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,40) : '';
  if (!name) return json({ error: 'A valid channel name is required.' }, { status: 400 });
  const role = await pool.query(`SELECT m.role FROM community_memberships m WHERE m.community_id=$1 AND m.system_id=$2 AND m.status='active'`, [params.communityId,system.id]);
  if (!role.rows.length || !['owner','moderator'].includes(role.rows[0].role)) return json({ error: 'Only community owners and moderators can create channels.' }, { status: 403 });
  try {
    const id = crypto.randomUUID();
    const result = await pool.query(`INSERT INTO community_channels(id,community_id,name,description) VALUES($1,$2,$3,$4) RETURNING id,name,description,kind,position`, [id,params.communityId,name,typeof body.description==='string'?body.description.trim().slice(0,240):'']);
    return json({ channel: result.rows[0] }, { status: 201 });
  } catch { return json({ error: 'Channel name may already exist.' }, { status: 409 }); }
};
