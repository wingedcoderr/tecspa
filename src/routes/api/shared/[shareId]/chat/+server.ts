import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAcceptedIncomingShare, requireContributor } from '$lib/server/sharing';
import { pool } from '$lib/server/db/postgres';

export const POST: RequestHandler = async ({ cookies, params, request }) => {
  const share = await requireAcceptedIncomingShare(cookies, params.shareId);
  if (!share.permissions.viewChat || !share.permissions.participateChat) return json({ error: 'Sending messages is not allowed for this share.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const senderMemberId = typeof body?.senderMemberId === 'string' ? body.senderMemberId : null;
  if (!message) return json({ error: 'Message cannot be empty.' }, { status: 400 });

  if (senderMemberId) {
    const member = await pool.query(`SELECT id FROM members WHERE id = $1 AND system_id = $2 LIMIT 1`, [senderMemberId, share.systemId]);
    if (member.rows.length === 0) return json({ error: 'That member does not belong to the shared system.' }, { status: 400 });
  }

  const result = await pool.query(`
    INSERT INTO chat_messages (id, system_id, sender_member_id, message, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id, sender_member_id, message, created_at
  `, [crypto.randomUUID(), share.systemId, senderMemberId, message]);
  return json({ message: result.rows[0] }, { status: 201 });
};

export const DELETE: RequestHandler = async ({ cookies, params, request }) => {
  const share = await requireContributor(cookies, params.shareId);
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!id) return json({ error: 'A message ID is required.' }, { status: 400 });
  await pool.query(`DELETE FROM chat_messages WHERE id = $1 AND system_id = $2`, [id, share.systemId]);
  return json({ success: true });
};
