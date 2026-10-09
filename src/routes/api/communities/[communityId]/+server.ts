import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthenticatedSystem } from '$lib/server/system';
import { pool } from '$lib/server/db/postgres';

export const GET: RequestHandler = async ({ cookies, params }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const c = await pool.query(`SELECT c.id,c.name,c.description,c.visibility,c.owner_system_id,c.created_at,
    COALESCE(m.role,'visitor') role, COALESCE(m.status,'visitor') membership_status,
    (SELECT COUNT(*)::int FROM community_memberships x WHERE x.community_id=c.id AND x.status='active') member_count
    FROM communities c LEFT JOIN community_memberships m ON m.community_id=c.id AND m.system_id=$2
    WHERE c.id=$1 AND c.status='active' AND (c.visibility='public' OR m.status='active')`, [params.communityId, system.id]);
  if (!c.rowCount) return json({error:'Community not found.'},{status:404});
  const channels = await pool.query(`SELECT id,name,description,kind,position FROM community_channels WHERE community_id=$1 ORDER BY position,name`, [params.communityId]);
  return json({community:c.rows[0],channels:channels.rows});
};

export const POST: RequestHandler = async ({ cookies, params }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const c = await pool.query(`SELECT visibility,status FROM communities WHERE id=$1`,[params.communityId]);
  if (!c.rowCount || c.rows[0].status!=='active') return json({error:'Community not found.'},{status:404});
  if (c.rows[0].visibility!=='public') return json({error:'Private community joining is disabled until recipient-key encryption is implemented.'},{status:409});
  await pool.query(`INSERT INTO community_memberships(community_id,system_id,role,status) VALUES($1,$2,'member','active') ON CONFLICT(community_id,system_id) DO UPDATE SET status='active',role=CASE WHEN community_memberships.role='owner' THEN 'owner' ELSE 'member' END`,[params.communityId,system.id]);
  return json({joined:true});
};
export const DELETE: RequestHandler = async ({ cookies, params }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const result=await pool.query(`UPDATE community_memberships SET status='left' WHERE community_id=$1 AND system_id=$2 AND role<>'owner'`,[params.communityId,system.id]);
  if (!result.rowCount) return json({error:'Membership not found or owner cannot leave without transferring ownership.'},{status:409});
  return json({left:true});
};
