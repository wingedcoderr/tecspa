import { getDatabase } from '$lib/db/database';
import type {
	JournalEntry,
	JournalEntryType
} from '$lib/data/activity';

function parseArray(value: string): string[] {
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

function databaseRowToJournalEntry(
	row: any
): JournalEntry {
	return {
		id: row.id,
		authorMemberId:
			row.author_member_id ?? null,
		entryType:
			row.entry_type === 'note'
				? 'note'
				: 'journal',
		title: row.title ?? '',
		body: row.body ?? '',
		tags: parseArray(row.tags),
		isPinned: Boolean(row.is_pinned),
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

/*
 * =========================================================
 * GET ALL ENTRIES
 * =========================================================
 */

export async function getJournalEntries(): Promise<
	JournalEntry[]
> {
	const db = await getDatabase();

	const rows = await db.select<any[]>(
		`
			SELECT *
			FROM journal_entries
			ORDER BY
				is_pinned DESC,
				created_at DESC
		`
	);

	return rows.map(databaseRowToJournalEntry);
}

/*
 * =========================================================
 * GET ONE ENTRY
 * =========================================================
 */

export async function getJournalEntryById(
	id: string
): Promise<JournalEntry | null> {
	const db = await getDatabase();

	const rows = await db.select<any[]>(
		`
			SELECT *
			FROM journal_entries
			WHERE id = $1
		`,
		[id]
	);

	if (rows.length === 0) {
		return null;
	}

	return databaseRowToJournalEntry(rows[0]);
}

/*
 * =========================================================
 * CREATE ENTRY
 * =========================================================
 */

export async function createJournalEntry(
	entry: Omit<
		JournalEntry,
		'id' | 'createdAt' | 'updatedAt'
	>
): Promise<JournalEntry> {
	const db = await getDatabase();

	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	const entryType: JournalEntryType =
		entry.entryType === 'note'
			? 'note'
			: 'journal';

	await db.execute(
		`
			INSERT INTO journal_entries (
				id,
				author_member_id,
				entry_type,
				title,
				body,
				tags,
				is_pinned,
				created_at,
				updated_at
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
				$9
			)
		`,
		[
			id,
			entry.authorMemberId,
			entryType,
			entry.title,
			entry.body,
			JSON.stringify(entry.tags),
			entry.isPinned ? 1 : 0,
			now,
			now
		]
	);

	return {
		...entry,
		id,
		entryType,
		createdAt: now,
		updatedAt: now
	};
}

/*
 * =========================================================
 * UPDATE ENTRY
 * =========================================================
 */

export async function updateJournalEntry(
	id: string,
	entry: Omit<
		JournalEntry,
		'id' | 'createdAt' | 'updatedAt'
	>
	) {
	const db = await getDatabase();

	const now = new Date().toISOString();

	const entryType: JournalEntryType =
		entry.entryType === 'note'
			? 'note'
			: 'journal';

	await db.execute(
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
		`,
		[
			entry.authorMemberId,
			entryType,
			entry.title,
			entry.body,
			JSON.stringify(entry.tags),
			entry.isPinned ? 1 : 0,
			now,
			id
		]
	);
}

/*
 * =========================================================
 * PIN / UNPIN
 * =========================================================
 */

export async function setJournalEntryPinned(
	id: string,
	isPinned: boolean
) {
	const db = await getDatabase();

	await db.execute(
		`
			UPDATE journal_entries
			SET is_pinned = $1
			WHERE id = $2
		`,
		[
			isPinned ? 1 : 0,
			id
		]
	);
}

/*
 * =========================================================
 * DELETE ENTRY
 * =========================================================
 */

export async function deleteJournalEntry(
	id: string
) {
	const db = await getDatabase();

	await db.execute(
		`
			DELETE FROM journal_entries
			WHERE id = $1
		`,
		[id]
	);
}