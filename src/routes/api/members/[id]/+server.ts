import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { pool } from '$lib/server/db/postgres';
import { isUuid } from '$lib/server/validate';
import { getAuthenticatedSystem } from '$lib/server/system';

export const GET: RequestHandler = async ({
	params,
	cookies
}) => {
	const memberId = params.id;

	if (!isUuid(memberId)) {
		return json(
			{ error: 'Invalid id' },
			{ status: 400 }
		);
	}

	try {
		const { system } = await getAuthenticatedSystem(cookies);

		const memberResult = await pool.query(
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
					avatar,
					banner,
					is_fronting
				FROM members
				WHERE id = $1
					AND system_id = $2
				LIMIT 1;
			`,
			[memberId, system.id]
		);

		if (memberResult.rows.length === 0) {
			return json(
				{
					error: 'Member not found.'
				},
				{ status: 404 }
			);
		}

		const member = memberResult.rows[0];

		const customFieldsResult = await pool.query(
			`
				SELECT
					id,
					member_id,
					label,
					type,
					value,
					description,
					sort_order
				FROM custom_fields
				WHERE member_id = $1
					AND system_id = $2
				ORDER BY sort_order;
			`,
			[memberId, system.id]
		);

		return json({
			id: member.id,
			name: member.name,
			pronouns: member.pronouns,
			aliases: JSON.parse(member.aliases),
			role: member.role,
			status: member.status,
			about: member.about,
			interests: JSON.parse(member.interests),
			frontTriggers: JSON.parse(member.front_triggers),
			avatar: member.avatar,
			banner: member.banner,
			isFronting: Boolean(member.is_fronting),
			customFields: customFieldsResult.rows.map((field) => ({
				id: field.id,
				memberId: field.member_id,
				label: field.label,
				type: field.type,
				value: field.value,
				description: field.description,
				sortOrder: field.sort_order
			}))
		});
	} catch (error) {
		console.error('Failed to load member:', error);

		if (
			error &&
			typeof error === 'object' &&
			'status' in error &&
			typeof error.status === 'number'
		) {
			throw error;
		}

		return json(
			{
				error: 'Failed to load member.'
			},
			{ status: 500 }
		);
	}
};