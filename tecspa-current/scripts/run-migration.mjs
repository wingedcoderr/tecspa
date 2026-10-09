import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationName = process.argv[2];

if (!migrationName) {
	console.error(
		'Usage: node scripts/run-migration.mjs <migration-file>'
	);
	process.exit(1);
}

if (!migrationName.endsWith('.sql')) {
	console.error('Migration file must be a .sql file.');
	process.exit(1);
}

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not configured.');
	process.exit(1);
}

const migrationPath = path.join(
	__dirname,
	'..',
	'src',
	'lib',
	'server',
	'db',
	'migrations',
	migrationName
);

const sql = await readFile(migrationPath, 'utf8');

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

try {
	console.log(`Applying migration: ${migrationName}`);

	await pool.query(sql);

	console.log(`Migration applied successfully: ${migrationName}`);
} catch (error) {
	console.error(`Migration failed: ${migrationName}`);
	console.error(error);
	process.exitCode = 1;
} finally {
	await pool.end();
}