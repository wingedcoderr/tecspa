/*
 * TECSPA PostgreSQL migration 006
 *
 * Associates all remaining system-owned data with a TECSPA system.
 *
 * Members already received system_id in migration 005.
 * This migration propagates that ownership to:
 *
 *   custom_fields
 *   front_history
 *   chat_messages
 *   journal_entries
 *   polls
 *   poll_options
 *   poll_votes
 *
 * The existing database currently contains one account-owned system,
 * so all existing data is assigned to that system.
 */

BEGIN;

DO $$
DECLARE
	target_system_id TEXT;
	system_count INTEGER;
BEGIN
	SELECT COUNT(*)
	INTO system_count
	FROM systems;

	IF system_count <> 1 THEN
		RAISE EXCEPTION
			'Migration 006 expected exactly 1 TECSPA system, found %',
			system_count;
	END IF;

	SELECT id
	INTO target_system_id
	FROM systems
	LIMIT 1;

	/*
	 * =========================================================
	 * CUSTOM FIELDS
	 * =========================================================
	 */

	ALTER TABLE custom_fields
	ADD COLUMN IF NOT EXISTS system_id TEXT;

	UPDATE custom_fields cf
	SET system_id = m.system_id
	FROM members m
	WHERE cf.member_id = m.id
	  AND cf.system_id IS NULL;

	/*
	 * =========================================================
	 * FRONT HISTORY
	 * =========================================================
	 */

	ALTER TABLE front_history
	ADD COLUMN IF NOT EXISTS system_id TEXT;

	UPDATE front_history fh
	SET system_id = m.system_id
	FROM members m
	WHERE fh.member_id = m.id
	  AND fh.system_id IS NULL;

	/*
	 * =========================================================
	 * CHAT MESSAGES
	 * =========================================================
	 */

	ALTER TABLE chat_messages
	ADD COLUMN IF NOT EXISTS system_id TEXT;

	UPDATE chat_messages cm
	SET system_id = m.system_id
	FROM members m
	WHERE cm.sender_member_id = m.id
	  AND cm.system_id IS NULL;

	/*
	 * =========================================================
	 * JOURNAL / NOTES
	 * =========================================================
	 */

	ALTER TABLE journal_entries
	ADD COLUMN IF NOT EXISTS system_id TEXT;

	UPDATE journal_entries je
	SET system_id = m.system_id
	FROM members m
	WHERE je.author_member_id = m.id
	  AND je.system_id IS NULL;

	/*
	 * Existing journal entries may have a NULL author.
	 *
	 * There are currently no journal entries, but if there are
	 * any system-level entries, assign them to the existing
	 * primary system.
	 */

	UPDATE journal_entries
	SET system_id = target_system_id
	WHERE system_id IS NULL;

	/*
	 * =========================================================
	 * POLLS
	 * =========================================================
	 */

	ALTER TABLE polls
	ADD COLUMN IF NOT EXISTS system_id TEXT;

	UPDATE polls p
	SET system_id = m.system_id
	FROM members m
	WHERE p.creator_member_id = m.id
	  AND p.system_id IS NULL;

	/*
	 * =========================================================
	 * POLL OPTIONS
	 * =========================================================
	 */

	ALTER TABLE poll_options
	ADD COLUMN IF NOT EXISTS system_id TEXT;

	UPDATE poll_options po
	SET system_id = p.system_id
	FROM polls p
	WHERE po.poll_id = p.id
	  AND po.system_id IS NULL;

	/*
	 * =========================================================
	 * POLL VOTES
	 * =========================================================
	 */

	ALTER TABLE poll_votes
	ADD COLUMN IF NOT EXISTS system_id TEXT;

	UPDATE poll_votes pv
	SET system_id = p.system_id
	FROM polls p
	WHERE pv.poll_id = p.id
	  AND pv.system_id IS NULL;

	/*
	 * =========================================================
	 * FOREIGN KEYS
	 * =========================================================
	 */

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_custom_fields_system'
	) THEN
		ALTER TABLE custom_fields
		ADD CONSTRAINT fk_custom_fields_system
		FOREIGN KEY (system_id)
		REFERENCES systems(id)
		ON DELETE CASCADE;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_front_history_system'
	) THEN
		ALTER TABLE front_history
		ADD CONSTRAINT fk_front_history_system
		FOREIGN KEY (system_id)
		REFERENCES systems(id)
		ON DELETE CASCADE;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_chat_messages_system'
	) THEN
		ALTER TABLE chat_messages
		ADD CONSTRAINT fk_chat_messages_system
		FOREIGN KEY (system_id)
		REFERENCES systems(id)
		ON DELETE CASCADE;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_journal_entries_system'
	) THEN
		ALTER TABLE journal_entries
		ADD CONSTRAINT fk_journal_entries_system
		FOREIGN KEY (system_id)
		REFERENCES systems(id)
		ON DELETE CASCADE;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_polls_system'
	) THEN
		ALTER TABLE polls
		ADD CONSTRAINT fk_polls_system
		FOREIGN KEY (system_id)
		REFERENCES systems(id)
		ON DELETE CASCADE;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_poll_options_system'
	) THEN
		ALTER TABLE poll_options
		ADD CONSTRAINT fk_poll_options_system
		FOREIGN KEY (system_id)
		REFERENCES systems(id)
		ON DELETE CASCADE;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_poll_votes_system'
	) THEN
		ALTER TABLE poll_votes
		ADD CONSTRAINT fk_poll_votes_system
		FOREIGN KEY (system_id)
		REFERENCES systems(id)
		ON DELETE CASCADE;
	END IF;

	/*
	 * =========================================================
	 * INDEXES
	 * =========================================================
	 */

	CREATE INDEX IF NOT EXISTS idx_custom_fields_system
		ON custom_fields(system_id);

	CREATE INDEX IF NOT EXISTS idx_front_history_system
		ON front_history(system_id);

	CREATE INDEX IF NOT EXISTS idx_chat_messages_system
		ON chat_messages(system_id);

	CREATE INDEX IF NOT EXISTS idx_journal_entries_system
		ON journal_entries(system_id);

	CREATE INDEX IF NOT EXISTS idx_polls_system
		ON polls(system_id);

	CREATE INDEX IF NOT EXISTS idx_poll_options_system
		ON poll_options(system_id);

	CREATE INDEX IF NOT EXISTS idx_poll_votes_system
		ON poll_votes(system_id);

	/*
	 * =========================================================
	 * REQUIRE OWNERSHIP
	 * =========================================================
	 */

	ALTER TABLE custom_fields
	ALTER COLUMN system_id SET NOT NULL;

	ALTER TABLE front_history
	ALTER COLUMN system_id SET NOT NULL;

	ALTER TABLE chat_messages
	ALTER COLUMN system_id SET NOT NULL;

	ALTER TABLE journal_entries
	ALTER COLUMN system_id SET NOT NULL;

	ALTER TABLE polls
	ALTER COLUMN system_id SET NOT NULL;

	ALTER TABLE poll_options
	ALTER COLUMN system_id SET NOT NULL;

	ALTER TABLE poll_votes
	ALTER COLUMN system_id SET NOT NULL;
END;
$$;

INSERT INTO schema_migrations (version)
VALUES ('006_system_data')
ON CONFLICT (version) DO NOTHING;

COMMIT;