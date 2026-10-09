import { env } from '$env/dynamic/private';
import { Pool } from 'pg';

if (!env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not configured.');
}

const globalForDb = globalThis as typeof globalThis & {
	tecspaPostgresPool?: Pool;
};

export const pool =
	globalForDb.tecspaPostgresPool ??
	new Pool({
		connectionString: env.DATABASE_URL
	});

if (process.env.NODE_ENV !== 'production') {
	globalForDb.tecspaPostgresPool = pool;
}