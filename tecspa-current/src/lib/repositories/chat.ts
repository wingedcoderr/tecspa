import { getDatabase } from '$lib/db/database';
import type { ChatMessage } from '$lib/data/activity';

function databaseRowToChatMessage(
	row: any
): ChatMessage {
	return {
		id: row.id,
		senderMemberId: row.sender_member_id,
		message: row.message ?? '',
		createdAt: row.created_at,
		editedAt: row.edited_at ?? null
	};
}

/*
 * =========================================================
 * GET MESSAGES
 * =========================================================
 */

export async function getChatMessages(): Promise<
	ChatMessage[]
> {
	const db = await getDatabase();

	const rows = await db.select<any[]>(
		`
			SELECT *
			FROM chat_messages
			ORDER BY created_at ASC
		`
	);

	return rows.map(databaseRowToChatMessage);
}

/*
 * =========================================================
 * GET MESSAGES WITHIN A LIMIT
 * =========================================================
 *
 * Useful later for keeping the chat page from loading
 * thousands of messages at once.
 */

export async function getRecentChatMessages(
	limit = 100
): Promise<ChatMessage[]> {
	const db = await getDatabase();

	const rows = await db.select<any[]>(
		`
			SELECT *
			FROM chat_messages
			ORDER BY created_at DESC
			LIMIT $1
		`,
		[limit]
	);

	return rows
		.map(databaseRowToChatMessage)
		.reverse();
}

/*
 * =========================================================
 * SEND MESSAGE
 * =========================================================
 */

export async function createChatMessage(
	senderMemberId: string,
	message: string
): Promise<ChatMessage> {
	const db = await getDatabase();

	const trimmedMessage = message.trim();

	if (!trimmedMessage) {
		throw new Error(
			'Chat messages cannot be empty.'
		);
	}

	const id = crypto.randomUUID();
	const createdAt = new Date().toISOString();

	await db.execute(
		`
			INSERT INTO chat_messages (
				id,
				sender_member_id,
				message,
				created_at
			)
			VALUES (
				$1,
				$2,
				$3,
				$4
			)
		`,
		[
			id,
			senderMemberId,
			trimmedMessage,
			createdAt
		]
	);

	return {
		id,
		senderMemberId,
		message: trimmedMessage,
		createdAt,
		editedAt: null
	};
}

/*
 * =========================================================
 * EDIT MESSAGE
 * =========================================================
 */

export async function updateChatMessage(
	id: string,
	message: string
) {
	const db = await getDatabase();

	const trimmedMessage = message.trim();

	if (!trimmedMessage) {
		throw new Error(
			'Chat messages cannot be empty.'
		);
	}

	await db.execute(
		`
			UPDATE chat_messages
			SET
				message = $1,
				edited_at = $2
			WHERE id = $3
		`,
		[
			trimmedMessage,
			new Date().toISOString(),
			id
		]
	);
}

/*
 * =========================================================
 * DELETE MESSAGE
 * =========================================================
 */

export async function deleteChatMessage(
	id: string
) {
	const db = await getDatabase();

	await db.execute(
		`
			DELETE FROM chat_messages
			WHERE id = $1
		`,
		[id]
	);
}