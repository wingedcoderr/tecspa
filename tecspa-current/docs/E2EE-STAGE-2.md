# TECSPA E2EE — Stage 2

This stage adds the account master-key lifecycle without encrypting application records yet.

## What is implemented

- A random 256-bit AES-GCM account master key is generated in the browser.
- The master key is wrapped with a key derived from the user's password using PBKDF2-HMAC-SHA-256.
- Only the wrapped ciphertext is stored in PostgreSQL.
- The unwrapped master key is held only in browser memory.
- The key is cleared from the client on logout.
- Existing accounts without a key are initialized on their next successful login.

## What is NOT implemented yet

This does **not** make TECSPA end-to-end encrypted yet. Existing members, journals, chat, front history, polls, imports, and media still use their existing plaintext APIs/storage. The next stage must migrate actual data paths to use the master key.

## Important recovery property

The server cannot unwrap the stored account key without the user's password. This also means a future password-reset flow cannot silently recover private data unless TECSPA has a separate recovery-key mechanism.
