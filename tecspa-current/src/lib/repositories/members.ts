import { getDatabase } from '../db/database';
import type {
	CustomField,
	Member
} from '$lib/data/members';

function parseArray(value: string): string[] {
	try {
		const parsed = JSON.parse(value);

		return Array.isArray(parsed)
			? parsed
			: [];
	} catch {
		return [];
	}
}

function databaseRowToCustomField(
	row: any
): CustomField {
	return {
		id: row.id,
		memberId: row.member_id,
		label: row.label,
		type: row.type,
		value: row.value ?? '',
		description: row.description ?? '',
		sortOrder: Number(row.sort_order ?? 0)
	};
}

async function getCustomFieldsForMember(
	memberId: string
): Promise<CustomField[]> {
	const db = await getDatabase();

	const rows = await db.select<any[]>(
		`
			SELECT *
			FROM custom_fields
			WHERE member_id = $1
			ORDER BY sort_order ASC, label COLLATE NOCASE ASC
		`,
		[memberId]
	);

	return rows.map(databaseRowToCustomField);
}

async function databaseRowToMember(
	row: any
): Promise<Member> {
	const customFields =
		await getCustomFieldsForMember(row.id);

	return {
		id: row.id,
		name: row.name,
		pronouns: row.pronouns,
		aliases: parseArray(row.aliases),
		role: row.role,
		status: row.status,
		about: row.about,
		interests: parseArray(row.interests),
		frontTriggers: parseArray(row.front_triggers),

		avatar: row.avatar ?? '',
		banner: row.banner ?? '',

		isFronting: Boolean(row.is_fronting),

		customFields
	};
}

export async function getMembers(): Promise<Member[]> {
	const db = await getDatabase();

	const rows = await db.select<any[]>(
		'SELECT * FROM members ORDER BY name COLLATE NOCASE'
	);

	return Promise.all(
		rows.map(databaseRowToMember)
	);
}

export async function getMemberById(
	id: string
): Promise<Member | null> {
	const db = await getDatabase();

	const rows = await db.select<any[]>(
		'SELECT * FROM members WHERE id = $1',
		[id]
	);

	if (rows.length === 0) {
		return null;
	}

	return databaseRowToMember(rows[0]);
}

export async function saveCustomFields(
	memberId: string,
	customFields: Member['customFields']
): Promise<void> {
	const db = await getDatabase();

	await db.execute(
		`
		DELETE FROM custom_fields
		WHERE member_id = $1
		`,
		[memberId]
	);

	for (const field of customFields) {
		await db.execute(
			`
			INSERT INTO custom_fields (
				id,
				member_id,
				label,
				type,
				value,
				description,
				sort_order
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			`,
			[
				field.id,
				memberId,
				field.label,
				field.type,
				field.value,
				field.description,
				field.sortOrder
			]
		);
	}
}

export async function createMember(
	member: Member
) {
	const db = await getDatabase();

	await db.execute(
		`
			INSERT INTO members (
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
				$12
			)
		`,
		[
			member.id,
			member.name,
			member.pronouns,
			JSON.stringify(member.aliases),
			member.role,
			member.status,
			member.about,
			JSON.stringify(member.interests),
			JSON.stringify(member.frontTriggers),
			member.avatar,
			member.banner,
			member.isFronting ? 1 : 0
		]
	);

	await saveCustomFields(
		member.id,
		member.customFields
	);
}

export async function updateMember(
	id: string,
	member: Member
): Promise<void> {
	const db = await getDatabase();

	await db.execute(
		`
		UPDATE members
		SET
			name = $1,
			pronouns = $2,
			aliases = $3,
			role = $4,
			status = $5,
			about = $6,
			interests = $7,
			front_triggers = $8,
			avatar = $9,
			banner = $10,
			is_fronting = $11
		WHERE id = $12
		`,
		[
			member.name,
			member.pronouns,
			JSON.stringify(member.aliases),
			member.role,
			member.status,
			member.about,
			JSON.stringify(member.interests),
			JSON.stringify(member.frontTriggers),
			member.avatar,
			member.banner,
			member.isFronting ? 1 : 0,
			id
		]
	);

	await saveCustomFields(id, member.customFields ?? []);
}

export async function deleteMember(id: string) {
	const db = await getDatabase();

	await db.execute(
		'DELETE FROM members WHERE id = $1',
		[id]
	);
}

export async function setMemberFronting(
	id: string,
	isFronting: boolean
) {
	const db = await getDatabase();

	const rows = await db.select<any[]>(
		'SELECT is_fronting FROM members WHERE id = $1',
		[id]
	);

	if (rows.length === 0) {
		return;
	}

	const currentlyFronting =
		Boolean(rows[0].is_fronting);

	/*
	 * Do nothing when the requested state is already
	 * the current state. This prevents duplicate history
	 * entries from accidental repeated clicks.
	 */

	if (currentlyFronting === isFronting) {
		return;
	}

	await db.execute(
		'UPDATE members SET is_fronting = $1 WHERE id = $2',
		[isFronting ? 1 : 0, id]
	);

	const now = new Date().toISOString();

	if (isFronting) {
		await db.execute(
			`
				INSERT INTO front_history (
					id,
					member_id,
					started_at,
					ended_at,
					note
				)
				VALUES (
					$1,
					$2,
					$3,
					NULL,
					''
				)
			`,
			[
				crypto.randomUUID(),
				id,
				now
			]
		);
	} else {
		await db.execute(
			`
				UPDATE front_history
				SET ended_at = $1
				WHERE id = (
					SELECT id
					FROM front_history
					WHERE member_id = $2
						AND ended_at IS NULL
					ORDER BY started_at DESC
					LIMIT 1
				)
			`,
			[now, id]
		);
	}
}