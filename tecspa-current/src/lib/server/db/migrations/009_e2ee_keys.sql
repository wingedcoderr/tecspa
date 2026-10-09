BEGIN;

-- Stores only the password-wrapped account master key.
-- The plaintext master key is generated and unwrapped in the client.
CREATE TABLE IF NOT EXISTS account_encryption_keys (
	account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
	encrypted_key JSONB NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
