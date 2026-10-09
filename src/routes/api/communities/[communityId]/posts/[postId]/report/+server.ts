import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthenticatedSystem } from '$lib/server/system';
import { pool } from '$lib/server/db/postgres';
export const POST:RequestHandler=async({cookies,params,request})=>{const {system}=await getAuthenticatedSystem(cookies);const body=await request.json().catch(()=>null);const reason=typeof body?.reason==='string'?body.reason.trim().slice(0,1000):'';if(reason.length<3)return json({error:'Please provide a reason (at least 3 characters).'}, {status:400});const post=await pool.query(`SELECT community_id FROM community_posts WHERE id=$1 AND community_id=$2`,[params.postId,params.communityId]);if(!post.rowCount)return json({error:'Post not found.'},{status:404});await pool.query(`INSERT INTO community_reports(id,community_id,post_id,reporter_system_id,reason) VALUES($1,$2,$3,$4,$5)`,[crypto.randomUUID(),params.communityId,params.postId,system.id,reason]);return json({reported:true},{status:201});};
