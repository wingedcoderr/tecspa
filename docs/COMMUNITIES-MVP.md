# TECSPA Communities — MVP prototype

## Included in this ZIP

- `/communities` responsive community UI.
- Community selector, sample public spaces, channels, create-community form, create-channel form, message composer, and “posting as” member selector.
- Member identity list is read from the existing encrypted vault only after the encryption key is unlocked.
- UI follows TECSPA's existing CSS-variable theme approach and includes narrow-screen layout.

## Important limitations

This is a **front-end prototype only**. Community/channel/post data is held in Svelte page memory and disappears on navigation/reload. Sample content is fictional. No community database migration, persistent API, moderation, join/leave membership, notifications, reporting, or server-side permissions are implemented in this ZIP. The Public/Private selector is currently a UI concept and does not enforce access control. Do not use it for real sensitive conversations or deploy it as a working social network yet.

The post composer labels the chosen local member identity, but it does not yet publish that identity to a backend. It intentionally does not read or expose private profile fields other than a member's display name.

## Security design required before persistence

- Authenticate every operation using the existing TECSPA account/session.
- Store community membership separately from a system's internal member profiles.
- Authorize every channel read/write server-side; never trust a client-supplied system/member ID.
- Only expose explicit public-profile fields, not private TECSPA records.
- Treat public posts as public. Private channel E2EE requires recipient-specific key distribution and revocation design; the existing single-account encrypted vault is not a multi-user sharing system.
- Add abuse prevention, rate limits, moderation, reporting, and privacy-safe audit logs.
- Add migration SQL, API tests, authorization tests, and an independent review before production.
