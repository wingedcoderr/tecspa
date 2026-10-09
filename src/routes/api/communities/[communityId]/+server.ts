import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthenticatedSystem } from '$lib/server/system';
import { pool } from '$lib/server/db/postgres';

export const POST: RequestHandler = async ({ cookies, params }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const community = await pool.query(`SELECT visibility,status FROM communities WHERE id=$1`,[params.communityId]);
  if (!community.rows.length || community.rows[0].status!=='active') return json({error:'Community not found.'},{status:404});
  if (community.rows[0].visibility!=='public') return json({error:'Private community membership is unavailable until secure key sharing is implemented.'},{status:409});
  await pool.query(`INSERT INTO community_memberships(community_id,system_id,role,status) VALUES($1,$2,'member','active') ON CONFLICT(community_id,system_id) DO UPDATE SET status='active',role=CASE WHEN community_memberships.role='owner' THEN 'owner' ELSE 'member' END`,[params.communityId,system.id]);
  return json({joined:true});
};
export const DELETE: RequestHandler = async ({ cookies, params }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const result=await pool.query(`UPDATE community_memberships SET status='left' WHERE community_id=$1 AND system_id=$2 AND role<>'owner'`,[params.communityId,system.id]);
  if (!result.rowCount) return json({error:'Membership not found or owner cannot leave without transferring ownership.'},{status:409});
  return json({left:true});
};
