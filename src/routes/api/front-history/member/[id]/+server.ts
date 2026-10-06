import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { pool } from '$lib/server/db/postgres';
import { isUuid } from '$lib/server/validate';
import { getAuthenticatedSystem } from '$lib/server/system';

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

export const GET: RequestHandler = async ({
	params,
	cookies
}) => {
	const { id } = params;

	if (!id) {
		throw error(400, 'Missing member ID.');
	}

	if (!isUuid(id)) {
		throw error(400, 'Invalid id');
	}

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
			WHERE member_id = $1
				AND system_id = $2
			ORDER BY started_at DESC
			LIMIT 500
		`,
		[id, system.id]
	);

	return json(
		result.rows.map(mapFrontHistoryRow)
	);
};