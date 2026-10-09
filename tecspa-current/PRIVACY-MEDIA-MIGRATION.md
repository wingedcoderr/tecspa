# Legacy member-media migration (work in progress)

This change adds a migration-only endpoint at `/api/media/migration/:memberID/:kind`.
It requires the existing authenticated TECSPA session, checks that the requested
member belongs to the authenticated system, and only accepts the expected S3 key
prefix for that member and media kind (or a legacy `data:image/...` value stored
in the member row). It is not used by normal image rendering. Responses are
marked `Cache-Control: no-store` and are limited to 1 MiB.

The browser migration button downloads each eligible legacy image, encrypts it
with the in-memory master key, saves it in the encrypted vault, decrypts the saved
copy to verify it, and only then changes the encrypted member profile reference.
It does not delete the old object or mutate the legacy member table. If migration
stops partway through, already-encrypted media records may remain, and old source
objects remain intact. The operation can be retried.

## Important limitations

- This is a transitional migration flow, not proof of complete E2EE.
- The browser necessarily receives plaintext bytes for each old image during
  migration; this is required to encrypt them client-side.
- Existing images over 1 MiB are rejected instead of silently recompressed.
- A member's old image must still have a corresponding row in the legacy
  `members` table and an allowed S3 key or embedded data URI.
- The old public-facing media route remains disabled; ordinary rendering should
  use encrypted media references only.
- Do not delete legacy S3 objects until the migrated images have been reviewed
  and independent backups are available.
