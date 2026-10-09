/*
 * TECSPA PostgreSQL migration 003
 *
 * Adds the system owned by each TECSPA account.
 *
 * One account owns one primary system.
 * Alters/headmates belong to the system, not to accounts directly.
 */

BEGIN;


/*
 * =========================================================
 * SYSTEMS
 * =========================================================
 */

CREATE TABLE IF NOT EXISTS systems (
	id TEXT PRIMARY KEY NOT NULL,
	owner_account_id TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL DEFAULT 'My TECSPA System',
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,

	CONSTRAINT fk_systems_owner
		FOREIGN KEY (owner_account_id)
		REFERENCES accounts(id)
		ON DELETE CASCADE
);


/*
 * =========================================================
 * INDEXES
 * =========================================================
 */

CREATE INDEX IF NOT EXISTS idx_systems_owner
	ON systems(owner_account_id);


/*
 * =========================================================
 * MIGRATION RECORD
 * =========================================================
 */

INSERT INTO schema_migrations (version)
VALUES ('003_systems')
ON CONFLICT (version) DO NOTHING;


COMMIT;