import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { pool } from '$lib/server/db/postgres';
import { isUuid } from '$lib/server/validate';
import { getAuthenticatedSystem } from '$lib/server/system';

export const PATCH: RequestHandler = async ({
	params,
	request,
	cookies
}) => {
	const { id } = params;

	if (!id) {
		throw error(
			400,
			'Front history entry ID is required.'
		);
	}

	if (!isUuid(id)) {
		throw error(400, 'Invalid id');
	}

	const body = await request.json();

	const note =
		typeof body.note === 'string'
			? body.note.trim()
			: null;

	if (note === null) {
		throw error(400, 'A note string is required.');
	}

	if (note.length > 2000) {
		return json(
			{ error: 'Invalid input' },
			{ status: 422 }
		);
	}

	const { system } = await getAuthenticatedSystem(cookies);

	const result = await pool.query(
		`
			UPDATE front_history
			SET note = $1
			WHERE id = $2
				AND system_id = $3
			RETURNING
				id,
				member_id,
				started_at,
				ended_at,
				note
		`,
		[note, id, system.id]
	);

	if (result.rows.length === 0) {
		throw error(
			404,
			'Front history entry not found.'
		);
	}

	return json({
		id: result.rows[0].id,
		memberId: result.rows[0].member_id,
		startedAt: result.rows[0].started_at,
		endedAt: result.rows[0].ended_at,
		note: result.rows[0].note ?? ''
	});
};

export const DELETE: RequestHandler = async ({
	params,
	cookies
}) => {
	const { id } = params;

	if (!id) {
		throw error(
			400,
			'Front history entry ID is required.'
		);
	}

	if (!isUuid(id)) {
		throw error(400, 'Invalid id');
	}

	const { system } = await getAuthenticatedSystem(cookies);

	const result = await pool.query(
		`
			DELETE FROM front_history
			WHERE id = $1
				AND system_id = $2
			RETURNING id
		`,
		[id, system.id]
	);

	if (result.rows.length === 0) {
		throw error(
			404,
			'Front history entry not found.'
		);
	}

	return new Response(null, {
		status: 204
	});
};