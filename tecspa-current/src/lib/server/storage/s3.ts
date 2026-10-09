import { env } from '$env/dynamic/private';
import {
	HeadBucketCommand,
	S3Client
} from '@aws-sdk/client-s3';

const requiredEnvironmentVariables = [
	'AWS_ENDPOINT_URL_S3',
	'AWS_ACCESS_KEY_ID',
	'AWS_SECRET_ACCESS_KEY',
	'AWS_REGION'
] as const;

for (const variable of requiredEnvironmentVariables) {
	if (!env[variable]) {
		throw new Error(`${variable} is not configured.`);
	}
}

export const MEMBER_MEDIA_BUCKET = 'member-media';

export const s3 = new S3Client({
	endpoint: env.AWS_ENDPOINT_URL_S3!,
	region: env.AWS_REGION!,
	credentials: {
		accessKeyId: env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY!
	},
	forcePathStyle: true
});

export async function verifyMemberMediaStorage(): Promise<void> {
	await s3.send(
		new HeadBucketCommand({
			Bucket: MEMBER_MEDIA_BUCKET
		})
	);
}