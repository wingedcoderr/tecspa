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

	if (typeof body.isPinned !== 'boolean') {
		throw error(
			400,
			'isPinned must be a boolean.'
		);
	}

	const isPinned =
		body.isPinned ? 1 : 0;

	const updatedAt =
		new Date().toISOString();

	const result = await pool.query<JournalEntryRow>(
		`
			UPDATE journal_entries
			SET
				is_pinned = $1,
				updated_at = $2
			WHERE id = $3
				AND system_id = $4
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