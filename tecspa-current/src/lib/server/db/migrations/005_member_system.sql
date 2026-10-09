/*
 * TECSPA PostgreSQL migration 005
 *
 * Associates every existing TECSPA member with the primary
 * system owned by the existing TECSPA account.
 *
 * This converts the original single-system database into
 * the account-owned system model.
 */

BEGIN;

ALTER TABLE members
ADD COLUMN IF NOT EXISTS system_id TEXT;

UPDATE members
SET system_id = '48c2c8b5522084c5abbb5467aaaa30d4'
WHERE system_id IS NULL;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_members_system'
	) THEN
		ALTER TABLE members
		ADD CONSTRAINT fk_members_system
		FOREIGN KEY (system_id)
		REFERENCES systems(id)
		ON DELETE CASCADE;
	END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_members_system
	ON members(system_id);

ALTER TABLE members
ALTER COLUMN system_id SET NOT NULL;

INSERT INTO schema_migrations (version)
VALUES ('005_member_system')
ON CONFLICT (version) DO NOTHING;

COMMIT;