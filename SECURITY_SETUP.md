# Security Setup

Security hardening on top of the upstream multi-account system model and how to deploy it.

## Upstream foundation (migrations 001–006)

Upstream owns the account/system model: `accounts` and `sessions` (002), the `systems` table (003), an account→system trigger (004), and `system_id` columns on every user-content table — `members` (005), plus `custom_fields`, `front_history`, `chat_messages`, `journal_entries`, `polls`, `poll_options`, `poll_votes` (006). All API endpoints authenticate through `getAuthenticatedSystem()` (`src/lib/server/system.ts`) and scope queries with `WHERE system_id = $1`.

## What we add on top

**`src/hooks.server.ts`** — Defense-in-depth API auth gate. On every request the hook reads the session cookie, resolves the account into `locals.account` (typed in `src/app.d.ts`), and returns `401 {"error":"Unauthorized"}` for `/api/*` requests without a valid session — except `/api/auth/*` and `/api/health/*`. Upstream endpoints authorize via `getAuthenticatedSystem()` and ignore locals; the hook additionally blocks any endpoint that forgets its own check.

**`src/lib/server/rate-limit.ts` + `007_rate_limits.sql`** — DB-backed fixed-window rate limiter. `checkRateLimit(key, limit, windowSeconds)` performs an atomic `INSERT ... ON CONFLICT (key) DO UPDATE` on the `rate_limits` table; `enforceRateLimit(...)` returns a ready-to-send `429 {"error":"Too many requests"}` response or `null`. If the table is missing (fresh database), the limiter logs an error and fails open. Login is limited to 10 attempts per 15 minutes per client IP + email, registration to 5 sign-ups per hour per client IP (`src/routes/api/auth/login/+server.ts`, `src/routes/api/auth/register/+server.ts`).

**`src/lib/server/validate.ts`** — Shared input validators: `isUuid()` (UUID regex), `sniffImageMime()` (image type from magic bytes, not client-declared Content-Type), and `ALLOWED_IMAGE_MIME`. Endpoint layering that uses them:

- Path IDs are validated with `isUuid()` → `400 Invalid id` before hitting the database or object storage.
- Input caps → `422 Invalid input`: chat messages ≤ 4000 chars after trim, journal title ≤ 300 / body ≤ 200 000, front-history notes ≤ 2000.
- List endpoints cap results with `LIMIT 500`.

**Import endpoint hardening (`src/routes/api/import/+server.ts`)** — Request body (Content-Length and measured body) ≤ 50 MB → `413`; members ≤ 200, custom fields ≤ 50 per member, front-history entries ≤ 1000 → `422`; embedded images decoded ≤ 5 MB → `413`; image type determined by `sniffImageMime()` → `415 Unsupported media type` when not an allowed image; the S3 object key extension and `ContentType` come from the sniffed type only; member IDs used in S3 keys must be UUIDs; the outer error handler logs server-side and returns a generic `500 {"error":"Import failed"}` instead of leaking internal error messages.

**Media serving hardening (`src/routes/api/media/members/[memberID]/[kind]/+server.ts`)** — The response `Content-Type` is gated by `ALLOWED_IMAGE_MIME` and falls back to `application/octet-stream` with `Content-Disposition: inline`, so a tampered S3 object cannot be served as `text/html` or another active content type.

**`src/lib/server/auth.ts`** — Password hashing and session hygiene. New hashes use scrypt with explicit parameters `N=32768, r=8, p=1` and a 64 MB `maxmem`, stored as `scrypt$32768$8$1$<salt b64>$<key b64>`. Verification accepts both the new 5-part format (parameters sanity-checked) and the legacy 3-part `scrypt$salt$key` format, so existing accounts keep working. Passwords longer than 1024 characters are rejected. Login performs a dummy scrypt derivation for unknown emails so response timing does not reveal which emails are registered. Expired session rows are deleted opportunistically.

**Tauri CSP** — The desktop build enables a restrictive Content-Security-Policy (`src-tauri/tauri.conf.json`).

## Applying the database migration

There is no automatic migration runner: no code in the repository executes the `.sql` files, they are applied manually with `psql`.

1. If the upstream chain is not applied yet, apply migrations `001` through `006` in order (see the repository README / upstream setup).
2. Apply our addition:

```sh
psql "$DATABASE_URL" -f src/lib/server/db/migrations/007_rate_limits.sql
```

The script is idempotent and safe to re-run. Verify afterwards:

```sh
psql "$DATABASE_URL" -c "SELECT version FROM schema_migrations ORDER BY version;"
```
