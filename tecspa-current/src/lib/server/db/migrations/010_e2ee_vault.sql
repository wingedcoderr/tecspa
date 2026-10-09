-- Stores only client-encrypted record payloads. Do not put plaintext private data here.
CREATE TABLE IF NOT EXISTS e2ee_vault_records (
    system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL,
    record_id TEXT NOT NULL,
    encrypted_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (system_id, record_type, record_id),
    CONSTRAINT e2ee_vault_record_type_length CHECK (char_length(record_type) BETWEEN 1 AND 64),
    CONSTRAINT e2ee_vault_record_id_length CHECK (char_length(record_id) BETWEEN 1 AND 256)
);
CREATE INDEX IF NOT EXISTS e2ee_vault_records_updated_idx
    ON e2ee_vault_records (system_id, updated_at DESC);
