import type { Member } from '$lib/data/members';
import type {
	ChatMessage,
	JournalEntry,
    
	Poll,
	PollResults,
	FrontHistoryEntry
} from '$lib/data/activity';

import type { DataAdapter } from '$lib/db/adapter';
import { initializeDatabase } from '$lib/db/database';
import { getDatabase } from '$lib/db/database';
import type { AmpersandImportData } from '$lib/importers/ampersand';
import type { AmpersandImportResult } from '$lib/repositories/ampersand-import';
import {
	importAmpersandData as importAmpersandDataToSqlite
} from '$lib/repositories/ampersand-import';

export class DesktopDataAdapter implements DataAdapter {
	async getMembers(): Promise<Member[]> {
		const db = await initializeDatabase();
		

		return db.select<Member[]>(
			`
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
				ORDER BY name COLLATE NOCASE ASC
			`
		);
	}

	async importAmpersandData(
	importData: AmpersandImportData
): Promise<AmpersandImportResult> {
	const {
		importAmpersandData
	} = await import(
		'$lib/repositories/ampersand-import'
	);

	return importAmpersandData(
		importData
	);
}

	async getMemberById(id: string): Promise<Member | null> {
		const db = await initializeDatabase();

		const rows = await db.select<Member[]>(
			`
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
				WHERE id = $1
				LIMIT 1
			`,
			[id]
		);

		return rows[0] ?? null;
	}

async deleteMember(id: string): Promise<void> {
	const db = await initializeDatabase();

	await db.execute(
		'DELETE FROM members WHERE id = $1',
		[id]
	);
}

async updateMember(
	id: string,
	member: Member
): Promise<Member> {
	const db = await initializeDatabase();

	await db.execute(
		`
			UPDATE members
			SET
				name = $1,
				pronouns = $2,
				aliases = $3,
				role = $4,
				status = $5,
				about = $6,
				interests = $7,
				front_triggers = $8,
				avatar = $9,
				banner = $10,
				is_fronting = $11
			WHERE id = $12
		`,
		[
			member.name,
			member.pronouns,
			JSON.stringify(member.aliases),
			member.role,
			member.status,
			member.about,
			JSON.stringify(member.interests),
			JSON.stringify(member.frontTriggers),
			member.avatar,
			member.banner,
			member.isFronting ? 1 : 0,
			id
		]
	);

	await db.execute(
		`
			DELETE FROM custom_fields
			WHERE member_id = $1
		`,
		[id]
	);

	for (const field of member.customFields ?? []) {
		await db.execute(
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
				)
			`,
			[
				field.id,
				id,
				field.label,
				field.type,
				field.value,
				field.description,
				field.sortOrder
			]
		);
	}

	return member;
}

async setMemberFronting(
	memberId: string,
	isFronting: boolean
): Promise<void> {
	const db = await initializeDatabase();

	const rows = await db.select<any[]>(
		`
			SELECT is_fronting
			FROM members
			WHERE id = $1
		`,
		[memberId]
	);

	if (rows.length === 0) {
		return;
	}

	const currentlyFronting =
		Boolean(rows[0].is_fronting);

	if (currentlyFronting === isFronting) {
		return;
	}

	await db.execute(
		`
			UPDATE members
			SET is_fronting = $1
			WHERE id = $2
		`,
		[isFronting ? 1 : 0, memberId]
	);

	const now = new Date().toISOString();

	if (isFronting) {
		await db.execute(
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
					NULL,
					''
				)
			`,
			[
				crypto.randomUUID(),
				memberId,
				now
			]
		);
	} else {
		await db.execute(
			`
				UPDATE front_history
				SET ended_at = $1
				WHERE id = (
					SELECT id
					FROM front_history
					WHERE member_id = $2
						AND ended_at IS NULL
					ORDER BY started_at DESC
					LIMIT 1
				)
			`,
			[now, memberId]
		);
	}
}
	async getFrontHistory(): Promise<FrontHistoryEntry[]> {
		const db = await initializeDatabase();

		const rows = await db.select<any[]>(
			`
				SELECT *
				FROM front_history
				ORDER BY started_at DESC
			`
		);

		return rows.map((row) => ({
			id: row.id,
			memberId: row.member_id,
			startedAt: row.started_at,
			endedAt: row.ended_at ?? null,
			note: row.note ?? ''
		}));
	}

	async getFrontHistoryForMember(
		memberId: string
	): Promise<FrontHistoryEntry[]> {
		const db = await initializeDatabase();

		const rows = await db.select<any[]>(
			`
				SELECT *
				FROM front_history
				WHERE member_id = $1
				ORDER BY started_at DESC
			`,
			[memberId]
		);

		return rows.map((row) => ({
			id: row.id,
			memberId: row.member_id,
			startedAt: row.started_at,
			endedAt: row.ended_at ?? null,
			note: row.note ?? ''
		}));
	}

	async getCurrentFronting(): Promise<FrontHistoryEntry[]> {
		const db = await initializeDatabase();

		const rows = await db.select<any[]>(
			`
				SELECT *
				FROM front_history
				WHERE ended_at IS NULL
				ORDER BY started_at ASC
			`
		);

		return rows.map((row) => ({
			id: row.id,
			memberId: row.member_id,
			startedAt: row.started_at,
			endedAt: row.ended_at ?? null,
			note: row.note ?? ''
		}));
	}

	async getChatMessages(): Promise<ChatMessage[]> {
		const db = await initializeDatabase();

		return db.select<ChatMessage[]>(
			`
				SELECT
					id,
					sender_member_id AS senderMemberId,
					message,
					created_at AS createdAt,
					edited_at AS editedAt
				FROM chat_messages
				ORDER BY created_at ASC
			`
		);
	}

	async createChatMessage(
		senderMemberId: string,
		message: string
	): Promise<ChatMessage> {
		const db = await initializeDatabase();

		const id = crypto.randomUUID();
		const createdAt = new Date().toISOString();

		await db.execute(
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
					NULL
				)
			`,
			[
				id,
				senderMemberId,
				message,
				createdAt
			]
		);

		const rows = await db.select<ChatMessage[]>(
			`
				SELECT
					id,
					sender_member_id AS senderMemberId,
					message,
					created_at AS createdAt,
					edited_at AS editedAt
				FROM chat_messages
				WHERE id = $1
				LIMIT 1
			`,
			[id]
		);

		if (!rows[0]) {
			throw new Error('Failed to create chat message.');
		}

		return rows[0];
	}

	async updateChatMessage(
		id: string,
		message: string
	): Promise<ChatMessage> {
		const db = await initializeDatabase();

		const editedAt = new Date().toISOString();

		const result = await db.execute(
			`
				UPDATE chat_messages
				SET
					message = $1,
					edited_at = $2
				WHERE id = $3
			`,
			[
				message,
				editedAt,
				id
			]
		);

		if (result.rowsAffected === 0) {
			throw new Error('Chat message not found.');
		}

		const rows = await db.select<ChatMessage[]>(
			`
				SELECT
					id,
					sender_member_id AS senderMemberId,
					message,
					created_at AS createdAt,
					edited_at AS editedAt
				FROM chat_messages
				WHERE id = $1
				LIMIT 1
			`,
			[id]
		);

		if (!rows[0]) {
			throw new Error(
				'Failed to load updated chat message.'
			);
		}

		return rows[0];
	}

	async deleteChatMessage(
		id: string
	): Promise<void> {
		const db = await initializeDatabase();

		const result = await db.execute(
			`
				DELETE FROM chat_messages
				WHERE id = $1
			`,
			[id]
		);

		if (result.rowsAffected === 0) {
			throw new Error('Chat message not found.');
		}
	}

	async updateFrontHistoryNote(
		id: string,
		note: string
	): Promise<void> {
		const db = await getDatabase();

		await db.execute(
			`
				UPDATE front_history
				SET note = $1
				WHERE id = $2
			`,
			[note, id]
		);
	}

	async deleteFrontHistoryEntry(
		id: string
	): Promise<void> {
		const db = await getDatabase();

		await db.execute(
			`
				DELETE FROM front_history
				WHERE id = $1
			`,
			[id]
		);
	}

		async getJournalEntries(): Promise<JournalEntry[]> {
		const db = await initializeDatabase();

		const rows = await db.select<
			Array<{
				id: string;
				authorMemberId: string | null;
				entryType: 'journal' | 'note';
				title: string;
				body: string;
				tags: string;
				isPinned: number;
				createdAt: string;
				updatedAt: string;
			}>
		>(
			`
				SELECT
					id,
					author_member_id AS authorMemberId,
					entry_type AS entryType,
					title,
					body,
					tags,
					is_pinned AS isPinned,
					created_at AS createdAt,
					updated_at AS updatedAt
				FROM journal_entries
				ORDER BY is_pinned DESC, created_at DESC
			`
		);

		return rows.map((row) => ({
			id: row.id,
			authorMemberId: row.authorMemberId,
			entryType: row.entryType,
			title: row.title,
			body: row.body,
			tags: row.tags ? JSON.parse(row.tags) : [],
			isPinned: Boolean(row.isPinned),
			createdAt: row.createdAt,
			updatedAt: row.updatedAt
		}));
	}

	async getJournalEntryById(
		id: string
	): Promise<JournalEntry | null> {
		const db = await initializeDatabase();

		const rows = await db.select<
			Array<{
				id: string;
				authorMemberId: string | null;
				entryType: 'journal' | 'note';
				title: string;
				body: string;
				tags: string;
				isPinned: number;
				createdAt: string;
				updatedAt: string;
			}>
		>(
			`
				SELECT
					id,
					author_member_id AS authorMemberId,
					entry_type AS entryType,
					title,
					body,
					tags,
					is_pinned AS isPinned,
					created_at AS createdAt,
					updated_at AS updatedAt
				FROM journal_entries
				WHERE id = $1
				LIMIT 1
			`,
			[id]
		);

		const row = rows[0];

		if (!row) {
			return null;
		}

		return {
			id: row.id,
			authorMemberId: row.authorMemberId,
			entryType: row.entryType,
			title: row.title,
			body: row.body,
			tags: row.tags ? JSON.parse(row.tags) : [],
			isPinned: Boolean(row.isPinned),
			createdAt: row.createdAt,
			updatedAt: row.updatedAt
		};
	}

	async createJournalEntry(
		entry: Omit<
			JournalEntry,
			'id' | 'createdAt' | 'updatedAt'
		>
	): Promise<JournalEntry> {
		const db = await initializeDatabase();

		const id = crypto.randomUUID();
		const now = new Date().toISOString();

		await db.execute(
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
				)
			`,
			[
				id,
				entry.authorMemberId,
				entry.entryType === 'note' ? 'note' : 'journal',
				entry.title,
				entry.body,
				JSON.stringify(entry.tags),
				entry.isPinned ? 1 : 0,
				now,
				now
			]
		);

		const createdEntry = await this.getJournalEntryById(id);

		if (!createdEntry) {
			throw new Error('Failed to create journal entry.');
		}

		return createdEntry;
	}

	async updateJournalEntry(
		id: string,
		entry: Omit<
			JournalEntry,
			'id' | 'createdAt' | 'updatedAt'
		>
	): Promise<JournalEntry> {
		const db = await initializeDatabase();

		const updatedAt = new Date().toISOString();

		const result = await db.execute(
			`
				UPDATE journal_entries
				SET
					author_member_id = $1,
					entry_type = $2,
					title = $3,
					body = $4,
					tags = $5,
					is_pinned = $6,
					updated_at = $7
				WHERE id = $8
			`,
			[
				entry.authorMemberId,
				entry.entryType === 'note' ? 'note' : 'journal',
				entry.title,
				entry.body,
				JSON.stringify(entry.tags),
				entry.isPinned ? 1 : 0,
				updatedAt,
				id
			]
		);

		if (result.rowsAffected === 0) {
			throw new Error('Journal entry not found.');
		}

		const updatedEntry = await this.getJournalEntryById(id);

		if (!updatedEntry) {
			throw new Error('Failed to load updated journal entry.');
		}

		return updatedEntry;
	}

	async setJournalEntryPinned(
		id: string,
		isPinned: boolean
	): Promise<JournalEntry> {
		const db = await initializeDatabase();

		const updatedAt = new Date().toISOString();

		const result = await db.execute(
			`
				UPDATE journal_entries
				SET
					is_pinned = $1,
					updated_at = $2
				WHERE id = $3
			`,
			[
				isPinned ? 1 : 0,
				updatedAt,
				id
			]
		);

		if (result.rowsAffected === 0) {
			throw new Error('Journal entry not found.');
		}

		const updatedEntry = await this.getJournalEntryById(id);

		if (!updatedEntry) {
			throw new Error('Failed to load updated journal entry.');
		}

		return updatedEntry;
	}

	async deleteJournalEntry(
		id: string
	): Promise<void> {
		const db = await initializeDatabase();

		const result = await db.execute(
			`
				DELETE FROM journal_entries
				WHERE id = $1
			`,
			[id]
		);

		if (result.rowsAffected === 0) {
			throw new Error('Journal entry not found.');
		}
	}

	async getPolls(): Promise<Poll[]> {
		const db = await initializeDatabase();

		const polls = await db.select<
			Array<{
				id: string;
				creatorMemberId: string;
				question: string;
				allowMultiple: number;
				createdAt: string;
				closedAt: string | null;
			}>
		>(
			`
				SELECT
					id,
					creator_member_id AS creatorMemberId,
					question,
					allow_multiple AS allowMultiple,
					created_at AS createdAt,
					closed_at AS closedAt
				FROM polls
				ORDER BY created_at DESC
			`
		);

		const result: Poll[] = [];

		for (const poll of polls) {
			const options = await db.select<
				Array<{
					id: string;
					pollId: string;
					label: string;
					sortOrder: number;
				}>
			>(
				`
					SELECT
						id,
						poll_id AS pollId,
						label,
						sort_order AS sortOrder
					FROM poll_options
					WHERE poll_id = $1
					ORDER BY sort_order ASC
				`,
				[poll.id]
			);

			result.push({
				id: poll.id,
				creatorMemberId: poll.creatorMemberId,
				question: poll.question,
				allowMultiple: Boolean(poll.allowMultiple),
				createdAt: poll.createdAt,
				closedAt: poll.closedAt,
				options
			});
		}

		return result;
	}

	async getPollResults(pollId: string): Promise<PollResults | null> {
		const db = await initializeDatabase();

		const polls = await db.select<
			Array<{
				id: string;
				creatorMemberId: string;
				question: string;
				allowMultiple: number;
				createdAt: string;
				closedAt: string | null;
			}>
		>(
			`
				SELECT
					id,
					creator_member_id AS creatorMemberId,
					question,
					allow_multiple AS allowMultiple,
					created_at AS createdAt,
					closed_at AS closedAt
				FROM polls
				WHERE id = $1
				LIMIT 1
			`,
			[pollId]
		);

		const poll = polls[0];

		if (!poll) {
			return null;
		}

		const options = await db.select<
			Array<{
				id: string;
				pollId: string;
				label: string;
				sortOrder: number;
				voteCount: number;
			}>
		>(
			`
				SELECT
					o.id,
					o.poll_id AS pollId,
					o.label,
					o.sort_order AS sortOrder,
					COUNT(v.id) AS voteCount
				FROM poll_options o
				LEFT JOIN poll_votes v ON v.option_id = o.id
				WHERE o.poll_id = $1
				GROUP BY o.id
				ORDER BY o.sort_order ASC
			`,
			[pollId]
		);

		const totalRows = await db.select<Array<{ totalVotes: number }>>(
			`
				SELECT COUNT(*) AS totalVotes
				FROM poll_votes
				WHERE poll_id = $1
			`,
			[pollId]
		);

		return {
			id: poll.id,
			creatorMemberId: poll.creatorMemberId,
			question: poll.question,
			allowMultiple: Boolean(poll.allowMultiple),
			createdAt: poll.createdAt,
			closedAt: poll.closedAt,
			options,
			totalVotes: totalRows[0]?.totalVotes ?? 0
		};
	}
}