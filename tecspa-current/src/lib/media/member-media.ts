import { open } from '@tauri-apps/plugin-dialog';

import {
	BaseDirectory,
	mkdir,
	readFile,
	remove,
	writeFile
} from '@tauri-apps/plugin-fs';

import { appDataDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';

import type { Member } from '$lib/data/members';

const MEDIA_DIRECTORY = 'member-media';

type MediaKind = 'avatar' | 'banner';

export type StoredMemberImage = {
	path: string;
	url: string;
};

function getExtension(filePath: string): string {
	const fileName =
		filePath.split(/[\\/]/).pop() ?? '';

	const match = fileName.match(
		/\.([a-zA-Z0-9]+)$/
	);

	if (!match) {
		return 'png';
	}

	const extension = match[1].toLowerCase();

	return [
		'png',
		'jpg',
		'jpeg',
		'gif',
		'webp',
		'bmp'
	].includes(extension)
		? extension
		: 'png';
}

async function ensureMediaDirectory() {
	await mkdir(MEDIA_DIRECTORY, {
		baseDir: BaseDirectory.AppData,
		recursive: true
	});
}

export async function memberImageUrl(
	relativePath: string
): Promise<string> {
	if (!relativePath) {
		return '';
	}

	const absolutePath = await join(
		await appDataDir(),
		relativePath
	);

	return convertFileSrc(absolutePath);
}

export async function selectAndStoreMemberImage(
	memberId: string,
	kind: MediaKind,
	oldRelativePath = ''
): Promise<StoredMemberImage | null> {
	const selected = await open({
		multiple: false,
		directory: false,
		filters: [
			{
				name: 'Images',
				extensions: [
					'png',
					'jpg',
					'jpeg',
					'gif',
					'webp',
					'bmp'
				]
			}
		]
	});

	if (typeof selected !== 'string') {
		return null;
	}

	await ensureMediaDirectory();

	const extension = getExtension(selected);

	const relativePath =
		`${MEDIA_DIRECTORY}/${memberId}-${kind}-${Date.now()}.${extension}`;

	const bytes = await readFile(selected);

	await writeFile(relativePath, bytes, {
		baseDir: BaseDirectory.AppData
	});

	if (
		oldRelativePath &&
		oldRelativePath !== relativePath
	) {
		await removeStoredMemberImage(
			oldRelativePath
		);
	}

	return {
		path: relativePath,
		url: await memberImageUrl(relativePath)
	};
}

export async function removeStoredMemberImage(
	relativePath: string
) {
	if (
		!relativePath ||
		!relativePath.startsWith(
			`${MEDIA_DIRECTORY}/`
		)
	) {
		return;
	}

	try {
		await remove(relativePath, {
			baseDir: BaseDirectory.AppData
		});
	} catch {
		// The file may already be gone. That is harmless.
	}
}

export async function deleteMemberMedia(
	member: Member
) {
	await removeStoredMemberImage(member.avatar);
	await removeStoredMemberImage(member.banner);
}

export async function storeEmbeddedMemberImage(
	memberId: string,
	kind: MediaKind,
	dataUri: string,
	mimeType: string
): Promise<string> {
	if (
		!dataUri ||
		!dataUri.startsWith('data:')
	) {
		throw new Error(
			'The embedded image is not a valid data URI.'
		);
	}

	const commaIndex = dataUri.indexOf(',');

	if (commaIndex === -1) {
		throw new Error(
			'The embedded image data is malformed.'
		);
	}

	const header = dataUri.slice(
		0,
		commaIndex
	);

	const payload = dataUri.slice(
		commaIndex + 1
	);

	const isBase64 =
		header.includes(';base64');

	let bytes: Uint8Array;

	if (isBase64) {
		const binary = atob(payload);

		bytes = new Uint8Array(
			binary.length
		);

		for (
			let index = 0;
			index < binary.length;
			index += 1
		) {
			bytes[index] =
				binary.charCodeAt(index);
		}
	} else {
		const decoded =
			decodeURIComponent(payload);

		bytes =
			new TextEncoder().encode(decoded);
	}

	const extensionByMimeType: Record<
		string,
		string
	> = {
		'image/png': 'png',
		'image/jpeg': 'jpg',
		'image/jpg': 'jpg',
		'image/gif': 'gif',
		'image/webp': 'webp',
		'image/bmp': 'bmp'
	};

	const extension =
		extensionByMimeType[
			mimeType.toLowerCase()
		] ?? 'png';

	await ensureMediaDirectory();

	const relativePath =
		`${MEDIA_DIRECTORY}/${memberId}-${kind}-${Date.now()}.${extension}`;

	await writeFile(relativePath, bytes, {
		baseDir: BaseDirectory.AppData
	});

	return relativePath;
}