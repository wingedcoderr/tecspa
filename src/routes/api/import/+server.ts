import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import {
	PutObjectCommand,
	DeleteObjectCommand
} from '@aws-sdk/client-s3';

import { pool } from '$lib/server/db/postgres';
import {
	isUuid,
	sniffImageMime
} from '$lib/server/validate';
import {
	MEMBER_MEDIA_BUCKET,
	s3
} from '$lib/server/storage/s3';

import { getAuthenticatedSystem } from '$lib/server/system';

import type { AmpersandImportData } from '$lib/importers/ampersand';

const MAX_IMPORT_BODY_BYTES = 50 * 1024 * 1024;

const MAX_IMPORT_MEMBERS = 200;

const MAX_IMPORT_CUSTOM_FIELDS_PER_MEMBER = 50;

const MAX_IMPORT_FRONT_HISTORY = 1000;

const MAX_EMBEDDED_IMAGE_BYTES = 5 * 1024 * 1024;

class ImportValidationError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

type MediaUpload = {
	key: string;
};

type AmpersandImportResult = {
	memberCount: number;
	frontHistoryCount: number;
	imageCount: number;
	bannerCount: number;
};

function extractEmbeddedImage(
	value: string
): {
	dataUri: string;
	mimeType: string;
} | null {
	if (!value.startsWith('data:')) {
		return null;
	}

	const commaIndex = value.indexOf(',');

	if (commaIndex === -1) {
		return null;
	}

	const header = value.slice(5, commaIndex);

	const mimeType =
		header.split(';')[0]?.trim() ?? '';

	if (!mimeType) {
		return null;
	}

	return {
		dataUri: value,
		mimeType
	};
}

function dataUriToBytes(
	dataUri: string
): Uint8Array {
	const commaIndex = dataUri.indexOf(',');

	if (commaIndex === -1) {
		throw new Error(
			'The embedded image data is malformed.'
		);
	}

	const header = dataUri.slice(0, commaIndex);
	const payload = dataUri.slice(commaIndex + 1);

	if (header.includes(';base64')) {
		const binary = Buffer.from(
			payload,
			'base64'
		);

		return new Uint8Array(binary);
	}

	return new TextEncoder().encode(
		decodeURIComponent(payload)
	);
}

