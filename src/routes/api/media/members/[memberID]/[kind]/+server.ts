import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';

import { GetObjectCommand } from '@aws-sdk/client-s3';

import { pool } from '$lib/server/db/postgres';
import {
	ALLOWED_IMAGE_MIME,
	isUuid
} from '$lib/server/validate';
import {
	MEMBER_MEDIA_BUCKET,
	s3
} from '$lib/server/storage/s3';

import { getAuthenticatedSystem } from '$lib/server/system';

type MediaKind = 'avatar' | 'banner';

function isMediaKind(value: string): value is MediaKind {
	return value === 'avatar' || value === 'banner';
}

export const GET: RequestHandler = async ({
	params,
	cookies
}: {
	params: {
		memberID?: string;
		kind?: string;
	};
	cookies: Cookies;
}) => {
	const { memberID, kind } = params;

	if (!memberID || !kind || !isMediaKind(kind)) {
		throw error(400, 'Invalid member media request.');
	}

	if (!isUuid(memberID)) {
		throw error(400, 'Invalid id');
	}

	const { system } =
		await getAuthenticatedSystem(cookies);

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
		`,
		[
			memberID,
			system.id
		]
	);

	if (result.rows.length === 0) {
		throw error(404, 'Member not found.');
	}

	const storedPath = result.rows[0][kind];

	if (!storedPath) {
		throw error(
			404,
			'Member does not have this image.'
		);
	}

	const expectedPrefix =
		`members/${memberID}/${kind}.`;

	if (!storedPath.startsWith(expectedPrefix)) {
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

	const contentType =
		object.ContentType &&
		(
			ALLOWED_IMAGE_MIME as readonly string[]
		).includes(object.ContentType)
			? object.ContentType
			: 'application/octet-stream';

	return new Response(arrayBuffer, {
		headers: {
			'Content-Type': contentType,
			'Content-Disposition': 'inline',
			'Cache-Control':
				'private, max-age=3600'
		}
	});
};