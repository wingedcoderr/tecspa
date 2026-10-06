import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { randomUUID } from 'node:crypto';

import type { Member } from '$lib/data/members';
import { getAuthenticatedSystem } from '$lib/server/system';
import { pool } from '$lib/server/db/postgres';

function parseJsonArray(
	value: unknown
): string[] {
	if (Array.isArray(value)) {
		return value.filter(
			(item): item is string =>
				typeof item === 'string'
		);
	}

	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);

			if (Array.isArray(parsed)) {
				return parsed.filter(
					(item): item is string =>
						typeof item === 'string'
				);
			}
		} catch {
			// Fall through to empty array.
		}
	}

	return [];
}

export const GET: RequestHandler = async ({
	cookies
}) => {
	const { system } =
		await getAuthenticatedSystem(cookies);

	const membersResult =
		await pool.query(
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
			`,
			[system.id]
		);

	const customFieldsResult =
		await pool.query(
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
			`,
			[system.id]
		);

	const customFieldsByMember =
		new Map<string, any[]>();

	for (const field of customFieldsResult.rows) {
		const fields =
			customFieldsByMember.get(
				field.member_id
			) ?? [];

		fields.push({
			id: field.id,
			memberId: field.member_id,
			label: field.label,
			type: field.type,
			value: field.value,
			description:
				field.description ?? '',
			sortOrder:
				field.sort_order ?? 0
		});

		customFieldsByMember.set(
			field.member_id,
			fields
		);
	}

	const members: Member[] =
		membersResult.rows.map((member) => ({
			id: member.id,
			name: member.name,
			pronouns:
				member.pronouns ?? '',
			aliases: parseJsonArray(
				member.aliases
			),
			role:
				member.role ?? '',
			status:
				member.status ?? '',
			about:
				member.about ?? '',
			interests: parseJsonArray(
				member.interests
			),
			frontTriggers:
				parseJsonArray(
					member.front_triggers
				),
			avatar:
				member.avatar ?? '',
			banner:
				member.banner ?? '',
			isFronting:
				Boolean(member.is_fronting),
			customFields:
				customFieldsByMember.get(
					member.id
				) ?? []
		}));

	return json(members);
};

export const POST: RequestHandler = async ({
	request,
	cookies
}) => {
	const { system } =
		await getAuthenticatedSystem(cookies);

	let body: {
		member?: Partial<Member>;
	};

	try {
		body = await request.json();
	} catch {
		throw error(
			400,
			'Invalid request body.'
		);
	}

	const input = body.member;

	if (
		!input ||
		typeof input.id !== 'string' ||
		typeof input.name !== 'string'
	) {
		throw error(
			400,
			'Member id and name are required.'
		);
	}

	const memberId = input.id.trim();
	const name = input.name.trim();

	if (!memberId || !name) {
		throw error(
			400,
			'Member id and name are required.'
		);
	}

	const aliases = parseJsonArray(
		input.aliases
	);

	const interests = parseJsonArray(
		input.interests
	);

	const frontTriggers =
		parseJsonArray(
			input.frontTriggers
		);

	const client =
		await pool.connect();

	try {
		await client.query('BEGIN');

		await client.query(
			`
				INSERT INTO members (
					id,
					system_id,
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
				)
				VALUES (
					$1,
					$2,
					$3,
					$4,
					$5,
					$6,
					$7,
					$8,
					$9,
					$10,
					$11,
					$12,
					$13
				)
			`,
			[
				memberId,
				system.id,
				name,
				input.pronouns ?? '',
				JSON.stringify(aliases),
				input.role ?? '',
				input.status ?? '',
				input.about ?? '',
				JSON.stringify(
					interests
				),
				JSON.stringify(
					frontTriggers
				),
				input.avatar ?? '',
				input.banner ?? '',
				input.isFronting
					? 1
					: 0
			]
		);

		for (
			const field of
				input.customFields ?? []
		) {
			await client.query(
				`
					INSERT INTO custom_fields (
						id,
						system_id,
						member_id,
						label,
						type,
						value,
						description,
						sort_order
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5,
						$6,
						$7,
						$8
					)
				`,
				[
					field.id ??
						randomUUID(),
					system.id,
					memberId,
					field.label ?? '',
					field.type ?? 'text',
					field.value ?? '',
					field.description ?? '',
					field.sortOrder ?? 0
				]
			);
		}

		await client.query('COMMIT');

		const createdMember: Member = {
			id: memberId,
			name,
			pronouns:
				input.pronouns ?? '',
			aliases,
			role:
				input.role ?? '',
			status:
				input.status ?? '',
			about:
				input.about ?? '',
			interests,
			frontTriggers,
			avatar:
				input.avatar ?? '',
			banner:
				input.banner ?? '',
			isFronting:
				Boolean(
					input.isFronting
				),
			customFields:
				input.customFields ?? []
		};

		return json(
			{
				member:
					createdMember
			},
			{
				status: 201
			}
		);
	} catch (caughtError) {
		await client.query(
			'ROLLBACK'
		);

		console.error(
			'Failed to create member:',
			caughtError
		);

		if (
			typeof caughtError ===
				'object' &&
			caughtError !== null &&
			'code' in caughtError &&
			caughtError.code ===
				'23505'
		) {
			throw error(
				409,
				'A member with this ID already exists.'
			);
		}

		throw error(
			500,
			'Failed to create member.'
		);
	} finally {
		client.release();
	}
};