function extensionForMimeType(
	mimeType: string
): string {
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

async function uploadEmbeddedImage(
	memberId: string,
	kind: 'avatar' | 'banner',
	dataUri: string
): Promise<string> {
	if (!isUuid(memberId)) {
		throw new ImportValidationError(
			'Invalid input',
			422
		);
	}

	const bytes =
		dataUriToBytes(dataUri);

	if (
		bytes.byteLength >
		MAX_EMBEDDED_IMAGE_BYTES
	) {
		throw new ImportValidationError(
			'Payload too large',
			413
		);
	}

	const mimeType = sniffImageMime(bytes);

	if (!mimeType) {
		throw new ImportValidationError(
			'Unsupported media type',
			415
		);
	}

	const extension =
		extensionForMimeType(mimeType);

	const key =
		`members/${memberId}/${kind}.${extension}`;

	await s3.send(
		new PutObjectCommand({
			Bucket: MEMBER_MEDIA_BUCKET,
			Key: key,
			Body: bytes,
			ContentType: mimeType
		})
	);

	return key;
}

export const POST: RequestHandler = async ({
	request,
	cookies
}) => {
	const { system } =
		await getAuthenticatedSystem(cookies);

	const contentLength =
		Number(
			request.headers.get(
				'content-length'
			)
		) || 0;

	if (contentLength > MAX_IMPORT_BODY_BYTES) {
		return json(
			{ error: 'Payload too large' },
			{ status: 413 }
		);
	}

	let importData: AmpersandImportData;

	try {
		const raw = await request.text();

		if (
			Buffer.byteLength(raw) >
			MAX_IMPORT_BODY_BYTES
		) {
			return json(
				{ error: 'Payload too large' },
				{ status: 413 }
			);
		}

		importData = JSON.parse(
			raw
		) as AmpersandImportData;
	} catch {
		return json(
			{
				error: 'The import data is invalid.'
			},
			{ status: 400 }
		);
	}

	if (
		(importData.members?.length ?? 0) >
		MAX_IMPORT_MEMBERS
	) {
		return json(
			{ error: 'Invalid input' },
			{ status: 422 }
		);
	}

	if (
		(importData.frontHistory?.length ?? 0) >
		MAX_IMPORT_FRONT_HISTORY
	) {
		return json(
			{ error: 'Invalid input' },
			{ status: 422 }
		);
	}

	for (const item of importData.members ??
		[]) {
		if (
			(item.member.customFields?.length ??
				0) >
			MAX_IMPORT_CUSTOM_FIELDS_PER_MEMBER
		) {
			return json(
				{ error: 'Invalid input' },
				{ status: 422 }
			);
		}
	}

	const client = await pool.connect();

	const uploadedMedia: MediaUpload[] = [];

	let transactionStarted = false;

	try {
		await client.query('BEGIN');

		transactionStarted = true;

		let imageCount = 0;
		let bannerCount = 0;

		for (const item of importData.members) {
			const member = {
				...item.member,
				avatar: '',
				banner: ''
			};

			if (item.member.avatar) {
				const avatarImage =
					extractEmbeddedImage(
						item.member.avatar
					);

				if (avatarImage) {
					const key =
						await uploadEmbeddedImage(
							member.id,
							'avatar',
							avatarImage.dataUri
						);

					uploadedMedia.push({ key });

					member.avatar = key;
					imageCount += 1;
				}
			}

			if (item.member.banner) {
				const bannerImage =
					extractEmbeddedImage(
						item.member.banner
					);

				if (bannerImage) {
					const key =
						await uploadEmbeddedImage(
							member.id,
							'banner',
							bannerImage.dataUri
						);

					uploadedMedia.push({ key });

					member.banner = key;
					bannerCount += 1;
				}
			}

			await client.query(
				`
					INSERT INTO members (
						id,
						system_id,
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
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5,
						$6,
						$7,
						$8,
						$9,
						$10,
						$11,
						$12,
						$13
					)
				`,
				[
					member.id,
					system.id,
					member.name,
					member.pronouns,
					JSON.stringify(
						member.aliases
					),
					member.role,
					member.status,
					member.about,
					JSON.stringify(
						member.interests
					),
					JSON.stringify(
						member.frontTriggers
					),
					member.avatar,
					member.banner,
					member.isFronting ? 1 : 0
				]
			);

			for (
				const field of
					member.customFields ?? []
			) {
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
						member.id,
						field.label,
						field.type,
						field.value,
						field.description,
						field.sortOrder
					]
				);
			}
		}

				const importedMemberIds =
			new Set(
				importData.members.map(
					(item) => item.member.id
				)
			);

		for (
			const entry of
				importData.frontHistory
		) {
			if (
				!importedMemberIds.has(
					entry.memberId
				)
			) {
				throw new Error(
					'The import contains front history for a member that is not part of the imported system.'
				);
			}

			await client.query(
				`
					INSERT INTO front_history (
						id,
						system_id,
						member_id,
						started_at,
						ended_at,
						note
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5,
						$6
					)
				`,
				[
					entry.id,
					system.id,
					entry.memberId,
					entry.startedAt,
					entry.endedAt,
					entry.note
				]
			);
		}
		
		await client.query('COMMIT');

		transactionStarted = false;

		const result: AmpersandImportResult = {
			memberCount:
				importData.members.length,
			frontHistoryCount:
				importData.frontHistory.length,
			imageCount,
			bannerCount
		};

		return json({
			result
		});
	} catch (error) {
		if (transactionStarted) {
			try {
				await client.query(
					'ROLLBACK'
				);
			} catch {
				// Keep the original import error.
			}
		}

		for (const media of uploadedMedia) {
			try {
				await s3.send(
					new DeleteObjectCommand({
						Bucket:
							MEMBER_MEDIA_BUCKET,
						Key: media.key
					})
				);
			} catch {
				// Keep the original import error.
			}
		}

		if (
			error instanceof
			ImportValidationError
		) {
			return json(
				{ error: error.message },
				{ status: error.status }
			);
		}

		console.error(
			'TECSPA import failed:',
			error
		);

		return json(
			{ error: 'Import failed' },
			{ status: 500 }
		);
	} finally {
		client.release();
	}
};