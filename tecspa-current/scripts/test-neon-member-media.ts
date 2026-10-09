import 'dotenv/config';

import Database from 'better-sqlite3';
import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
	throw new Error('Neon Object Storage environment variables are not configured.');
}

const bucket = 'member-media';

const s3 = new S3Client({
	endpoint,
	region,
	credentials: {
		accessKeyId,
		secretAccessKey
	},
	forcePathStyle: true
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

async function main() {
	const appData = process.env.APPDATA;

	if (!appData) {
		throw new Error('APPDATA is not configured.');
	}

	const databasePath = path.join(
		appData,
		'com.tecspa.app',
		'tecspa.db'
	);

	const mediaDirectory = path.join(
		appData,
		'com.tecspa.app',
		'member-media'
	);

	console.log('Opening SQLite database:');
	console.log(databasePath);

	const db = new Database(databasePath, {
		readonly: true
	});

	try {
		const member = db
			.prepare(`
				SELECT
					id,
					name,
					avatar
				FROM members
				WHERE avatar != ''
				ORDER BY name
				LIMIT 1;
			`)
			.get() as
			| {
					id: string;
					name: string;
					avatar: string;
			  }
			| undefined;

		if (!member) {
			throw new Error('No member with an avatar was found.');
		}

		console.log(`Found member: ${member.name}`);
		console.log(`Database avatar path: ${member.avatar}`);

		const avatarFilePath = path.join(
			appData,
			'com.tecspa.app',
			member.avatar
		);

		console.log(`Local avatar file: ${avatarFilePath}`);

		const bytes = await readFile(avatarFilePath);

		const fileName = path.basename(avatarFilePath);

		const objectKey = `members/${member.id}/test-avatar-${fileName}`;

		console.log(`Uploading to: ${objectKey}`);

		await s3.send(
			new PutObjectCommand({
				Bucket: bucket,
				Key: objectKey,
				Body: bytes,
				ContentType: getContentType(avatarFilePath)
			})
		);

		console.log('Upload successful.');

const signedUrl = await getSignedUrl(
	s3,
	new GetObjectCommand({
		Bucket: bucket,
		Key: objectKey
	}),
			{
				expiresIn: 3600
			}
		);

		console.log('');
		console.log('Test object uploaded successfully.');
		console.log('');
		console.log('Object key:');
		console.log(objectKey);
		console.log('');
		console.log('Signed URL:');
		console.log(signedUrl);
		console.log('');
		console.log('The original local file was NOT changed.');
	} finally {
		db.close();
	}
}

main().catch((error) => {
	console.error('');
	console.error('Neon media test failed:');
	console.error(error);
	process.exit(1);
});