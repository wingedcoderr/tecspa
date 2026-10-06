import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { pool } from '$lib/server/db/postgres';
import { isUuid } from '$lib/server/validate';
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

export const PATCH: RequestHandler = async ({
	request,
	params,
	cookies
}) => {
	const { system } =
		await getAuthenticatedSystem(cookies);

	if (!isUuid(params.id)) {
		return json(
			{ error: 'Invalid id' },
			{ status: 400 }
		);
	}

	const body = await request.json();

	const message =
		typeof body.message === 'string'
			? body.message.trim()
			: '';

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

	const editedAt = new Date().toISOString();

	const result = await pool.query<ChatMessageRow>(
		`
			UPDATE chat_messages
			SET
				message = $1,
				edited_at = $2
			WHERE id = $3
			  AND system_id = $4
			RETURNING
				id,
				sender_member_id,
				message,
				created_at,
				edited_at
		`,
		[
			message,
			editedAt,
			params.id,
			system.id
		]
	);

	if (result.rows.length === 0) {
		throw error(
			404,
			'Chat message not found.'
		);
	}

	return json({
		message: mapChatMessageRow(
			result.rows[0]
		)
	});
};

export const DELETE: RequestHandler = async ({
	params,
	cookies
}) => {
	const { system } =
		await getAuthenticatedSystem(cookies);

	if (!isUuid(params.id)) {
		return json(
			{ error: 'Invalid id' },
			{ status: 400 }
		);
	}

	const result = await pool.query(
		`
			DELETE FROM chat_messages
			WHERE id = $1
			  AND system_id = $2
		`,
		[
			params.id,
			system.id
		]
	);

	if (result.rowCount === 0) {
		throw error(
			404,
			'Chat message not found.'
		);
	}

	return new Response(null, {
		status: 204
	});
};