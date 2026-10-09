/*
 * TECSPA PostgreSQL migration 004
 *
 * Automatically creates a primary TECSPA system whenever
 * a new account is created.
 */

BEGIN;


/*
 * =========================================================
 * ACCOUNT → SYSTEM CREATION
 * =========================================================
 */

CREATE OR REPLACE FUNCTION create_account_system()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
	INSERT INTO systems (
		id,
		owner_account_id,
		name,
		created_at,
		updated_at
	)
	VALUES (
		md5(NEW.id || ':' || clock_timestamp()::text),
		NEW.id,
		NEW.username || '''s TECSPA',
		NEW.created_at,
		NEW.created_at
	);

	RETURN NEW;
END;
$$;


/*
 * =========================================================
 * TRIGGER
 * =========================================================
 */

DROP TRIGGER IF EXISTS trg_create_account_system
ON accounts;

CREATE TRIGGER trg_create_account_system
AFTER INSERT ON accounts
FOR EACH ROW
EXECUTE FUNCTION create_account_system();


/*
 * =========================================================
 * MIGRATION RECORD
 * =========================================================
 */

INSERT INTO schema_migrations (version)
VALUES ('004_account_system_trigger')
ON CONFLICT (version) DO NOTHING;


COMMIT;