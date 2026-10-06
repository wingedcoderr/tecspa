import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { GetObjectCommand } from '@aws-sdk/client-s3';

import { pool } from '$lib/server/db/postgres';
import {
	MEMBER_MEDIA_BUCKET,
	s3
} from '$lib/server/storage/s3';

import { getAuthenticatedSystem } from '$lib/server/system';

type MediaKind = 'avatar' | 'banner';

function isMediaKind(
	value: string
): value is MediaKind {
	return value === 'avatar' || value === 'banner';
}

function dataUriToBytes(
	dataUri: string
): {
	bytes: Uint8Array;
	mimeType: string;
} {
	const commaIndex = dataUri.indexOf(',');

	if (commaIndex === -1) {
		throw error(
			404,
			'Member media was not found.'
		);
	}

	const header = dataUri.slice(
		5,
		commaIndex
	);

	const payload = dataUri.slice(
		commaIndex + 1
	);

	const mimeType =
		header.split(';')[0]?.trim() ||
		'application/octet-stream';

	if (header.includes(';base64')) {
		const binary = Buffer.from(
			payload,
			'base64'
		);

		return {
			bytes: new Uint8Array(binary),
			mimeType
		};
	}

	return {
		bytes: new TextEncoder().encode(
			decodeURIComponent(payload)
		),
		mimeType
	};
}

export const GET: RequestHandler = async ({
	params,
	cookies
}) => {
	const { system } =
		await getAuthenticatedSystem(cookies);

	const { memberID, kind } = params;

	if (
		!memberID ||
		!kind ||
		!isMediaKind(kind)
	) {
		throw error(
			400,
			'Invalid member media request.'
		);
	}

	const result = await pool.query<{
		avatar: string;
		banner: string;
	}>(
		`
			SELECT
				avatar,
				banner
			FROM members
			WHERE id = $1
				AND system_id = $2
			LIMIT 1
		`,
		[
			memberID,
			system.id
		]
	);

	if (result.rows.length === 0) {
		throw error(
			404,
			'Member not found.'
		);
	}

	const storedPath =
		result.rows[0][kind];

	if (!storedPath) {
		throw error(
			404,
			'Member does not have this image.'
		);
	}

	/*
	 * Legacy web members may still have a
	 * data URI stored in the database.
	 *
	 * Support those so existing images don't
	 * suddenly disappear while newer members
	 * use S3 normally.
	 */
	if (storedPath.startsWith('data:')) {
		const {
			bytes,
			mimeType
		} = dataUriToBytes(storedPath);

		return new Response(bytes.buffer as ArrayBuffer, {
			headers: {
				'Content-Type': mimeType,
				'Cache-Control':
					'private, max-age=3600'
			}
		});
	}

	/*
	 * Normal web media is stored as:
	 *
	 * members/<memberId>/avatar.ext
	 * members/<memberId>/banner.ext
	 *
	 * Never allow the database value to point
	 * outside this member's media directory.
	 */
	const expectedPrefix =
		`members/${memberID}/${kind}.`;

	if (
		!storedPath.startsWith(
			expectedPrefix
		)
	) {
		throw error(
			404,
			'Member media was not found.'
		);
	}

	const object = await s3.send(
		new GetObjectCommand({
			Bucket: MEMBER_MEDIA_BUCKET,
			Key: storedPath
		})
	);

	if (!object.Body) {
		throw error(
			404,
			'Member media was not found.'
		);
	}

	const bytes =
		await object.Body.transformToByteArray();

	const arrayBuffer =
		new ArrayBuffer(bytes.byteLength);

	new Uint8Array(arrayBuffer).set(bytes);

	return new Response(arrayBuffer, {
		headers: {
			'Content-Type':
				object.ContentType ??
				'application/octet-stream',
			'Cache-Control':
				'private, max-age=3600'
		}
	});
};