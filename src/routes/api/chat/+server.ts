import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { pool } from '$lib/server/db/postgres';
import { getAuthenticatedSystem } from '$lib/server/system';

type ChatMessageRow = {
	id: string;
	sender_member_id: string;
	message: string;
	created_at: string;
	edited_at: string | null;
};

function mapChatMessageRow(
	row: ChatMessageRow
) {
	return {
		id: row.id,
		senderMemberId: row.sender_member_id,
		message: row.message,
		createdAt: row.created_at,
		editedAt: row.edited_at
	};
}

export const GET: RequestHandler = async ({
	cookies
}) => {
	const { system } =
		await getAuthenticatedSystem(cookies);

	const result = await pool.query<ChatMessageRow>(
		`
			SELECT
				id,
				sender_member_id,
				message,
				created_at,
				edited_at
			FROM chat_messages
			WHERE system_id = $1
			ORDER BY created_at ASC
			LIMIT 500
		`,
		[system.id]
	);

	return json({
		messages: result.rows.map(
			mapChatMessageRow
		)
	});
};

export const POST: RequestHandler = async ({
	request,
	cookies
}) => {
	const { system } =
		await getAuthenticatedSystem(cookies);

	const body = await request.json();

	const senderMemberId =
		typeof body.senderMemberId === 'string'
			? body.senderMemberId
			: '';

	const message =
		typeof body.message === 'string'
			? body.message.trim()
			: '';

	if (!senderMemberId) {
		return json(
			{
				error: 'A sender member is required.'
			},
			{ status: 400 }
		);
	}

	if (!message) {
		return json(
			{
				error: 'Message cannot be empty.'
			},
			{ status: 400 }
		);
	}

	if (message.length > 4000) {
		return json(
			{
				error: 'Invalid input'
			},
			{ status: 422 }
		);
	}

	/*
	 * Make sure the selected sender actually belongs
	 * to the authenticated user's TECSPA system.
	 */
	const memberResult = await pool.query(
		`
			SELECT id
			FROM members
			WHERE id = $1
			  AND system_id = $2
			LIMIT 1
		`,
		[
			senderMemberId,
			system.id
		]
	);

	if (memberResult.rows.length === 0) {
		return json(
			{
				error:
					'The selected sender does not belong to your TECSPA system.'
			},
			{ status: 403 }
		);
	}

	const id = crypto.randomUUID();
	const createdAt = new Date().toISOString();

	const result = await pool.query<ChatMessageRow>(
		`
			INSERT INTO chat_messages (
				id,
				system_id,
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
				$5,
				NULL
			)
			RETURNING
				id,
				sender_member_id,
				message,
				created_at,
				edited_at
		`,
		[
			id,
			system.id,
			senderMemberId,
			message,
			createdAt
		]
	);

	if (result.rows.length === 0) {
		return json(
			{
				error:
					'Failed to create chat message.'
			},
			{ status: 500 }
		);
	}

	return json(
		{
			message: mapChatMessageRow(
				result.rows[0]
			)
		},
		{ status: 201 }
	);
};