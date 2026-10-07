import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { getIncomingShare } from '$lib/server/sharing';
import { pool } from '$lib/server/db/postgres';

export const GET: RequestHandler = async ({ cookies, params }) => {
	const share = await getIncomingShare(cookies, params.shareId);

	if (share.status !== 'accepted') {
		return json(
			{ error: 'This shared system has not been accepted.' },
			{ status: 403 }
		);
	}

	if (!share.permissions.viewMembers) {
		return json(
			{ error: 'The owner has not shared the member directory.' },
			{ status: 403 }
		);
	}

	const members = await pool.query(
		`
			SELECT
				id,
				name,
				pronouns,
				aliases,
				role,
				status,
				about,
				interests,
				front_triggers,
				is_fronting
			FROM members
			WHERE system_id = $1
			ORDER BY name
		`,
		[share.systemId]
	);

	const permissions = share.permissions;

	return json({
		system: {
			name: share.systemName,
			ownerUsername: share.recipientUsername
		},
		permissions,
		members: members.rows.map((member) => ({
			id: String(member.id),
			name: permissions.viewMembers ? member.name : null,
			pronouns: permissions.viewMembers ? member.pronouns : null,
			aliases: permissions.viewMembers ? member.aliases : null,
			role: permissions.viewMembers ? member.role : null,
			status: permissions.viewMembers ? member.status : null,
			about: permissions.viewMembers ? member.about : null,
			interests: permissions.viewMembers ? member.interests : null,
			frontTriggers: permissions.viewMembers
				? member.front_triggers
				: null,
			isFronting:
				permissions.viewFronting && member.is_fronting === true
		}))
	});
};
