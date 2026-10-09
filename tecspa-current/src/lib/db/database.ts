import Database from '@tauri-apps/plugin-sql';
import { members as starterMembers } from '$lib/data/members';

let database: Database | null = null;

export async function getDatabase() {
	if (!database) {
		database = await Database.load('sqlite:tecspa.db');
	}

	return database;
}

export async function initializeDatabase() {
	const db = await getDatabase();

	/*
	 * =========================================================
	 * MEMBERS
	 * =========================================================
	 */

	await db.execute(`
		CREATE TABLE IF NOT EXISTS members (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			pronouns TEXT NOT NULL DEFAULT '',
			aliases TEXT NOT NULL DEFAULT '[]',
			role TEXT NOT NULL DEFAULT 'member',
			status TEXT NOT NULL DEFAULT 'active',
			about TEXT NOT NULL DEFAULT '',
			interests TEXT NOT NULL DEFAULT '[]',
			front_triggers TEXT NOT NULL DEFAULT '[]',
			avatar TEXT NOT NULL DEFAULT '',
			banner TEXT NOT NULL DEFAULT '',
			is_fronting INTEGER NOT NULL DEFAULT 0
		)
	`);

	/*
	 * Existing TECSPA installations may have an older
	 * members table. Add missing columns without destroying
	 * existing data.
	 */

	const columns = await db.select<any[]>(
		'PRAGMA table_info(members)'
	);

	const columnNames = new Set(
		columns.map((column) => column.name)
	);

	if (!columnNames.has('pronouns')) {
		await db.execute(`
			ALTER TABLE members
			ADD COLUMN pronouns TEXT NOT NULL DEFAULT ''
		`);
	}

	if (!columnNames.has('aliases')) {
		await db.execute(`
			ALTER TABLE members
			ADD COLUMN aliases TEXT NOT NULL DEFAULT '[]'
		`);
	}

	if (!columnNames.has('role')) {
		await db.execute(`
			ALTER TABLE members
			ADD COLUMN role TEXT NOT NULL DEFAULT 'member'
		`);
	}

	if (!columnNames.has('status')) {
		await db.execute(`
			ALTER TABLE members
			ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
		`);
	}

	if (!columnNames.has('about')) {
		await db.execute(`
			ALTER TABLE members
			ADD COLUMN about TEXT NOT NULL DEFAULT ''
		`);
	}

	if (!columnNames.has('interests')) {
		await db.execute(`
			ALTER TABLE members
			ADD COLUMN interests TEXT NOT NULL DEFAULT '[]'
		`);
	}

	if (!columnNames.has('front_triggers')) {
		await db.execute(`
			ALTER TABLE members
			ADD COLUMN front_triggers TEXT NOT NULL DEFAULT '[]'
		`);
	}

	if (!columnNames.has('avatar')) {
		await db.execute(`
			ALTER TABLE members
			ADD COLUMN avatar TEXT NOT NULL DEFAULT ''
		`);
	}

	if (!columnNames.has('banner')) {
		await db.execute(`
			ALTER TABLE members
			ADD COLUMN banner TEXT NOT NULL DEFAULT ''
		`);
	}

	if (!columnNames.has('is_fronting')) {
		await db.execute(`
			ALTER TABLE members
			ADD COLUMN is_fronting INTEGER NOT NULL DEFAULT 0
		`);
	}

	/*
	 * =========================================================
	 * CUSTOM FIELDS
	 * =========================================================
	 *
	 * Custom fields belong to individual members.
	 *
	 * Examples:
	 *
	 * Favorite color  → lavender
	 * Comfort item    → stuffed rabbit
	 * Has wings       → 1
	 * Birthday        → 2001-04-17
	 *
	 * The value is stored as text so the UI can interpret it
	 * according to the field's type.
	 */

	await db.execute(`
		CREATE TABLE IF NOT EXISTS custom_fields (
			id TEXT PRIMARY KEY NOT NULL,
			member_id TEXT NOT NULL,
			label TEXT NOT NULL,
			type TEXT NOT NULL DEFAULT 'text',
			value TEXT NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			sort_order INTEGER NOT NULL DEFAULT 0,
			FOREIGN KEY (member_id)
				REFERENCES members(id)
				ON DELETE CASCADE
		)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_custom_fields_member
		ON custom_fields(member_id)
	`);

	/*
	 * =========================================================
	 * FRONT HISTORY
	 * =========================================================
	 *
	 * Every time someone starts fronting, a new row is created.
	 *
	 * When they stop fronting, ended_at is filled in.
	 *
	 * Multiple members can therefore be fronting at once.
	 */

	await db.execute(`
		CREATE TABLE IF NOT EXISTS front_history (
			id TEXT PRIMARY KEY NOT NULL,
			member_id TEXT NOT NULL,
			started_at TEXT NOT NULL,
			ended_at TEXT,
			note TEXT NOT NULL DEFAULT '',
			FOREIGN KEY (member_id)
				REFERENCES members(id)
				ON DELETE CASCADE
		)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_front_history_member
		ON front_history(member_id)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_front_history_started
		ON front_history(started_at)
	`);

	/*
	 * =========================================================
	 * CHAT MESSAGES
	 * =========================================================
	 *
	 * A chat message represents something written by a
	 * headmate inside TECSPA.
	 *
	 * sender_member_id points to the member who sent it.
	 *
	 * edited_at remains NULL until a message is edited.
	 */

	await db.execute(`
		CREATE TABLE IF NOT EXISTS chat_messages (
			id TEXT PRIMARY KEY NOT NULL,
			sender_member_id TEXT NOT NULL,
			message TEXT NOT NULL,
			created_at TEXT NOT NULL,
			edited_at TEXT,
			FOREIGN KEY (sender_member_id)
				REFERENCES members(id)
				ON DELETE CASCADE
		)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_chat_messages_created
		ON chat_messages(created_at)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_chat_messages_sender
		ON chat_messages(sender_member_id)
	`);

	/*
	 * =========================================================
	 * JOURNAL / NOTES
	 * =========================================================
	 *
	 * Journal entries and notes intentionally share one table.
	 *
	 * entry_type:
	 *
	 *   journal → a journal entry
	 *   note    → a general note
	 *
	 * author_member_id is nullable so TECSPA can eventually
	 * support system-level notes that aren't attributed to
	 * one specific headmate.
	 *
	 * tags are stored as a JSON array, matching the way other
	 * flexible TECSPA data is currently stored.
	 */

	await db.execute(`
		CREATE TABLE IF NOT EXISTS journal_entries (
			id TEXT PRIMARY KEY NOT NULL,
			author_member_id TEXT,
			entry_type TEXT NOT NULL DEFAULT 'journal',
			title TEXT NOT NULL DEFAULT '',
			body TEXT NOT NULL DEFAULT '',
			tags TEXT NOT NULL DEFAULT '[]',
			is_pinned INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			FOREIGN KEY (author_member_id)
				REFERENCES members(id)
				ON DELETE SET NULL
		)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_journal_entries_created
		ON journal_entries(created_at)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_journal_entries_author
		ON journal_entries(author_member_id)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_journal_entries_type
		ON journal_entries(entry_type)
	`);

	/*
	 * =========================================================
	 * POLLS
	 * =========================================================
	 *
	 * A poll contains the question and its overall settings.
	 *
	 * allow_multiple:
	 *
	 *   0 → one option per voter
	 *   1 → multiple options per voter
	 *
	 * closed_at remains NULL while the poll is open.
	 */

	await db.execute(`
		CREATE TABLE IF NOT EXISTS polls (
			id TEXT PRIMARY KEY NOT NULL,
			creator_member_id TEXT NOT NULL,
			question TEXT NOT NULL,
			allow_multiple INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL,
			closed_at TEXT,
			FOREIGN KEY (creator_member_id)
				REFERENCES members(id)
				ON DELETE CASCADE
		)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_polls_created
		ON polls(created_at)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_polls_creator
		ON polls(creator_member_id)
	`);

	/*
	 * =========================================================
	 * POLL OPTIONS
	 * =========================================================
	 *
	 * Each poll has one or more choices.
	 *
	 * sort_order controls how the choices are displayed.
	 */

	await db.execute(`
		CREATE TABLE IF NOT EXISTS poll_options (
			id TEXT PRIMARY KEY NOT NULL,
			poll_id TEXT NOT NULL,
			label TEXT NOT NULL,
			sort_order INTEGER NOT NULL DEFAULT 0,
			FOREIGN KEY (poll_id)
				REFERENCES polls(id)
				ON DELETE CASCADE
		)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_poll_options_poll
		ON poll_options(poll_id)
	`);

	/*
	 * =========================================================
	 * POLL VOTES
	 * =========================================================
	 *
	 * A vote connects a member to a poll option.
	 *
	 * We intentionally do not store a cached vote count.
	 * Counts can always be calculated from these rows.
	 *
	 * This also means changing/deleting a vote won't leave
	 * stale totals behind.
	 */

	await db.execute(`
		CREATE TABLE IF NOT EXISTS poll_votes (
			id TEXT PRIMARY KEY NOT NULL,
			poll_id TEXT NOT NULL,
			option_id TEXT NOT NULL,
			member_id TEXT NOT NULL,
			created_at TEXT NOT NULL,
			FOREIGN KEY (poll_id)
				REFERENCES polls(id)
				ON DELETE CASCADE,
			FOREIGN KEY (option_id)
				REFERENCES poll_options(id)
				ON DELETE CASCADE,
			FOREIGN KEY (member_id)
				REFERENCES members(id)
				ON DELETE CASCADE
		)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_poll_votes_poll
		ON poll_votes(poll_id)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_poll_votes_option
		ON poll_votes(option_id)
	`);

	await db.execute(`
		CREATE INDEX IF NOT EXISTS
		idx_poll_votes_member
		ON poll_votes(member_id)
	`);

	/*
	 * =========================================================
	 * SEED STARTER MEMBERS
	 * =========================================================
	 */

	const existingMembers = await db.select<any[]>(
		'SELECT id FROM members LIMIT 1'
	);

	if (existingMembers.length === 0) {
		for (const member of starterMembers) {
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
		}
	}
	return db;
}