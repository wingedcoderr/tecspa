/*
 * TECSPA PostgreSQL migration 001
 *
 * Initial web database schema.
 *
 * This mirrors the existing TECSPA SQLite data model.
 */

BEGIN;


/*
 * =========================================================
 * MEMBERS
 * =========================================================
 */

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
);


/*
 * =========================================================
 * CUSTOM FIELDS
 * =========================================================
 */

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
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_member
	ON custom_fields(member_id);


/*
 * =========================================================
 * FRONT HISTORY
 * ========================================================= */

CREATE TABLE IF NOT EXISTS front_history (
	id TEXT PRIMARY KEY NOT NULL,
	member_id TEXT NOT NULL,
	started_at TEXT NOT NULL,
	ended_at TEXT,
	note TEXT NOT NULL DEFAULT '',

	FOREIGN KEY (member_id)
		REFERENCES members(id)
		ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_front_history_member
	ON front_history(member_id);

CREATE INDEX IF NOT EXISTS idx_front_history_started
	ON front_history(started_at);


/*
 * =========================================================
 * CHAT MESSAGES
 * ========================================================= */

CREATE TABLE IF NOT EXISTS chat_messages (
	id TEXT PRIMARY KEY NOT NULL,
	sender_member_id TEXT NOT NULL,
	message TEXT NOT NULL,
	created_at TEXT NOT NULL,
	edited_at TEXT,

	FOREIGN KEY (sender_member_id)
		REFERENCES members(id)
		ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created
	ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender
	ON chat_messages(sender_member_id);


/*
 * =========================================================
 * JOURNAL / NOTES
 * ========================================================= */

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
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_created
	ON journal_entries(created_at);

CREATE INDEX IF NOT EXISTS idx_journal_entries_author
	ON journal_entries(author_member_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_type
	ON journal_entries(entry_type);


/*
 * =========================================================
 * POLLS
 * ========================================================= */

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
);

CREATE INDEX IF NOT EXISTS idx_polls_created
	ON polls(created_at);

CREATE INDEX IF NOT EXISTS idx_polls_creator
	ON polls(creator_member_id);


/*
 * =========================================================
 * POLL OPTIONS
 * ========================================================= */

CREATE TABLE IF NOT EXISTS poll_options (
	id TEXT PRIMARY KEY NOT NULL,
	poll_id TEXT NOT NULL,
	label TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0,

	FOREIGN KEY (poll_id)
		REFERENCES polls(id)
		ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll
	ON poll_options(poll_id);


/*
 * =========================================================
 * POLL VOTES
 * ========================================================= */

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
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll
	ON poll_votes(poll_id);

CREATE INDEX IF NOT EXISTS idx_poll_votes_option
	ON poll_votes(option_id);

CREATE INDEX IF NOT EXISTS idx_poll_votes_member
	ON poll_votes(member_id);


/*
 * =========================================================
 * MIGRATION RECORD
 * ========================================================= */

CREATE TABLE IF NOT EXISTS schema_migrations (
	version TEXT PRIMARY KEY NOT NULL,
	applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version)
VALUES ('001_initial')
ON CONFLICT (version) DO NOTHING;


COMMIT;