import {
	json,
	error
} from '@sveltejs/kit';

import type { RequestHandler } from './$types';

import { pool } from '$lib/server/db/postgres';
import { isUuid } from '$lib/server/validate';
import { getAuthenticatedSystem } from '$lib/server/system';
import type { Member } from '$lib/data/members';
import {
	PutObjectCommand,
	DeleteObjectCommand
} from '@aws-sdk/client-s3';
import {
	MEMBER_MEDIA_BUCKET,
	s3
} from '$lib/server/storage/s3';

export const GET: RequestHandler = async ({
	params,
	cookies
}) => {
	const memberId = params.id;

	if (!isUuid(memberId)) {
		return json(
			{ error: 'Invalid id' },
			{ status: 400 }
		);
	}

	try {
		const { system } = await getAuthenticatedSystem(cookies);

		const memberResult = await pool.query(
			`
				SELECT
					id,
					name,
					pronouns,
					aliases,
					role,
					status,
					about,
					interests,
					front_triggers,
					avatar,
					banner,
					is_fronting
				FROM members
				WHERE id = $1
					AND system_id = $2
				LIMIT 1;
			`,
			[memberId, system.id]
		);

		if (memberResult.rows.length === 0) {
			return json(
				{
					error: 'Member not found.'
				},
				{ status: 404 }
			);
		}

		const member = memberResult.rows[0];

		const customFieldsResult = await pool.query(
			`
				SELECT
					id,
					member_id,
					label,
					type,
					value,
					description,
					sort_order
				FROM custom_fields
				WHERE member_id = $1
					AND system_id = $2
				ORDER BY sort_order;
			`,
			[memberId, system.id]
		);

		return json({
			id: member.id,
			name: member.name,
			pronouns: member.pronouns,
			aliases: JSON.parse(member.aliases),
			role: member.role,
			status: member.status,
			about: member.about,
			interests: JSON.parse(member.interests),
			frontTriggers: JSON.parse(member.front_triggers),
			avatar: member.avatar,
			banner: member.banner,
			isFronting: Boolean(member.is_fronting),
			customFields: customFieldsResult.rows.map((field) => ({
				id: field.id,
				memberId: field.member_id,
				label: field.label,
				type: field.type,
				value: field.value,
				description: field.description,
				sortOrder: field.sort_order
			}))
		});
	} catch (error) {
		console.error('Failed to load member:', error);

		if (
			error &&
			typeof error === 'object' &&
			'status' in error &&
			typeof error.status === 'number'
		) {
			throw error;
		}

		return json(
			{
				error: 'Failed to load member.'
			},
			{ status: 500 }
		);
	}
};

