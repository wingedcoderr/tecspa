import { json } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { getAccountFromSession } from '$lib/server/auth';
import { pool } from '$lib/server/db/postgres';

const SESSION_COOKIE = 'tecspa_session';

async function requireAccount(cookies: Cookies) {
	const account = await getAccountFromSession(cookies.get(SESSION_COOKIE));
	if (!account) {
		return null;
	}
	return account;
}

export const GET: RequestHandler = async ({ cookies }) => {
	const account = await requireAccount(cookies);
	if (!account) {
		return json({ error: 'You must be signed in.' }, { status: 401 });
	}

	const result = await pool.query<{ encrypted_key: unknown }>(
		`SELECT encrypted_key FROM account_encryption_keys WHERE account_id = $1 LIMIT 1`,
		[account.id]
	);

	if (result.rows.length === 0) {
		return json({ initialized: false });
	}

	return json({
		initialized: true,
		key: result.rows[0].encrypted_key
	});
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const account = await requireAccount(cookies);
	if (!account) {
		return json({ error: 'You must be signed in.' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const encryptedKey = body && typeof body === 'object'
		? (body as Record<string, unknown>).key
		: null;

	if (!encryptedKey || typeof encryptedKey !== 'object' || Array.isArray(encryptedKey)) {
		return json({ error: 'A valid encrypted account key is required.' }, { status: 400 });
	}

	const payload = encryptedKey as Record<string, unknown>;
	if (
		payload.version !== 1 ||
		payload.algorithm !== 'AES-GCM' ||
		payload.kdf !== 'PBKDF2-SHA-256' ||
		payload.iterations !== 600_000 ||
		typeof payload.salt !== 'string' ||
		typeof payload.iv !== 'string' ||
		typeof payload.ciphertext !== 'string'
	) {
		return json({ error: 'Invalid TECSPA encryption key payload.' }, { status: 400 });
	}

	if (JSON.stringify(encryptedKey).length > 100_000) {
		return json({ error: 'Encryption key payload is too large.' }, { status: 413 });
	}

	const inserted = await pool.query(
		`
			INSERT INTO account_encryption_keys (account_id, encrypted_key, created_at, updated_at)
			VALUES ($1, $2::jsonb, NOW(), NOW())
			ON CONFLICT (account_id) DO NOTHING
			RETURNING account_id
		`,
		[account.id, JSON.stringify(encryptedKey)]
	);

	if (inserted.rowCount !== 1) {
		return json(
			{ error: 'An encryption key already exists. Key replacement requires the dedicated recovery flow.' },
			{ status: 409 }
		);
	}

	return json({ initialized: true });
};
