import 'dotenv/config';

import Database from 'better-sqlite3';
import {
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';
import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DATABASE_URL = process.env.DATABASE_URL;

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not configured.');
}

if (!endpoint || !accessKeyId || !secretAccessKey || !region) {
	throw new Error(
		'Neon Object Storage environment variables are not configured.'
	);
}

const BUCKET = 'member-media';

const s3 = new S3Client({
	endpoint,
	region,
	credentials: {
		accessKeyId,
		secretAccessKey
	},
	forcePathStyle: true
});

const pool = new Pool({
	connectionString: DATABASE_URL
});

function getContentType(filePath: string): string {
	const extension = path.extname(filePath).toLowerCase();

	switch (extension) {
		case '.png':
			return 'image/png';
		case '.jpg':
		case '.jpeg':
			return 'image/jpeg';
		case '.gif':
			return 'image/gif';
		case '.webp':
			return 'image/webp';
		case '.bmp':
			return 'image/bmp';
		default:
			return 'application/octet-stream';
	}
}

function getSafeExtension(filePath: string): string {
	const extension = path.extname(filePath).toLowerCase();

	switch (extension) {
		case '.png':
			return 'png';
		case '.jpg':
		case '.jpeg':
			return 'jpg';
		case '.gif':
			return 'gif';
		case '.webp':
			return 'webp';
		case '.bmp':
			return 'bmp';
		default:
			throw new Error(
				`Unsupported image extension: ${extension || '(none)'}`
			);
	}
}

type MemberRow = {
	id: string;
	name: string;
	avatar: string;
	banner: string;
};

type MediaKind = 'avatar' | 'banner';

async function uploadMemberImage(
	appDataDirectory: string,
	member: MemberRow,
	kind: MediaKind,
	relativePath: string
): Promise<string> {
	if (!relativePath) {
		return '';
	}

	const localPath = path.join(
		appDataDirectory,
		'com.tecspa.app',
		relativePath
	);

	const bytes = await readFile(localPath);

	const extension = getSafeExtension(localPath);

	const objectKey =
		`members/${member.id}/${kind}.${extension}`;

	await s3.send(
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: objectKey,
			Body: bytes,
			ContentType: getContentType(localPath)
		})
	);

	console.log(
		`  ✓ ${kind}: ${objectKey}`
	);

	return objectKey;
}

async function main() {
	const appData = process.env.APPDATA;

	if (!appData) {
		throw new Error('APPDATA is not configured.');
	}

	const sqlitePath = path.join(
		appData,
		'com.tecspa.app',
		'tecspa.db'
	);

	console.log('');
	console.log('========================================');
	console.log(' TECSPA Member Media Migration');
	console.log('========================================');
	console.log('');
	console.log(`SQLite: ${sqlitePath}`);
	console.log(`Bucket: ${BUCKET}`);
	console.log('');

	const sqlite = new Database(sqlitePath, {
		readonly: true
	});

	try {
		const members = sqlite
			.prepare(`
				SELECT
					id,
					name,
					avatar,
					banner
				FROM members
				WHERE avatar != '' OR banner != ''
				ORDER BY name;
			`)
			.all() as MemberRow[];

		console.log(
			`Found ${members.length} members with media.`
		);
		console.log('');

		let avatarCount = 0;
		let bannerCount = 0;

		const migrated: Array<{
			id: string;
			name: string;
			avatar: string;
			banner: string;
		}> = [];

		for (const member of members) {
			console.log(`Processing: ${member.name}`);

			let avatarKey = '';
			let bannerKey = '';

			if (member.avatar) {
				avatarKey = await uploadMemberImage(
					appData,
					member,
					'avatar',
					member.avatar
				);

				avatarCount += 1;
			}

			if (member.banner) {
				bannerKey = await uploadMemberImage(
					appData,
					member,
					'banner',
					member.banner
				);

				bannerCount += 1;
			}

			migrated.push({
				id: member.id,
				name: member.name,
				avatar: avatarKey,
				banner: bannerKey
			});

			console.log('');
		}

		console.log('All files uploaded successfully.');
		console.log('');
		console.log('Updating Neon member records...');

		const client = await pool.connect();

		try {
			await client.query('BEGIN');

			for (const member of migrated) {
				await client.query(
					`
						UPDATE members
						SET
							avatar = $1,
							banner = $2
						WHERE id = $3;
					`,
					[
						member.avatar,
						member.banner,
						member.id
					]
				);

				console.log(
					`  ✓ ${member.name}`
				);
			}

			await client.query('COMMIT');
		} catch (error) {
			await client.query('ROLLBACK');
			throw error;
		} finally {
			client.release();
		}

		console.log('');
		console.log('========================================');
		console.log(' Migration complete!');
		console.log('========================================');
		console.log('');
		console.log(`Avatars uploaded: ${avatarCount}`);
		console.log(`Banners uploaded: ${bannerCount}`);
		console.log('');
		console.log(
			'Original desktop files were NOT modified.'
		);
		console.log('');
	} finally {
		sqlite.close();
		await pool.end();
	}
}

main().catch((error) => {
	console.error('');
	console.error('========================================');
	console.error(' Migration failed');
	console.error('========================================');
	console.error('');
	console.error(error);
	console.error('');

	process.exit(1);
});