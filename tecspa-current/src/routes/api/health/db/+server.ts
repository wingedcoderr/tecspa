import { json } from '@sveltejs/kit';

import { pool } from '$lib/server/db/postgres';

export async function GET() {
	try {
		await pool.query('SELECT 1');

		return json({
			ok: true
		});
	} catch (error) {
		console.error('Neon database connection failed:', error);

		return json(
			{
				ok: false,
				error: 'Database connection failed.'
			},
			{ status: 500 }
		);
	}
}