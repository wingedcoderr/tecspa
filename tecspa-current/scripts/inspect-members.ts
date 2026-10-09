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

type MemberRow = {
	id: string;
	name: string;
	pronouns: string;
	role: string;
	status: string;
	is_fronting: number;
};

type CustomFieldRow = {
	id: string;
	member_id: string;
	label: string;
	type: string;
	sort_order: number;
};

const members = db
	.prepare(`
		SELECT
			id,
			name,
			pronouns,
			role,
			status,
			is_fronting
		FROM members
		ORDER BY name;
	`)
	.all() as MemberRow[];

const customFields = db
	.prepare(`
		SELECT
			id,
			member_id,
			label,
			type,
			sort_order
		FROM custom_fields
		ORDER BY member_id, sort_order;
	`)
	.all() as CustomFieldRow[];

console.log(`SQLite database: ${databasePath}`);
console.log('');
console.log(`Members: ${members.length}`);
console.log(`Custom fields: ${customFields.length}`);
console.log('');

console.log('=== MEMBERS ===');

for (const member of members) {
	const fronting = member.is_fronting ? ' [FRONTING]' : '';

	console.log(
		`${member.name}${fronting} | id=${member.id} | role=${member.role} | status=${member.status} | pronouns=${member.pronouns || '(none)'}`
	);
}

console.log('');
console.log('=== CUSTOM FIELDS ===');

const memberNames = new Map(
	members.map((member) => [member.id, member.name])
);

for (const field of customFields) {
	const memberName = memberNames.get(field.member_id) ?? '(unknown member)';

	console.log(
		`${memberName} | ${field.label} | type=${field.type} | id=${field.id}`
	);
}

db.close();

console.log('');
console.log('Inspection complete. SQLite was opened read-only.');