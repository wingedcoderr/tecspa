import Database from 'better-sqlite3';
import path from 'node:path';
import os from 'node:os';

const databasePath = path.join(
	os.homedir(),
	'AppData',
	'Roaming',
	'com.tecspa.app',
	'tecspa.db'
);

const db = new Database(databasePath, {
	readonly: true
});

const tables = [
	'members',
	'custom_fields',
	'front_history',
	'chat_messages',
	'journal_entries',
	'polls',
	'poll_options',
	'poll_votes'
];

console.log(`SQLite database: ${databasePath}`);
console.log('');

for (const table of tables) {
	const result = db
		.prepare(`SELECT COUNT(*) AS count FROM "${table}"`)
		.get() as { count: number };

	console.log(`${table.padEnd(20)} ${result.count}`);
}

db.close();

console.log('');
console.log('Inspection complete. SQLite was opened read-only.');