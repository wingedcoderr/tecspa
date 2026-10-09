# TECSPA E2EE Stage 3 — encrypted vault vertical slice

## What this stage implements

- AES-GCM record encryption/decryption using the random account master key held in page memory.
- A PostgreSQL table for encrypted JSON envelopes only (`010_e2ee_vault.sql`).
- Authenticated `/api/crypto/vault` GET/PUT/DELETE endpoints. The API validates the envelope and stores ciphertext without a decryption key.
- A client helper (`src/lib/crypto/vault.ts`) that encrypts before PUT and decrypts only after GET.
- The vault route scopes records to the authenticated account's own system and limits record types and payload size.

## Critical limitation — not full E2EE yet

This is a secure-storage vertical slice, **not a full conversion of TECSPA**. Existing members, chat, journal, polls, front history, imports, sharing endpoints, and media routes still use their previous data paths and may store or return plaintext. The new vault helper is not yet the backing store for those existing features. Do not claim TECSPA is fully end-to-end encrypted, and do not use this ZIP as evidence that existing private data is protected from the server operator.

Sharing is not implemented for vault records. The vault currently only permits the authenticated system owner. Do not store shared records here until recipient key wrapping and revocation semantics are implemented.

## Apply migration

After configuring `DATABASE_URL`, run:

```powershell
npm.cmd run db:migrate -- 010_e2ee_vault.sql
```

Then run:

```powershell
npm.cmd run check
```

## Manual smoke-test suggestion

After logging in, in browser devtools or a temporary client-side test, use `saveEncryptedRecord('custom', 'e2ee-smoke-test', { message: 'secret test' })`, then `loadEncryptedRecord('custom', 'e2ee-smoke-test')`, and finally `deleteEncryptedRecord('custom', 'e2ee-smoke-test')`. The master key must already be unlocked in that page session. Do not put real private information into this test.

Inspect the `e2ee_vault_records.encrypted_payload` database value: it should contain only the envelope fields (`version`, `algorithm`, `iv`, `ciphertext`), not the test message. Wrong-key/tamper tests should reject decryption.

## Remaining work before a full E2EE claim

1. Migrate every private-data read/write path to this or an equivalent encrypted format.
2. Encrypt media client-side before upload and decrypt only after download.
3. Rework import/export to avoid sending plaintext private data to the server.
4. Implement recipient-specific share-key wrapping, revocation, and contributor writes.
5. Implement recovery/device transfer without giving the server decryption keys.
6. Review server-delivered client code and deployment integrity; a server able to replace JavaScript can otherwise capture keys/plaintext.
7. Add automated tests for key handling, ciphertext tampering, all endpoints, permissions, migration/rollback, and desktop/web parity.
8. Migrate existing plaintext records safely, with verified backups and no silent deletion.
