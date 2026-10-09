# Privacy and encryption implementation — current work-in-progress

## Changes in this update

- The web adapter stores member profiles, chat messages, journal entries, front-history entries, and poll records through the client-side encrypted vault.
- Web fronting status changes update the encrypted member profile and encrypted front-history records.
- Web import paths for normalized Ampersand and PluralSpace data write supported records through the encrypted vault instead of posting plaintext to legacy import APIs.
- Legacy web endpoints for member CRUD, chat, journal, front history, import, member media, and shared content return HTTP 410. They are intentionally fail-closed until encrypted implementations exist.
- Encryption-key initialization validates the expected PBKDF2 iteration count and will not overwrite an existing account key through the initialization endpoint.
- A source-guard script checks that these legacy endpoints remain disabled and the web adapter uses the encrypted vault.

## Important limitations — do not call this full E2EE yet

1. **Desktop at-rest encryption is not implemented.** Tauri SQLite still stores private data in ordinary SQLite tables and local media files are not encrypted at rest.
2. **Media is not fully integrated.** New data URIs embedded in member records are encrypted with the member record, but existing S3 object keys/media are not migrated to encrypted blobs and legacy media APIs are disabled.
3. **Sharing is incomplete.** Sharing management metadata remains, but shared content endpoints are disabled. Recipient-specific key wrapping and encrypted delivery are not implemented.
4. **Legacy plaintext records remain in PostgreSQL.** This update does not delete, migrate, or retroactively protect old rows or object-storage files. Keep database backups before migration work. Old records can remain accessible to database operators even though the app's legacy endpoints now refuse access.
5. **Legacy migration UI may not work while the legacy member endpoint is disabled.** Do not delete old database rows manually. A dedicated migration must encrypt all existing content and verify the encrypted copy before safely removing legacy plaintext.
6. **Password recovery and key rotation are incomplete.** The current initialization endpoint cannot overwrite an existing key; a dedicated verified recovery/rotation flow is required.
7. **Hostile server-delivered client code is not solved.** If the operator can replace the JavaScript delivered to a browser, that code could capture a password or decrypted data. Strong protection against this threat requires a separately trusted/signed client delivery model and review.
8. **No successful Svelte type-check/build is claimed.** Dependency installation did not finish in this environment. Run the validation steps below on the target machine.

## Validation

```powershell
npm.cmd run e2ee:source-check
npm.cmd run check
npm.cmd run build
```

The source check is a guardrail, not a security certification. Before production, add integration tests for account isolation, ciphertext tampering, migration rollback, unauthorized access, media, and sharing, then obtain an independent security review.
