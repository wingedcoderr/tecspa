# E2EE Stage 4 — member-profile integration (partial)

This stage connects the web data adapter's member list, member lookup, member update, member deletion, and fronting-state operations to the encrypted vault. The web member-create form also writes new member profiles to the vault. Member profile objects (including custom fields and any inline data URI fields) are serialized and encrypted in the browser using the in-memory account master key before the request reaches `/api/crypto/vault`.

## Important limitations — not full E2EE

- This is a first vertical slice, not a complete TECSPA security implementation.
- Existing member rows in PostgreSQL are **not migrated** by this stage. Because the web adapter now reads member profiles from the encrypted vault, existing web member records may not appear until a separately designed, backed-up migration is implemented. Do not apply this build to a production account expecting existing member records to be migrated automatically.
- Legacy `/api/members` and import endpoints still exist and can write or return plaintext. Other application features and import flows have not all been converted to the encrypted vault. This means the application as a whole is **not yet zero-knowledge / fully E2EE**.
- Media URLs already stored as server URLs still point to the existing media service and are not thereby encrypted. Large inline data URIs can exceed the vault API's payload limit. Dedicated client-side media encryption is still required.
- Desktop SQLite remains outside this web-vault integration and is not protected by it.
- Server-side authorization and metadata remain visible. The web-delivered JavaScript threat model also requires separate review.

## Verification

Run `npm.cmd run check` in a clean install. This environment could not complete `npm ci` within its execution window, so no successful type-check or build is claimed for this ZIP. Review and test this stage on a backup/test account before using it with existing data.


## Legacy member copy migration

The empty member directory now offers a web-only, explicit migration action when no encrypted member records exist. It fetches the current authenticated user's legacy `/api/members` response, encrypts each complete member object in the browser using the in-memory master key, and writes encrypted copies to `/api/crypto/vault`. It deliberately does not delete or modify legacy PostgreSQL rows. If an error occurs midway, some encrypted copies may already exist; retrying uses stable member IDs and overwrites those encrypted copies safely. This migration does not encrypt media bytes or remove the legacy plaintext API. Do not describe the overall application as fully E2EE until those remaining paths are addressed and tested.
