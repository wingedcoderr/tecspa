import { error } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';

import { getAccountFromSession } from '$lib/server/auth';
import { pool } from '$lib/server/db/postgres';

export async function getAuthenticatedSystem(
	cookies: Cookies
) {
	const token = cookies.get('tecspa_session');

	const account = await getAccountFromSession(token);

	if (!account) {
		throw error(401, 'You must be signed in.');
	}

	const result = await pool.query<{
		id: string;
		name: string;
	}>(
		`
			SELECT
				id,
				name
			FROM systems
			WHERE owner_account_id = $1
			LIMIT 1
		`,
		[account.id]
	);

	if (result.rows.length === 0) {
		throw error(
			500,
			'Your TECSPA system could not be found.'
		);
	}

	return {
		account,
		system: result.rows[0]
	};
}