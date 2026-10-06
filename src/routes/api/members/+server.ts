import { json } from '@sveltejs/kit';

import { pool } from '$lib/server/db/postgres';
import { getAuthenticatedSystem } from '$lib/server/system';
import type { Cookies } from '@sveltejs/kit';

export async function GET({
	cookies
}: {
	cookies: Cookies;
}) {
	try {
		const { system } = await getAuthenticatedSystem(cookies);

		const membersResult = await pool.query(
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
				WHERE system_id = $1
				ORDER BY name
				LIMIT 500;
			`,
			[system.id]
		);

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
				WHERE system_id = $1
				ORDER BY member_id, sort_order
				LIMIT 500;
			`,
			[system.id]
		);

		const customFieldsByMember = new Map<
			string,
			typeof customFieldsResult.rows
		>();

		for (const field of customFieldsResult.rows) {
			const fields =
				customFieldsByMember.get(field.member_id) ?? [];

			fields.push(field);
			customFieldsByMember.set(field.member_id, fields);
		}

		const members = membersResult.rows.map((member) => ({
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
			customFields: customFieldsByMember.get(member.id) ?? []
		}));

		return json(members);
	} catch (error) {
		console.error('Failed to load members:', error);

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
				error: 'Failed to load members.'
			},
			{ status: 500 }
		);
	}
}