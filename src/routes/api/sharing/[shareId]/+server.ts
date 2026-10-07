import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import {
	getIncomingShare,
	getShareForOwner,
	DEFAULT_SHARING_PERMISSIONS,
	type SharingPermissions,
	type SharingRole
} from '$lib/server/sharing';
import { getAuthenticatedSystem } from '$lib/server/system';
import { pool } from '$lib/server/db/postgres';

function readPermissions(value: unknown): SharingPermissions {
	const input =
		value && typeof value === 'object'
			? (value as Record<string, unknown>)
			: {};

	return {
		...DEFAULT_SHARING_PERMISSIONS,
		viewMembers: input.viewMembers !== false,
		viewFronting: input.viewFronting !== false,
		viewFrontHistory: input.viewFrontHistory === true,
		viewChat: input.viewChat === true,
		participateChat: input.participateChat === true,
		viewJournal: input.viewJournal === true,
		viewPolls: input.viewPolls === true
	};
}

export const PATCH: RequestHandler = async ({ cookies, params, request }) => {
	const shareId = params.shareId;
	const body = await request.json().catch(() => null);

	if (!body || typeof body !== 'object') {
		return json({ error: 'Invalid sharing request.' }, { status: 400 });
	}

	if (body.action === 'accept') {
		const share = await getIncomingShare(cookies, shareId);

		if (share.status !== 'pending') {
			return json(
				{ error: 'That invitation is no longer pending.' },
				{ status: 409 }
			);
		}

		const result = await pool.query(
			`
				UPDATE system_shares
				SET
					status = 'accepted',
					accepted_at = NOW(),
					updated_at = NOW()
				WHERE id = $1
				  AND status = 'pending'
				RETURNING id
			`,
			[shareId]
		);

		if (result.rows.length === 0) {
			return json(
				{ error: 'That invitation could not be accepted.' },
				{ status: 409 }
			);
		}

		return json({
			share: await getIncomingShare(cookies, shareId)
		});
	}

	await getShareForOwner(cookies, shareId);

	const role: SharingRole =
		body.role === 'contributor' ? 'contributor' : 'viewer';

	const permissions = readPermissions(body.permissions);

	const result = await pool.query(
		`
			UPDATE system_shares
			SET
				role = $1,
				permissions = $2::jsonb,
				updated_at = NOW()
			WHERE id = $3
			  AND status IN ('pending', 'accepted')
			RETURNING id
		`,
		[role, JSON.stringify(permissions), shareId]
	);

	if (result.rows.length === 0) {
		return json(
			{ error: 'That share is no longer active.' },
			{ status: 409 }
		);
	}

	return json({
		share: await getShareForOwner(cookies, shareId)
	});
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	await getShareForOwner(cookies, params.shareId);

	const result = await pool.query(
		`
			UPDATE system_shares
			SET
				status = 'revoked',
				updated_at = NOW()
			WHERE id = $1
			  AND status IN ('pending', 'accepted')
			RETURNING id
		`,
		[params.shareId]
	);

	if (result.rows.length === 0) {
		return json(
			{ error: 'That share is already revoked.' },
			{ status: 409 }
		);
	}

	return json({ success: true });
};
