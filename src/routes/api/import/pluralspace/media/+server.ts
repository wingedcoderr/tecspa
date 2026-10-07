import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { pool } from '$lib/server/db/postgres';
import { getAuthenticatedSystem } from '$lib/server/system';
import { MEMBER_MEDIA_BUCKET, s3 } from '$lib/server/storage/s3';

type MediaKind = 'avatar' | 'banner';

function dataUriToBytes(dataUri: string): Uint8Array {
	const commaIndex = dataUri.indexOf(',');
	if (commaIndex === -1 || !dataUri.startsWith('data:')) {
		throw new Error('The embedded image data is malformed.');
	}

	const header = dataUri.slice(5, commaIndex);
	const payload = dataUri.slice(commaIndex + 1);

	if (header.includes(';base64')) {
		return new Uint8Array(Buffer.from(payload, 'base64'));
	}

	return new TextEncoder().encode(decodeURIComponent(payload));
}

function extensionForMimeType(mimeType: string): string {
	switch (mimeType.toLowerCase()) {
		case 'image/jpeg':
		case 'image/jpg':
			return 'jpg';
		case 'image/gif':
			return 'gif';
		case 'image/webp':
			return 'webp';
		case 'image/bmp':
			return 'bmp';
		case 'image/png':
		default:
			return 'png';
	}
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { system } = await getAuthenticatedSystem(cookies);

	let body: {
		memberId?: string;
		kind?: MediaKind;
		dataUri?: string;
	};

	try {
		body = await request.json();
	} catch {
		return json({ error: 'The media upload data is invalid.' }, { status: 400 });
	}

	const memberId = body.memberId?.trim();
	const kind = body.kind;
	const dataUri = body.dataUri;

	if (!memberId || (kind !== 'avatar' && kind !== 'banner') || !dataUri) {
		return json({ error: 'The media upload request is incomplete.' }, { status: 400 });
	}

	if (!dataUri.startsWith('data:')) {
		return json({ error: 'The media payload must be a data URI.' }, { status: 400 });
	}

	const memberResult = await pool.query<{ id: string }>(
		`SELECT id FROM members WHERE id = $1 AND system_id = $2 LIMIT 1`,
		[memberId, system.id]
	);

	if (memberResult.rows.length === 0) {
		return json({ error: 'The target member was not found.' }, { status: 404 });
	}

	const commaIndex = dataUri.indexOf(',');
	const mimeType = dataUri.slice(5, commaIndex).split(';')[0]?.trim();

	if (!mimeType) {
		return json({ error: 'The image has no MIME type.' }, { status: 400 });
	}

	try {
		const bytes = dataUriToBytes(dataUri);
		const extension = extensionForMimeType(mimeType);
		const key = `members/${memberId}/${kind}.${extension}`;

		await s3.send(
			new PutObjectCommand({
				Bucket: MEMBER_MEDIA_BUCKET,
				Key: key,
				Body: bytes,
				ContentType: mimeType
			})
		);

		await pool.query(
			`UPDATE members SET ${kind} = $1 WHERE id = $2 AND system_id = $3`,
			[key, memberId, system.id]
		);

		return json({ memberId, kind, key });
	} catch (error) {
		console.error('Tecspa PluralSpace media upload failed:', error);
		return json(
			{
				error:
					error instanceof Error
						? error.message
						: 'The member image could not be uploaded.'
			},
			{ status: 500 }
		);
	}
};