export const PATCH: RequestHandler = async ({
	params,
	request,
	cookies
}) => {
	const memberId = params.id;

	if (!isUuid(memberId)) {
		return json(
			{ error: 'Invalid id' },
			{ status: 400 }
		);
	}

	const { system } =
		await getAuthenticatedSystem(cookies);

	let member: Member;

	try {
		member =
			(await request.json()) as Member;
	} catch {
		return json(
			{
				error: 'Invalid member data.'
			},
			{ status: 400 }
		);
	}

	if (
		!member ||
		typeof member !== 'object' ||
		member.id !== memberId ||
		!member.name?.trim()
	) {
		return json(
			{
				error: 'A valid member ID and name are required.'
			},
			{ status: 400 }
		);
	}

	if (
		!Array.isArray(member.aliases) ||
		!Array.isArray(member.interests) ||
		!Array.isArray(member.frontTriggers)
	) {
		return json(
			{
				error: 'Member list fields are invalid.'
			},
			{ status: 400 }
		);
	}

	const existingResult =
		await pool.query<{
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
			[memberId, system.id]
		);

	if (existingResult.rows.length === 0) {
		return json(
			{
				error: 'Member not found.'
			},
			{ status: 404 }
		);
	}

	const existing =
		existingResult.rows[0];

	let avatar =
		existing.avatar ?? '';

	let banner =
		existing.banner ?? '';

	/*
	 * A new image is represented by a data URI.
	 * Existing web media arrives as a URL, so we
	 * deliberately keep the existing database key
	 * in that case.
	 */
	const uploadedKeys: string[] = [];

	try {
		if (
			member.avatar?.startsWith(
				'data:'
			)
		) {
			const commaIndex =
				member.avatar.indexOf(',');

			if (commaIndex === -1) {
				return json(
					{
						error:
							'The avatar image data is invalid.'
					},
					{ status: 400 }
				);
			}

			const header =
				member.avatar.slice(
					5,
					commaIndex
				);

			const mimeType =
				header
					.split(';')[0]
					?.trim() ?? '';

			if (
				!mimeType.startsWith(
					'image/'
				)
			) {
				return json(
					{
						error:
							'Only image avatars are allowed.'
					},
					{ status: 400 }
				);
			}

			const payload =
				member.avatar.slice(
					commaIndex + 1
				);

			const bytes = header.includes(
				';base64'
			)
				? new Uint8Array(
						Buffer.from(
							payload,
							'base64'
						)
					)
				: new TextEncoder().encode(
						decodeURIComponent(
							payload
						)
					);

			if (
				bytes.byteLength >
				10 * 1024 * 1024
			) {
				return json(
					{
						error:
							'Avatar must be smaller than 10 MB.'
					},
					{ status: 413 }
				);
			}

			let extension = 'png';

			switch (
				mimeType.toLowerCase()
			) {
				case 'image/jpeg':
				case 'image/jpg':
					extension = 'jpg';
					break;

				case 'image/gif':
					extension = 'gif';
					break;

				case 'image/webp':
					extension = 'webp';
					break;

				case 'image/bmp':
					extension = 'bmp';
					break;
			}

			const key =
				`members/${memberId}/avatar.${extension}`;

			await s3.send(
				new PutObjectCommand({
					Bucket:
						MEMBER_MEDIA_BUCKET,
					Key: key,
					Body: bytes,
					ContentType: mimeType
				})
			);

			avatar = key;
			uploadedKeys.push(key);
		}

		if (
			member.banner?.startsWith(
				'data:'
			)
		) {
			const commaIndex =
				member.banner.indexOf(',');

			if (commaIndex === -1) {
				return json(
					{
						error:
							'The banner image data is invalid.'
					},
					{ status: 400 }
				);
			}

			const header =
				member.banner.slice(
					5,
					commaIndex
				);

			const mimeType =
				header
					.split(';')[0]
					?.trim() ?? '';

			if (
				!mimeType.startsWith(
					'image/'
				)
			) {
				return json(
					{
						error:
							'Only image banners are allowed.'
					},
					{ status: 400 }
				);
			}

			const payload =
				member.banner.slice(
					commaIndex + 1
				);

			const bytes = header.includes(
				';base64'
			)
				? new Uint8Array(
						Buffer.from(
							payload,
							'base64'
						)
					)
				: new TextEncoder().encode(
						decodeURIComponent(
							payload
						)
					);

			if (
				bytes.byteLength >
				10 * 1024 * 1024
			) {
				return json(
					{
						error:
							'Banner must be smaller than 10 MB.'
					},
					{ status: 413 }
				);
			}

			let extension = 'png';

			switch (
				mimeType.toLowerCase()
			) {
				case 'image/jpeg':
				case 'image/jpg':
					extension = 'jpg';
					break;

				case 'image/gif':
					extension = 'gif';
					break;

				case 'image/webp':
					extension = 'webp';
					break;

				case 'image/bmp':
					extension = 'bmp';
					break;
			}

			const key =
				`members/${memberId}/banner.${extension}`;

			await s3.send(
				new PutObjectCommand({
					Bucket:
						MEMBER_MEDIA_BUCKET,
					Key: key,
					Body: bytes,
					ContentType: mimeType
				})
			);

			banner = key;
			uploadedKeys.push(key);
		}

		const client =
			await pool.connect();

		try {
			await client.query(
				'BEGIN'
			);

			await client.query(
				`
					UPDATE members
					SET
						name = $1,
						pronouns = $2,
						aliases = $3,
						role = $4,
						status = $5,
						about = $6,
						interests = $7,
						front_triggers = $8,
						avatar = $9,
						banner = $10,
						is_fronting = $11
					WHERE id = $12
						AND system_id = $13
				`,
				[
					member.name.trim(),
					member.pronouns?.trim() ?? '',
					JSON.stringify(
						member.aliases
					),
					member.role?.trim() ||
						'member',
					member.status?.trim() ||
						'active',
					member.about?.trim() ?? '',
					JSON.stringify(
						member.interests
					),
					JSON.stringify(
						member.frontTriggers
					),
					avatar,
					banner,
					member.isFronting
						? 1
						: 0,
					memberId,
					system.id
				]
			);

			await client.query(
				`
					DELETE FROM custom_fields
					WHERE member_id = $1
						AND system_id = $2
				`,
				[
					memberId,
					system.id
				]
			);

			for (
				const field of
					member.customFields ?? []
			) {
				if (!field.id) {
					continue;
				}

				await client.query(
					`
						INSERT INTO custom_fields (
							id,
							system_id,
							member_id,
							label,
							type,
							value,
							description,
							sort_order
						)
						VALUES (
							$1,
							$2,
							$3,
							$4,
							$5,
							$6,
							$7,
							$8
						)
					`,
					[
						field.id,
						system.id,
						memberId,
						field.label ?? '',
						field.type ?? 'text',
						field.value ?? '',
						field.description ?? '',
						field.sortOrder ?? 0
					]
				);
			}

			await client.query(
				'COMMIT'
			);

			return json({
				member: {
					...member,
					avatar,
					banner
				}
			});
		} catch (caughtError) {
			await client.query(
				'ROLLBACK'
			);

			for (const key of uploadedKeys) {
				try {
					await s3.send(
						new DeleteObjectCommand({
							Bucket:
								MEMBER_MEDIA_BUCKET,
							Key: key
						})
					);
				} catch {
					// Best-effort cleanup.
				}
			}

			throw caughtError;
		} finally {
			client.release();
		}
	} catch (caughtError) {
		console.error(
			'Failed to update member:',
			caughtError
		);

		return json(
			{
				error:
					'Failed to update member.'
			},
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({
	params,
	cookies
}) => {
	const { system } =
		await getAuthenticatedSystem(cookies);

	const { id } = params;

	if (!id) {
		throw error(
			400,
			'Member ID is required.'
		);
	}

	const memberResult = await pool.query<{
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
		[id, system.id]
	);

	if (memberResult.rows.length === 0) {
		throw error(
			404,
			'Member not found.'
		);
	}

	const member =
		memberResult.rows[0];

	await pool.query(
		`
			DELETE FROM members
			WHERE id = $1
				AND system_id = $2
		`,
		[id, system.id]
	);

	const mediaKeys = [
		member.avatar,
		member.banner
	].filter(
		(value): value is string =>
			typeof value === 'string' &&
			value.startsWith(
				`members/${id}/`
			)
	);

	for (const key of mediaKeys) {
		try {
			await s3.send(
				new DeleteObjectCommand({
					Bucket:
						MEMBER_MEDIA_BUCKET,
					Key: key
				})
			);
		} catch (mediaError) {
			console.error(
				'Failed to delete member media:',
				mediaError
			);
		}
	}

	return json({
		ok: true
	});
};