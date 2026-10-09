import 'dotenv/config';

import Database from 'better-sqlite3';
import path from 'node:path';
import os from 'node:os';

import { Pool } from 'pg';

const sqlitePath = path.join(
	os.homedir(),
	'AppData',
	'Roaming',
	'com.tecspa.app',
	'tecspa.db'
);

const database = new Database(sqlitePath, {
	readonly: true
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error(
		'DATABASE_URL is not available. Make sure your Neon connection string is configured in the environment.'
	);
}

const pool = new Pool({
	connectionString: databaseUrl
});

type MemberRow = {
	id: string;
	name: string;
	pronouns: string;
	aliases: string;
	role: string;
	status: string;
	about: string;
	interests: string;
	front_triggers: string;
	avatar: string;
	banner: string;
	is_fronting: number;
};

type CustomFieldRow = {
	id: string;
	member_id: string;
	label: string;
	type: string;
	value: string;
	description: string;
	sort_order: number;
};

type FrontHistoryRow = {
	id: string;
	member_id: string;
	started_at: string;
	ended_at: string | null;
	note: string;
};

type ChatMessageRow = {
	id: string;
	sender_member_id: string;
	message: string;
	created_at: string;
	edited_at: string | null;
};

type JournalEntryRow = {
	id: string;
	author_member_id: string | null;
	entry_type: string;
	title: string;
	body: string;
	tags: string;
	is_pinned: number;
	created_at: string;
	updated_at: string;
};

type PollRow = {
	id: string;
	creator_member_id: string;
	question: string;
	allow_multiple: number;
	created_at: string;
	closed_at: string | null;
};

type PollOptionRow = {
	id: string;
	poll_id: string;
	label: string;
	sort_order: number;
};

type PollVoteRow = {
	id: string;
	poll_id: string;
	option_id: string;
	member_id: string;
	created_at: string;
};

function parseJsonArray(value: string, fieldName: string): string[] {
	try {
		const parsed = JSON.parse(value);

		if (!Array.isArray(parsed)) {
			throw new Error(`Expected an array.`);
		}

		return parsed;
	} catch (error) {
		throw new Error(
			`Failed to parse JSON array in ${fieldName}: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

function toBoolean(value: unknown): number {
	if (value === true || value === 1 || value === '1' || value === 'true') {
		return 1;
	}

	return 0;
}

async function getNeonCounts() {
	const result = await pool.query(`
		SELECT
			(SELECT COUNT(*) FROM members) AS members,
			(SELECT COUNT(*) FROM custom_fields) AS custom_fields,
			(SELECT COUNT(*) FROM front_history) AS front_history,
			(SELECT COUNT(*) FROM chat_messages) AS chat_messages,
			(SELECT COUNT(*) FROM journal_entries) AS journal_entries,
			(SELECT COUNT(*) FROM polls) AS polls,
			(SELECT COUNT(*) FROM poll_options) AS poll_options,
			(SELECT COUNT(*) FROM poll_votes) AS poll_votes;
	`);

	return result.rows[0] as Record<string, string>;
}

async function migrate() {
	console.log('TECSPA SQLite → Neon migration');
	console.log('================================');
	console.log('');
	console.log(`SQLite database: ${sqlitePath}`);
	console.log('');

	console.log('Checking Neon connection...');

	await pool.query('SELECT 1');

	console.log('Neon connection OK.');
	console.log('');

	const neonCounts = await getNeonCounts();

	const existingRows = Object.values(neonCounts).some(
		(count) => Number(count) > 0
	);

	if (existingRows) {
		console.error('STOP: Neon already contains data.');
		console.error('');
		console.error('Current Neon row counts:');

		for (const [table, count] of Object.entries(neonCounts)) {
			console.error(`  ${table.padEnd(20)} ${count}`);
		}

		console.error('');
		console.error(
			'This migration refuses to insert anything when Neon already contains data.'
		);
		console.error(
			'This prevents accidentally duplicating or overwriting your existing data.'
		);

		return;
	}

	const members = database
		.prepare(`
			SELECT
				id,
				name,
				pronouns,
				aliases,
				role,
				status,
				about,
				interests,
				front_triggers,
				avatar,
				banner,
				is_fronting
			FROM members
			ORDER BY name;
		`)
		.all() as MemberRow[];

	const customFields = database
		.prepare(`
			SELECT
				id,
				member_id,
				label,
				type,
				value,
				description,
				sort_order
			FROM custom_fields
			ORDER BY member_id, sort_order;
		`)
		.all() as CustomFieldRow[];

	const frontHistory = database
		.prepare(`
			SELECT
				id,
				member_id,
				started_at,
				ended_at,
				note
			FROM front_history
			ORDER BY started_at;
		`)
		.all() as FrontHistoryRow[];

	const chatMessages = database
		.prepare(`
			SELECT
				id,
				sender_member_id,
				message,
				created_at,
				edited_at
			FROM chat_messages
			ORDER BY created_at;
		`)
		.all() as ChatMessageRow[];

	const journalEntries = database
		.prepare(`
			SELECT
				id,
				author_member_id,
				entry_type,
				title,
				body,
				tags,
				is_pinned,
				created_at,
				updated_at
			FROM journal_entries
			ORDER BY created_at;
		`)
		.all() as JournalEntryRow[];

	const polls = database
		.prepare(`
			SELECT
				id,
				creator_member_id,
				question,
				allow_multiple,
				created_at,
				closed_at
			FROM polls
			ORDER BY created_at;
		`)
		.all() as PollRow[];

	const pollOptions = database
		.prepare(`
			SELECT
				id,
				poll_id,
				label,
				sort_order
			FROM poll_options
			ORDER BY poll_id, sort_order;
		`)
		.all() as PollOptionRow[];

	const pollVotes = database
		.prepare(`
			SELECT
				id,
				poll_id,
				option_id,
				member_id,
				created_at
			FROM poll_votes
			ORDER BY created_at;
		`)
		.all() as PollVoteRow[];

	console.log('SQLite data loaded:');
	console.log(`  members              ${members.length}`);
	console.log(`  custom_fields        ${customFields.length}`);
	console.log(`  front_history        ${frontHistory.length}`);
	console.log(`  chat_messages        ${chatMessages.length}`);
	console.log(`  journal_entries      ${journalEntries.length}`);
	console.log(`  polls                ${polls.length}`);
	console.log(`  poll_options         ${pollOptions.length}`);
	console.log(`  poll_votes           ${pollVotes.length}`);
	console.log('');

	const client = await pool.connect();

	try {
		await client.query('BEGIN');

		console.log('Uploading members...');

		for (const member of members) {
			await client.query(
				`
					INSERT INTO members (
						id,
						name,
						pronouns,
						aliases,
						role,
						status,
						about,
						interests,
						front_triggers,
						avatar,
						banner,
						is_fronting
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5,
						$6,
						$7,
						$8,
						$9,
						$10,
						$11,
						$12
					);
				`,
				[
					member.id,
					member.name,
					member.pronouns,
					JSON.stringify(parseJsonArray(member.aliases, `members.aliases (${member.id})`)),
					member.role,
					member.status,
					member.about,
					JSON.stringify(
						parseJsonArray(member.interests, `members.interests (${member.id})`)
					),
					JSON.stringify(
						parseJsonArray(
							member.front_triggers,
							`members.front_triggers (${member.id})`
						)
					),
					member.avatar,
					member.banner,
					toBoolean(member.is_fronting)
				]
			);
		}

		console.log(`  ✓ ${members.length} members`);

		console.log('Uploading custom fields...');

		for (const field of customFields) {
			await client.query(
				`
					INSERT INTO custom_fields (
						id,
						member_id,
						label,
						type,
						value,
						description,
						sort_order
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5,
						$6,
						$7
					);
				`,
				[
					field.id,
					field.member_id,
					field.label,
					field.type,
					field.value,
					field.description,
					field.sort_order
				]
			);
		}

		console.log(`  ✓ ${customFields.length} custom fields`);

		console.log('Uploading front history...');

		for (const entry of frontHistory) {
			await client.query(
				`
					INSERT INTO front_history (
						id,
						member_id,
						started_at,
						ended_at,
						note
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5
					);
				`,
				[
					entry.id,
					entry.member_id,
					entry.started_at,
					entry.ended_at,
					entry.note
				]
			);
		}

		console.log(`  ✓ ${frontHistory.length} front-history entries`);

		console.log('Uploading chat messages...');

		for (const message of chatMessages) {
			await client.query(
				`
					INSERT INTO chat_messages (
						id,
						sender_member_id,
						message,
						created_at,
						edited_at
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5
					);
				`,
				[
					message.id,
					message.sender_member_id,
					message.message,
					message.created_at,
					message.edited_at
				]
			);
		}

		console.log(`  ✓ ${chatMessages.length} chat messages`);

		console.log('Uploading journal entries...');

		for (const entry of journalEntries) {
			await client.query(
				`
					INSERT INTO journal_entries (
						id,
						author_member_id,
						entry_type,
						title,
						body,
						tags,
						is_pinned,
						created_at,
						updated_at
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5,
						$6,
						$7,
						$8,
						$9
					);
				`,
				[
					entry.id,
					entry.author_member_id,
					entry.entry_type,
					entry.title,
					entry.body,
					JSON.stringify(
						parseJsonArray(entry.tags, `journal_entries.tags (${entry.id})`)
					),
					toBoolean(entry.is_pinned),
					entry.created_at,
					entry.updated_at
				]
			);
		}

		console.log(`  ✓ ${journalEntries.length} journal entries`);

		console.log('Uploading polls...');

		for (const poll of polls) {
			await client.query(
				`
					INSERT INTO polls (
						id,
						creator_member_id,
						question,
						allow_multiple,
						created_at,
						closed_at
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5,
						$6
					);
				`,
				[
					poll.id,
					poll.creator_member_id,
					poll.question,
					toBoolean(poll.allow_multiple),
					poll.created_at,
					poll.closed_at
				]
			);
		}

		console.log(`  ✓ ${polls.length} polls`);

		console.log('Uploading poll options...');

		for (const option of pollOptions) {
			await client.query(
				`
					INSERT INTO poll_options (
						id,
						poll_id,
						label,
						sort_order
					)
					VALUES (
						$1,
						$2,
						$3,
						$4
					);
				`,
				[
					option.id,
					option.poll_id,
					option.label,
					option.sort_order
				]
			);
		}

		console.log(`  ✓ ${pollOptions.length} poll options`);

		console.log('Uploading poll votes...');

		for (const vote of pollVotes) {
			await client.query(
				`
					INSERT INTO poll_votes (
						id,
						poll_id,
						option_id,
						member_id,
						created_at
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5
					);
				`,
				[
					vote.id,
					vote.poll_id,
					vote.option_id,
					vote.member_id,
					vote.created_at
				]
			);
		}

		console.log(`  ✓ ${pollVotes.length} poll votes`);

		await client.query('COMMIT');

		console.log('');
		console.log('================================');
		console.log('Migration complete!');
		console.log('================================');
		console.log('');
		console.log('Rows inserted:');
		console.log(`  members              ${members.length}`);
		console.log(`  custom_fields        ${customFields.length}`);
		console.log(`  front_history        ${frontHistory.length}`);
		console.log(`  chat_messages        ${chatMessages.length}`);
		console.log(`  journal_entries      ${journalEntries.length}`);
		console.log(`  polls                ${polls.length}`);
		console.log(`  poll_options         ${pollOptions.length}`);
		console.log(`  poll_votes           ${pollVotes.length}`);
		console.log('');
		console.log('SQLite was opened read-only and was not modified.');
	} catch (error) {
		await client.query('ROLLBACK');

		console.error('');
		console.error('Migration failed.');
		console.error('');
		console.error(
			error instanceof Error ? error.message : String(error)
		);
		console.error('');
		console.error(
			'The Neon transaction was rolled back. No partial migration was committed.'
		);

		throw error;
	} finally {
		client.release();
	}
}

async function main() {
	try {
		await migrate();
	} finally {
		database.close();
		await pool.end();
	}
}

main().catch(() => {
	process.exitCode = 1;
});