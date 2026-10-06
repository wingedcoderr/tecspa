import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';

import { pool } from '$lib/server/db/postgres';
import { isUuid } from '$lib/server/validate';
import { getAuthenticatedSystem } from '$lib/server/system';

type JournalEntryRow = {
	id: string;
	author_member_id: string | null;
	entry_type: 'journal' | 'note';
	title: string;
	body: string;
	tags: string | null;
	is_pinned: number;
	created_at: string;
	updated_at: string;
};

function parseTags(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.filter(
			(item): item is string =>
				typeof item === 'string'
		);
	}

	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);

			return Array.isArray(parsed)
				? parsed.filter(
						(item): item is string =>
							typeof item === 'string'
					)
				: [];
		} catch {
			return [];
		}
	}

	return [];
}

function mapJournalEntryRow(row: JournalEntryRow) {
	return {
		id: row.id,
		authorMemberId: row.author_member_id,
		entryType:
			row.entry_type === 'note'
				? 'note'
				: 'journal',
		title: row.title ?? '',
		body: row.body ?? '',
		tags: parseTags(row.tags),
		isPinned: Boolean(row.is_pinned),
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

export const GET: RequestHandler = async ({
	params,
	cookies
}) => {
	const { id } = params;

	if (!id) {
		throw error(
			400,
			'Journal entry ID is required.'
		);
	}

	if (!isUuid(id)) {
		throw error(400, 'Invalid id');
	}

	const { system } = await getAuthenticatedSystem(cookies);

	const result = await pool.query<JournalEntryRow>(
		`
			SELECT
				id,
				author_member_id,
				entry_type,
				title,
				body,
				tags,
				is_pinned,
				created_at,
				updated_at
			FROM journal_entries
			WHERE id = $1
				AND system_id = $2
		`,
		[id, system.id]
	);

	if (result.rows.length === 0) {
		throw error(
			404,
			'Journal entry not found.'
		);
	}

	return json(
		mapJournalEntryRow(result.rows[0])
	);
};

export const PATCH: RequestHandler = async ({
	params,
	cookies,
	request
}) => {
	const { id } = params;

	if (!id) {
		throw error(
			400,
			'Journal entry ID is required.'
		);
	}

	if (!isUuid(id)) {
		throw error(400, 'Invalid id');
	}

	const { system } = await getAuthenticatedSystem(cookies);

	const body = await request.json();

	const authorMemberId =
		typeof body.authorMemberId === 'string'
			? body.authorMemberId
			: null;

	if (authorMemberId) {
		const memberResult = await pool.query(
			`
				SELECT id
				FROM members
				WHERE id = $1
					AND system_id = $2
				LIMIT 1
			`,
			[authorMemberId, system.id]
		);

		if (memberResult.rows.length === 0) {
			throw error(
				400,
				'Author member does not belong to your TECSPA system.'
			);
		}
	}

	const entryType =
		body.entryType === 'note'
			? 'note'
			: 'journal';

	const title =
		typeof body.title === 'string'
			? body.title
			: '';

	const entryBody =
		typeof body.body === 'string'
			? body.body
			: '';

	if (title.length > 300) {
		return json(
			{ error: 'Invalid input' },
			{ status: 422 }
		);
	}

	if (entryBody.length > 200000) {
		return json(
			{ error: 'Invalid input' },
			{ status: 422 }
		);
	}

	const tags = Array.isArray(body.tags)
		? body.tags.filter(
				(item: unknown): item is string =>
					typeof item === 'string'
			)
		: [];

	const isPinned =
		body.isPinned === true
			? 1
			: 0;

	const updatedAt =
		new Date().toISOString();

	const result = await pool.query<JournalEntryRow>(
		`
			UPDATE journal_entries
			SET
				author_member_id = $1,
				entry_type = $2,
				title = $3,
				body = $4,
				tags = $5,
				is_pinned = $6,
				updated_at = $7
			WHERE id = $8
				AND system_id = $9
			RETURNING
				id,
				author_member_id,
				entry_type,
				title,
				body,
				tags,
				is_pinned,
				created_at,
				updated_at
		`,
		[
			authorMemberId,
			entryType,
			title,
			entryBody,
			JSON.stringify(tags),
			isPinned,
			updatedAt,
			id,
			system.id
		]
	);

	if (result.rows.length === 0) {
		throw error(
			404,
			'Journal entry not found.'
		);
	}

	return json(
		mapJournalEntryRow(result.rows[0])
	);
};

export const DELETE: RequestHandler = async ({
	params,
	cookies
}) => {
	const { id } = params;

	if (!id) {
		throw error(
			400,
			'Journal entry ID is required.'
		);
	}

	if (!isUuid(id)) {
		throw error(400, 'Invalid id');
	}

	const { system } = await getAuthenticatedSystem(cookies);

	const result = await pool.query(
		`
			DELETE FROM journal_entries
			WHERE id = $1
				AND system_id = $2
			RETURNING id
		`,
		[id, system.id]
	);

	if (result.rows.length === 0) {
		throw error(
			404,
			'Journal entry not found.'
		);
	}

	return new Response(null, {
		status: 204
	});
};