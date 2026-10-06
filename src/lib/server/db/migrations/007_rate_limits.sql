/*
 * TECSPA PostgreSQL migration 007
 *
 * Adds the rate limiting table used by the API
 * authentication endpoints.
 */

BEGIN;


/*
 * =========================================================
 * RATE LIMITS
 * =========================================================
 */

CREATE TABLE IF NOT EXISTS rate_limits (
	key TEXT PRIMARY KEY,
	window_start timestamptz NOT NULL,
	count integer NOT NULL
);


/*
 * =========================================================
 * MIGRATION RECORD
 * =========================================================
 */

INSERT INTO schema_migrations (version)
VALUES ('007_rate_limits')
ON CONFLICT (version) DO NOTHING;


COMMIT;
