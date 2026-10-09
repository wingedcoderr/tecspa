# Encrypted member media migration

Web avatar/banner uploads now use the client-side encrypted vault (`record_type = media`). The browser encrypts image data with the unlocked account master key before sending it to `/api/crypto/vault`; the media API never receives plaintext image bytes. The member profile stores an opaque `e2ee-media:<member-id>:<kind>` reference, and the browser resolves that reference only after decrypting the vault record locally.

## Existing images

Legacy web image object keys cannot be safely migrated by reading them from the old media endpoint: that would send plaintext to the browser through a server path that has access to the old object. To preserve the privacy guarantee, legacy object keys are not fetched. Users must choose the original image file again in Edit Member and save it into the encrypted vault. Existing records are not deleted by this change. If the original file is unavailable, do not remove the old object or database row; an owner-controlled export/migration tool is still needed before old media can be retired.

## Limits and caveats

- Web uploads are limited to 1 MiB per image because the JSON vault API has a 2 MB serialized-payload limit and base64 adds overhead.
- This change covers web member avatar/banner uploads only. Desktop images are still stored as ordinary local files and are not encrypted at rest by this helper.
- This does not make all TECSPA data end-to-end encrypted. Sharing, other media types, recovery, and the rest of the legacy-data migration remain separate work.
