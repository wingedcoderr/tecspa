import { json, error } from '@sveltejs/kit';

import { pool } from '$lib/server/db/postgres';
import { isUuid } from '$lib/server/validate';
import { getAuthenticatedSystem } from '$lib/server/system';

export async function PUT({
	params,
	request,
	cookies
}: {
	params: { id: string };
	request: Request;
	cookies: import('@sveltejs/kit').Cookies;
}) {
	const { id } = params;

	if (!id) {
		throw error(400, 'Member ID is required.');
	}

	if (!isUuid(id)) {
		throw error(400, 'Invalid id');
	}

	const body = await request.json();

	if (typeof body.isFronting !== 'boolean') {
		throw error(
			400,
			'isFronting must be a boolean.'
		);
	}

	const { system } = await getAuthenticatedSystem(cookies);

	const client = await pool.connect();

	try {
		await client.query('BEGIN');

		const memberResult = await client.query<{
			is_fronting: boolean;
		}>(
			`
				SELECT is_fronting
				FROM members
				WHERE id = $1
					AND system_id = $2
				FOR UPDATE
			`,
			[id, system.id]
		);

		if (memberResult.rows.length === 0) {
			await client.query('ROLLBACK');

			throw error(404, 'Member not found.');
		}

		const currentlyFronting =
			memberResult.rows[0].is_fronting;

		if (currentlyFronting === body.isFronting) {
			await client.query('COMMIT');

			return json({ ok: true });
		}

		await client.query(
			`
				UPDATE members
				SET is_fronting = $1
				WHERE id = $2
					AND system_id = $3
			`,
			[
				body.isFronting ? 1 : 0,
				id,
				system.id
			]
		);

		const now = new Date().toISOString();

		if (body.isFronting) {
			await client.query(
				`
					INSERT INTO front_history (
						id,
						member_id,
						system_id,
						started_at,
						ended_at,
						note
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						NULL,
						''
					)
				`,
				[
					crypto.randomUUID(),
					id,
					system.id,
					now
				]
			);
		} else {
			await client.query(
				`
					UPDATE front_history
					SET ended_at = $1
					WHERE id = (
						SELECT id
						FROM front_history
						WHERE member_id = $2
							AND system_id = $3
							AND ended_at IS NULL
						ORDER BY started_at DESC
						LIMIT 1
					)
				`,
				[
					now,
					id,
					system.id
				]
			);
		}

		await client.query('COMMIT');

		return json({ ok: true });
	} catch (error) {
		try {
			await client.query('ROLLBACK');
		} catch {
			// Ignore rollback errors.
		}

		throw error;
	} finally {
		client.release();
	}
}