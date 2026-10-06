import { json } from '@sveltejs/kit';

import { pool } from '$lib/server/db/postgres';
import { getAuthenticatedSystem } from '$lib/server/system';
import type { Cookies } from '@sveltejs/kit';

type FrontHistoryRow = {
	id: string;
	member_id: string;
	started_at: string;
	ended_at: string | null;
	note: string;
};

function mapFrontHistoryRow(
	row: FrontHistoryRow
) {
	return {
		id: row.id,
		memberId: row.member_id,
		startedAt: row.started_at,
		endedAt: row.ended_at,
		note: row.note ?? ''
	};
}

export async function GET({
	cookies
}: {
	cookies: Cookies;
}) {

	const { system } = await getAuthenticatedSystem(cookies);

	const result = await pool.query<FrontHistoryRow>(
		`
			SELECT
				id,
				member_id,
				started_at,
				ended_at,
				note
			FROM front_history
			WHERE system_id = $1
			ORDER BY started_at DESC
			LIMIT 500
		`,
		[system.id]
	);

	return json(
		result.rows.map(mapFrontHistoryRow)
	);
}