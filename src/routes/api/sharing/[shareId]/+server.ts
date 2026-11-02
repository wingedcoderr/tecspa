import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAccountFromSession } from '$lib/server/auth';
import { pool } from '$lib/server/db/postgres';

export const GET: RequestHandler = async () => json(
	{ error: 'Plaintext shared-system reads are disabled. Encrypted sharing is not yet available.' },
	{ status: 410 }
);

export const PATCH: RequestHandler = async ({ cookies, params, request }) => {
	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return json({ error: 'Invalid invitation action.' }, { status: 400 });
	}
	const action = body as Record<string, unknown>;
	const isAccept = action.action === 'accept' || action.accept === true ||
		action.accepted === true || action.status === 'accepted';
	if (!isAccept) {
		return json(
			{ error: 'Plaintext shared-system edits are disabled until encrypted editing is implemented.' },
			{ status: 410 }
		);
	}
	const account = await getAccountFromSession(cookies.get('tecspa_session'));
	if (!account) return json({ error: 'You must be signed in.' }, { status: 401 });
	const result = await pool.query(
		`SELECT id, status FROM system_shares WHERE id = $1 AND recipient_account_id = $2 LIMIT 1`,
		[params.shareId, account.id]
	);
	if (!result.rows.length) return json({ error: 'This invitation does not belong to your account.' }, { status: 403 });
	if (result.rows[0].status === 'accepted') return json({ error: 'This invitation has already been accepted.' }, { status: 409 });
	if (result.rows[0].status !== 'pending') return json({ error: 'This invitation is no longer available.' }, { status: 409 });
	const accepted = await pool.query(
		`UPDATE system_shares SET status = 'accepted', accepted_at = NOW() WHERE id = $1 AND recipient_account_id = $2 AND status = 'pending' RETURNING id`,
		[params.shareId, account.id]
	);
	if (!accepted.rowCount) return json({ error: 'The invitation could not be accepted. It may have changed already.' }, { status: 409 });
	return json({ accepted: true, shareId: params.shareId, message: 'Invitation accepted. Encrypted shared content is not available yet.' });
};
