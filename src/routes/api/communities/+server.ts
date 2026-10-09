import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthenticatedSystem } from '$lib/server/system';
import { pool } from '$lib/server/db/postgres';

const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export const GET: RequestHandler = async ({ cookies }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const result = await pool.query(
    `SELECT c.id,c.name,c.description,c.visibility,c.created_at,
       COALESCE(m.role,'visitor') AS role,
       COALESCE(m.status,'visitor') AS membership_status,
       (SELECT COUNT(*)::int FROM community_memberships cm WHERE cm.community_id=c.id AND cm.status='active') AS member_count
     FROM communities c LEFT JOIN community_memberships m ON m.community_id=c.id AND m.system_id=$1
     WHERE c.status='active' AND (c.visibility='public' OR (m.status='active'))
     ORDER BY c.created_at DESC LIMIT 200`, [system.id]);
  return json({ communities: result.rows });
};

export const POST: RequestHandler = async ({ cookies, request }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'A JSON object is required.' }, { status: 400 });
  const name = text(body.name, 60);
  const description = text(body.description, 500);
  const visibility = body.visibility === 'private' ? 'private' : body.visibility === 'public' ? 'public' : null;
  if (!name || !visibility) return json({ error: 'Name and visibility (public or private) are required.' }, { status: 400 });
  // Private communities are not enabled until recipient-specific E2EE key sharing is implemented.
  if (visibility === 'private') return json({ error: 'Private communities are not available until secure member key sharing is implemented. Create a public community for now.' }, { status: 409 });
  const id = crypto.randomUUID();
  const channelId = crypto.randomUUID();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`INSERT INTO communities(id,owner_system_id,name,description,visibility) VALUES($1,$2,$3,$4,$5)`, [id, system.id, name, description, visibility]);
    await client.query(`INSERT INTO community_memberships(community_id,system_id,role,status) VALUES($1,$2,'owner','active')`, [id, system.id]);
    await client.query(`INSERT INTO community_channels(id,community_id,name,kind,position) VALUES($1,$2,'general','text',0)`, [channelId,id]);
    await client.query('COMMIT');
    return json({ community: { id, name, description, visibility, role: 'owner', membership_status: 'active', member_count: 1 }, channel: { id: channelId, name: 'general' } }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Community creation failed', error);
    return json({ error: 'Could not create community.' }, { status: 500 });
  } finally { client.release(); }
};
