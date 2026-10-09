import { json } from '@sveltejs/kit';

import { pool } from '$lib/server/db/postgres';

export async function checkRateLimit(
	key: string,
	limit: number,
	windowSeconds: number
): Promise<boolean> {
	try {
		const result = await pool.query<{ count: number }>(
			`
				INSERT INTO rate_limits (key, window_start, count)
				VALUES ($1, now(), 1)
				ON CONFLICT (key) DO UPDATE SET
					count = CASE
						WHEN rate_limits.window_start < now() - make_interval(secs => $2)
							THEN 1
						ELSE rate_limits.count + 1
					END,
					window_start = CASE
						WHEN rate_limits.window_start < now() - make_interval(secs => $2)
							THEN now()
						ELSE rate_limits.window_start
					END
				RETURNING count
			`,
			[key, windowSeconds]
		);

		const count = result.rows[0]?.count ?? 0;

		return count <= limit;
	} catch (error) {
		console.error('Rate limit check failed:', error);
		return true;
	}
}

export async function enforceRateLimit(
	key: string,
	limit: number,
	windowSeconds: number
): Promise<Response | null> {
	const allowed = await checkRateLimit(key, limit, windowSeconds);

	if (!allowed) {
		return json({ error: 'Too many requests' }, { status: 429 });
	}

	return null;
}
