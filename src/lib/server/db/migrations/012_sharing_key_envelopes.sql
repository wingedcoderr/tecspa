-- Public ECDH identity keys and recipient-specific encrypted category-key envelopes.
-- No private keys or plaintext category keys are stored by the server.
CREATE TABLE IF NOT EXISTS account_crypto_identities (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  public_key JSONB NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS share_key_envelopes (
  share_id TEXT NOT NULL REFERENCES system_shares(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('members','fronting','front-history','chat','journal','polls')),
  envelope JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (share_id, category)
);
