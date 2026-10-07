BEGIN;

CREATE TABLE IF NOT EXISTS system_shares (
	id TEXT PRIMARY KEY,
	system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
	recipient_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	role TEXT NOT NULL DEFAULT 'viewer'
		CHECK (role IN ('viewer', 'contributor')),
	status TEXT NOT NULL DEFAULT 'pending'
		CHECK (status IN ('pending', 'accepted', 'revoked')),
	permissions JSONB NOT NULL DEFAULT '{
		"viewMembers": true,
		"viewFronting": true,
		"viewFrontHistory": false,
		"viewChat": false,
		"participateChat": false,
		"viewJournal": false,
		"viewPolls": false
	}'::jsonb,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS system_shares_system_id_idx
	ON system_shares(system_id);

CREATE INDEX IF NOT EXISTS system_shares_recipient_account_id_idx
	ON system_shares(recipient_account_id);

CREATE INDEX IF NOT EXISTS system_shares_status_idx
	ON system_shares(status);

CREATE UNIQUE INDEX IF NOT EXISTS system_shares_active_recipient_idx
	ON system_shares(system_id, recipient_account_id)
	WHERE status IN ('pending', 'accepted');

COMMIT;
