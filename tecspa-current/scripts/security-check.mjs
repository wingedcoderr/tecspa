import 'dotenv/config';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not configured.');
	process.exit(1);
}

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

let failures = 0;

function check(name, passed, details = '') {
	if (passed) {
		console.log(`✅ ${name}`);
	} else {
		console.log(`❌ ${name}`);
		if (details) {
			console.log(`   ${details}`);
		}
		failures++;
	}
}

try {
	console.log('\n=== TECSPA SECURITY / DATA ISOLATION CHECK ===\n');

	// ------------------------------------------------------------
	// 1. Accounts -> systems
	// ------------------------------------------------------------

	const accountSystems = await pool.query(`
		SELECT
			a.id AS account_id,
			a.username,
			COUNT(s.id)::int AS system_count
		FROM accounts a
		LEFT JOIN systems s
			ON s.owner_account_id = a.id
		GROUP BY a.id, a.username
		ORDER BY a.username
	`);

	for (const row of accountSystems.rows) {
		check(
			`Account "${row.username}" has exactly one system`,
			row.system_count === 1,
			`Found ${row.system_count} systems.`
		);
	}

	// ------------------------------------------------------------
	// 2. Members must always belong to a system
	// ------------------------------------------------------------

	const membersMissingSystem = await pool.query(`
		SELECT COUNT(*)::int AS count
		FROM members
		WHERE system_id IS NULL
	`);

	check(
		'All members have a system_id',
		membersMissingSystem.rows[0].count === 0,
		`${membersMissingSystem.rows[0].count} members are missing system_id.`
	);

	// ------------------------------------------------------------
	// 3. Custom fields must match their member's system
	// ------------------------------------------------------------

	const customFieldMismatch = await pool.query(`
		SELECT COUNT(*)::int AS count
		FROM custom_fields cf
		JOIN members m
			ON m.id = cf.member_id
		WHERE cf.system_id <> m.system_id
	`);

	check(
		'Custom fields match their member system',
		customFieldMismatch.rows[0].count === 0,
		`${customFieldMismatch.rows[0].count} mismatched custom fields.`
	);

	// ------------------------------------------------------------
	// 4. Front history must match member system
	// ------------------------------------------------------------

	const frontHistoryMismatch = await pool.query(`
		SELECT COUNT(*)::int AS count
		FROM front_history fh
		JOIN members m
			ON m.id = fh.member_id
		WHERE fh.system_id <> m.system_id
	`);

	check(
		'Front history matches member system',
		frontHistoryMismatch.rows[0].count === 0,
		`${frontHistoryMismatch.rows[0].count} mismatched front history rows.`
	);

	// ------------------------------------------------------------
	// 5. Chat messages must match sender system
	// ------------------------------------------------------------

	const chatMismatch = await pool.query(`
		SELECT COUNT(*)::int AS count
		FROM chat_messages cm
		JOIN members m
			ON m.id = cm.sender_member_id
		WHERE cm.system_id <> m.system_id
	`);

	check(
		'Chat messages match sender system',
		chatMismatch.rows[0].count === 0,
		`${chatMismatch.rows[0].count} mismatched chat messages.`
	);

	// ------------------------------------------------------------
	// 6. Journal entries must match author system
	// ------------------------------------------------------------

	const journalMismatch = await pool.query(`
		SELECT COUNT(*)::int AS count
		FROM journal_entries je
		JOIN members m
			ON m.id = je.author_member_id
		WHERE je.system_id <> m.system_id
	`);

	check(
		'Journal entries match author system',
		journalMismatch.rows[0].count === 0,
		`${journalMismatch.rows[0].count} mismatched journal entries.`
	);

	// ------------------------------------------------------------
	// 7. Polls must belong to a system
	// ------------------------------------------------------------

	const pollsMissingSystem = await pool.query(`
		SELECT COUNT(*)::int AS count
		FROM polls
		WHERE system_id IS NULL
	`);

	check(
		'All polls have a system_id',
		pollsMissingSystem.rows[0].count === 0,
		`${pollsMissingSystem.rows[0].count} polls are missing system_id.`
	);

	// ------------------------------------------------------------
	// 8. Poll options must match poll system
	// ------------------------------------------------------------

	const pollOptionMismatch = await pool.query(`
		SELECT COUNT(*)::int AS count
		FROM poll_options po
		JOIN polls p
			ON p.id = po.poll_id
		WHERE po.system_id <> p.system_id
	`);

	check(
		'Poll options match poll system',
		pollOptionMismatch.rows[0].count === 0,
		`${pollOptionMismatch.rows[0].count} mismatched poll options.`
	);

	// ------------------------------------------------------------
	// 9. Poll votes must match poll system
	// ------------------------------------------------------------

	const pollVoteMismatch = await pool.query(`
		SELECT COUNT(*)::int AS count
		FROM poll_votes pv
		JOIN polls p
			ON p.id = pv.poll_id
		WHERE pv.system_id <> p.system_id
	`);

	check(
		'Poll votes match poll system',
		pollVoteMismatch.rows[0].count === 0,
		`${pollVoteMismatch.rows[0].count} mismatched poll votes.`
	);

	// ------------------------------------------------------------
	// 10. Poll votes must match voter member system
	// ------------------------------------------------------------

	const pollVoterMismatch = await pool.query(`
		SELECT COUNT(*)::int AS count
		FROM poll_votes pv
		JOIN members m
			ON m.id = pv.member_id
		WHERE pv.system_id <> m.system_id
	`);

	check(
		'Poll votes match voter member system',
		pollVoterMismatch.rows[0].count === 0,
		`${pollVoterMismatch.rows[0].count} mismatched poll voters.`
	);

	// ------------------------------------------------------------
	// 11. Poll creators must match poll system
	// ------------------------------------------------------------

	const pollCreatorMismatch = await pool.query(`
		SELECT COUNT(*)::int AS count
		FROM polls p
		JOIN members m
			ON m.id = p.creator_member_id
		WHERE p.system_id <> m.system_id
	`);

	check(
		'Poll creators match poll system',
		pollCreatorMismatch.rows[0].count === 0,
		`${pollCreatorMismatch.rows[0].count} mismatched poll creators.`
	);

	// ------------------------------------------------------------
	// 12. Print current system distribution
	// ------------------------------------------------------------

	console.log('\n=== SYSTEM DISTRIBUTION ===\n');

	const distribution = await pool.query(`
		SELECT
			s.id AS system_id,
			s.name,
			a.username,
			(SELECT COUNT(*) FROM members m WHERE m.system_id = s.id)::int AS members,
			(SELECT COUNT(*) FROM front_history fh WHERE fh.system_id = s.id)::int AS front_history,
			(SELECT COUNT(*) FROM chat_messages cm WHERE cm.system_id = s.id)::int AS chat_messages,
			(SELECT COUNT(*) FROM journal_entries je WHERE je.system_id = s.id)::int AS journal_entries,
			(SELECT COUNT(*) FROM polls p WHERE p.system_id = s.id)::int AS polls
		FROM systems s
		JOIN accounts a
			ON a.id = s.owner_account_id
		ORDER BY a.username
	`);

	for (const row of distribution.rows) {
		console.log(
			`${row.username} | ${row.name} | ` +
			`members=${row.members}, ` +
			`front_history=${row.front_history}, ` +
			`chat=${row.chat_messages}, ` +
			`journal=${row.journal_entries}, ` +
			`polls=${row.polls}`
		);
	}

	console.log('\n=== RESULT ===\n');

	if (failures === 0) {
		console.log('🎉 SECURITY CHECK PASSED');
		console.log('No database-level system isolation problems were found.');
	} else {
		console.log(`⚠️ SECURITY CHECK FOUND ${failures} PROBLEM(S)`);
		process.exitCode = 1;
	}
} catch (error) {
	console.error('\nSecurity check failed to execute:');
	console.error(error);
	process.exitCode = 1;
} finally {
	await pool.end();
}