import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthenticatedSystem } from '$lib/server/system';
import { pool } from '$lib/server/db/postgres';

async function canAccess(communityId: string, systemId: string) {
  const r = await pool.query(`SELECT c.visibility,m.role FROM communities c LEFT JOIN community_memberships m ON m.community_id=c.id AND m.system_id=$2 AND m.status='active' WHERE c.id=$1 AND c.status='active'`,[communityId,systemId]);
  return r.rows[0] && (r.rows[0].visibility === 'public' || r.rows[0].role);
}
export const GET: RequestHandler = async ({ cookies, params, url }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  if (!await canAccess(params.communityId,system.id)) return json({error:'Community not found or access denied.'},{status:404});
  const channelId=url.searchParams.get('channelId');
  if (!channelId) return json({error:'channelId is required.'},{status:400});
  const channel=await pool.query(`SELECT 1 FROM community_channels WHERE id=$1 AND community_id=$2`,[channelId,params.communityId]);
  if (!channel.rowCount) return json({error:'Channel not found.'},{status:404});
  const result=await pool.query(`SELECT p.id,p.channel_id,p.author_system_id,p.author_member_id,p.author_display_name,p.content_mode,p.content,p.parent_post_id,p.created_at,
      (SELECT COUNT(*)::int FROM community_reactions r WHERE r.post_id=p.id) AS reaction_count
    FROM community_posts p WHERE p.community_id=$1 AND p.channel_id=$2 AND p.status='visible' ORDER BY p.created_at ASC LIMIT 300`,[params.communityId,channelId]);
  return json({posts:result.rows});
};
export const POST: RequestHandler = async ({ cookies, params, request }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const body=await request.json().catch(()=>null);
  if (!body || typeof body!=='object' || Array.isArray(body)) return json({error:'A JSON object is required.'},{status:400});
  if (!await canAccess(params.communityId,system.id)) return json({error:'Community not found or access denied.'},{status:404});
  const channelId=typeof body.channelId==='string'?body.channelId:'';
  const content=typeof body.content==='string'?body.content.trim():'';
  const displayName=typeof body.displayName==='string'?body.displayName.trim().slice(0,80):'';
  const contentMode=body.contentMode==='encrypted'?'encrypted':'public_plaintext';
  if (typeof body.memberId === 'string' && body.memberId.length) {
    const ownedMember = await pool.query(`SELECT 1 FROM e2ee_vault_records WHERE system_id=$1 AND record_type='member' AND record_id=$2`, [system.id, body.memberId]);
    if (!ownedMember.rowCount) return json({error:'The selected posting identity does not belong to this system.'},{status:403});
  }
  if (!channelId || !content || content.length>12000 || !displayName) return json({error:'Channel, display name, and message (up to 12,000 characters) are required.'},{status:400});
  // Encrypted payloads may be stored, but decryption/key sharing is client responsibility; private communities remain disabled until recipient-key exchange exists.
  const channel=await pool.query(`SELECT c.visibility FROM community_channels ch JOIN communities c ON c.id=ch.community_id WHERE ch.id=$1 AND ch.community_id=$2 AND c.status='active'`,[channelId,params.communityId]);
  if (!channel.rows.length) return json({error:'Channel not found.'},{status:404});
  if (channel.rows[0].visibility==='private') return json({error:'Private community posting is disabled until secure recipient-key sharing is implemented.'},{status:409});
  if (body.parentPostId) {
    const parent=await pool.query(`SELECT 1 FROM community_posts WHERE id=$1 AND community_id=$2 AND channel_id=$3 AND status='visible'`,[body.parentPostId,params.communityId,channelId]);
    if (!parent.rowCount) return json({error:'Reply target not found.'},{status:400});
  }
  const id=crypto.randomUUID();
  const result=await pool.query(`INSERT INTO community_posts(id,community_id,channel_id,author_system_id,author_member_id,author_display_name,content_mode,content,parent_post_id)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,channel_id,author_system_id,author_member_id,author_display_name,content_mode,content,parent_post_id,created_at`,
    [id,params.communityId,channelId,system.id,typeof body.memberId==='string'&&body.memberId.length<256?body.memberId:null,displayName,contentMode,content,typeof body.parentPostId==='string'?body.parentPostId:null]);
  return json({post:result.rows[0]},{status:201});
};
