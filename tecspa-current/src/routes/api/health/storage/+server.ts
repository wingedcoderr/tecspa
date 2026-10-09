import { json } from '@sveltejs/kit';

import { verifyMemberMediaStorage } from '$lib/server/storage/s3';

export async function GET() {
	try {
		await verifyMemberMediaStorage();

		return json({
			ok: true
		});
	} catch (error) {
		console.error('Neon Object Storage connection failed:', error);

		return json(
			{
				ok: false,
				error: 'Object Storage connection failed.'
			},
			{ status: 500 }
		);
	}
}