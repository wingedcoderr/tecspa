import {
	createHash,
	randomBytes,
	scrypt as scryptCallback,
	timingSafeEqual
} from 'node:crypto';
import type { BinaryLike, ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';

import { pool } from '$lib/server/db/postgres';

const scrypt = promisify(scryptCallback) as (
	password: BinaryLike,
	salt: BinaryLike,
	keylen: number,
	options: ScryptOptions
) => Promise<Buffer>;

const SCRYPT_N = 2 ** 15;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

const SESSION_COOKIE = 'tecspa_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export interface PublicAccount {
	id: string;
	username: string;
}

interface AccountRow {
	id: string;
	email: string;
	username: string;
	password_hash: string;
}

interface SessionRow {
	id: string;
	account_id: string;
	token_hash: string;
	expires_at: string;
}

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function normalizeUsername(username: string): string {
	return username.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUsername(username: string): boolean {
	return /^[a-zA-Z0-9_]{3,32}$/.test(username);
}

export function isValidPassword(password: string): boolean {
	return password.length >= 8 && password.length <= 1024;
}

async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);

	const derivedKey = await scrypt(password, salt, 64, {
		N: SCRYPT_N,
		r: SCRYPT_R,
		p: SCRYPT_P,
		maxmem: SCRYPT_MAXMEM
	});

	return [
		'scrypt',
		String(SCRYPT_N),
		String(SCRYPT_R),
		String(SCRYPT_P),
		salt.toString('base64'),
		derivedKey.toString('base64')
	].join('$');
}

async function verifyPassword(
	password: string,
	storedHash: string
): Promise<boolean> {
	const parts = storedHash.split('$');

	if (parts[0] !== 'scrypt') {
		return false;
	}

	let params: { N: number; r: number; p: number };
	let salt: Buffer;
	let expectedHash: Buffer;

	// scrypt$N$r$p$<salt b64>$<key b64>
	if (parts.length === 6) {
		const N = Number(parts[1]);
		const r = Number(parts[2]);
		const p = Number(parts[3]);

		if (!Number.isInteger(N) || N < 2 ** 14 || N > 2 ** 21) {
			return false;
		}

		if (!Number.isInteger(r) || r < 8 || r > 16) {
			return false;
		}

		if (!Number.isInteger(p) || p < 1 || p > 4) {
			return false;
		}

		params = { N, r, p };
		salt = Buffer.from(parts[4], 'base64');
		expectedHash = Buffer.from(parts[5], 'base64');
	} else if (parts.length === 3) {
		// Legacy format: Node scrypt defaults (N=16384, r=8, p=1).
		params = { N: 16384, r: 8, p: 1 };
		salt = Buffer.from(parts[1], 'base64');
		expectedHash = Buffer.from(parts[2], 'base64');
	} else {
		return false;
	}

	if (salt.length === 0 || expectedHash.length === 0) {
		return false;
	}

	try {
		const derivedKey = await scrypt(password, salt, expectedHash.length, {
			...params,
			maxmem: SCRYPT_MAXMEM
		});

		if (derivedKey.length !== expectedHash.length) {
			return false;
		}

		return timingSafeEqual(derivedKey, expectedHash);
	} catch {
		return false;
	}
}

function hashSessionToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

let dummyHashPromise: Promise<string> | null = null;

function getDummyHash(): Promise<string> {
	dummyHashPromise ??= hashPassword(randomBytes(32).toString('hex'));
	return dummyHashPromise;
}

export function getSessionCookieName(): string {
	return SESSION_COOKIE;
}

export async function createAccount(
	email: string,
	username: string,
	password: string
): Promise<PublicAccount> {
	const normalizedEmail = normalizeEmail(email);
	const normalizedUsername = normalizeUsername(username);

	const now = new Date().toISOString();
	const id = crypto.randomUUID();
	const passwordHash = await hashPassword(password);

	const result = await pool.query<AccountRow>(
		`
			INSERT INTO accounts (
				id,
				email,
				username,
				password_hash,
				created_at,
				updated_at
			)
			VALUES ($1, $2, $3, $4, $5, $5)
			RETURNING id, email, username, password_hash
		`,
		[
			id,
			normalizedEmail,
			normalizedUsername,
			passwordHash,
			now
		]
	);

	const account = result.rows[0];

	return {
		id: account.id,
		username: account.username
	};
}

export async function findAccountByEmail(
	email: string
): Promise<AccountRow | null> {
	const normalizedEmail = normalizeEmail(email);

	const result = await pool.query<AccountRow>(
		`
			SELECT
				id,
				email,
				username,
				password_hash
			FROM accounts
			WHERE email = $1
			LIMIT 1
		`,
		[normalizedEmail]
	);

	return result.rows[0] ?? null;
}

export async function authenticateAccount(
	email: string,
	password: string
): Promise<PublicAccount | null> {
	const account = await findAccountByEmail(email);

	if (!account) {
		await getDummyHash();
		return null;
	}

	const valid = await verifyPassword(
		password,
		account.password_hash
	);

	if (!valid) {
		return null;
	}

	return {
		id: account.id,
		username: account.username
	};
}

async function deleteExpiredSessions(): Promise<void> {
	await pool.query(
		`
			DELETE FROM sessions
			WHERE expires_at::timestamptz <= now()
		`
	);
}

export async function createSession(accountId: string): Promise<{
	token: string;
	expiresAt: Date;
}> {
	const token = randomBytes(32).toString('hex');
	const tokenHash = hashSessionToken(token);

	const expiresAt = new Date(
		Date.now() + SESSION_DURATION_MS
	);

	const id = crypto.randomUUID();
	const createdAt = new Date().toISOString();

	await pool.query(
		`
			INSERT INTO sessions (
				id,
				account_id,
				token_hash,
				expires_at,
				created_at
			)
			VALUES ($1, $2, $3, $4, $5)
		`,
		[
			id,
			accountId,
			tokenHash,
			expiresAt.toISOString(),
			createdAt
		]
	);

	await deleteExpiredSessions();

	return {
		token,
		expiresAt
	};
}

export async function getAccountFromSession(
	token: string | undefined
): Promise<PublicAccount | null> {
	if (!token) {
		return null;
	}

	const tokenHash = hashSessionToken(token);

	const result = await pool.query<
		SessionRow & {
			username: string;
		}
	>(
		`
			SELECT
				s.id,
				s.account_id,
				s.token_hash,
				s.expires_at,
				a.username
			FROM sessions s
			INNER JOIN accounts a
				ON a.id = s.account_id
			WHERE s.token_hash = $1
			LIMIT 1
		`,
		[tokenHash]
	);

	const session = result.rows[0];

	if (!session) {
		return null;
	}

	const expiresAt = new Date(session.expires_at);

	if (expiresAt.getTime() <= Date.now()) {
		await deleteSession(token);
		await deleteExpiredSessions();
		return null;
	}

	return {
		id: session.account_id,
		username: session.username
	};
}

export async function deleteSession(
	token: string | undefined
): Promise<void> {
	if (!token) {
		return;
	}

	const tokenHash = hashSessionToken(token);

	await pool.query(
		`
			DELETE FROM sessions
			WHERE token_hash = $1
		`,
		[tokenHash]
	);
}

export async function deleteAllAccountSessions(
	accountId: string
): Promise<void> {
	await pool.query(
		`
			DELETE FROM sessions
			WHERE account_id = $1
		`,
		[accountId]
	);
}