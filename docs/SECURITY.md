# TECSPA security architecture

## Current status

TECSPA currently uses authenticated server-side PostgreSQL APIs for the web application. Existing member, journal, chat, front-history, poll, and media APIs therefore still receive plaintext application data.

The client-side encryption primitives in `src/lib/crypto/e2ee.ts` are the foundation for the planned zero-knowledge migration. **They do not, by themselves, make the current web application end-to-end encrypted.**

Do not claim that the current production deployment is E2EE until the repositories, API routes, sharing flow, media flow, authentication/key recovery flow, and migrations have all been converted and independently reviewed.

## Encryption primitive

The foundation uses Web Crypto:

- AES-256-GCM for authenticated encryption
- PBKDF2-HMAC-SHA-256 for password-based key derivation
- 600,000 PBKDF2 iterations
- fresh random 128-bit salts
- fresh random 96-bit AES-GCM IVs

The plaintext encryption key is intentionally never sent to the server by these primitives.

## Planned zero-knowledge migration

1. Generate a random account master key in the browser.
2. Encrypt/wrap that master key with a key derived locally from the user's password.
3. Store only the wrapped master key and public account metadata server-side.
4. Encrypt private system records before they leave the browser.
5. Store ciphertext rather than plaintext for private fields in PostgreSQL/object storage.
6. Use per-share keys or public-key wrapping so recipients can decrypt only the data explicitly shared with them.
7. Move server-side plaintext-dependent features into client-side operations or redesign them around encrypted metadata.
8. Provide an explicit recovery-key flow; a server-side password reset must not silently recover the user's encrypted data.
9. Migrate existing plaintext records explicitly. Existing plaintext data must be treated as already exposed to the server and must not be described as retroactively zero-knowledge.

## Important

The server still needs some metadata for authentication, routing, rate limiting, invitations, permissions, and delivery. Zero-knowledge does not mean that the server knows nothing; it means the server cannot decrypt protected application content.
