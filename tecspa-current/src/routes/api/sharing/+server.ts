import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import {
	createShare,
	getIncomingShares,
	getOwnerShares,
	DEFAULT_SHARING_PERMISSIONS,
	type SharingPermissions,
	type SharingRole
} from '$lib/server/sharing';

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

export const GET: RequestHandler = async ({ cookies }) => {
	const [outgoing, incoming] = await Promise.all([
		getOwnerShares(cookies),
		getIncomingShares(cookies)
	]);

	return json({
		outgoing,
		incoming
	});
};

export const POST: RequestHandler = async ({ cookies, request }) => {
	const body = await request.json().catch(() => null);

	if (!body || typeof body.username !== 'string') {
		return json(
			{ error: 'A TECSPA username is required.' },
			{ status: 400 }
		);
	}

	const role: SharingRole =
		body.role === 'contributor' ? 'contributor' : 'viewer';

	const share = await createShare(
		cookies,
		body.username,
		role,
		readPermissions(body.permissions)
	);

	return json({ share }, { status: 201 });
};
