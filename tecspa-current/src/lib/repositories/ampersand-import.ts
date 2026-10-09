import { getDatabase } from '../db/database';
import {
	storeEmbeddedMemberImage,
	removeStoredMemberImage
} from '../media/member-media';
import { createMember } from './members';

import type { AmpersandImportData } from '../importers/ampersand';

type ImportedMedia = {
	path: string;
};

export type AmpersandImportResult = {
	memberCount: number;
	frontHistoryCount: number;
	imageCount: number;
	bannerCount: number;
};

export async function importAmpersandData(
	importData: AmpersandImportData
): Promise<AmpersandImportResult> {
	const db = await getDatabase();

	const createdMedia: ImportedMedia[] = [];

	let transactionStarted = false;

	try {
		await db.execute('BEGIN TRANSACTION');

		transactionStarted = true;

		/*
		 * =========================================================
		 * MEMBERS
		 * =========================================================
		 *
		 * The parser has already generated stable TECSPA IDs.
		 *
		 * We keep those IDs because front-history entries already
		 * reference them.
		 */

		let imageCount = 0;
		let bannerCount = 0;

		for (const item of importData.members) {
			const member = {
				...item.member,
				avatar: '',
				banner: ''
			};

			/*
			 * =====================================================
			 * AVATAR
			 * =====================================================
			 */

			if (item.member.avatar) {
				const avatarImage =
					extractEmbeddedImage(
						item.member.avatar
					);

				if (avatarImage) {
					const path =
						await storeEmbeddedMemberImage(
							member.id,
							'avatar',
							avatarImage.dataUri,
							avatarImage.mimeType
						);

					createdMedia.push({ path });

					member.avatar = path;

					imageCount += 1;
				}
			}

			/*
			 * =====================================================
			 * BANNER
			 * =====================================================
			 */

			if (item.member.banner) {
				const bannerImage =
					extractEmbeddedImage(
						item.member.banner
					);

				if (bannerImage) {
					const path =
						await storeEmbeddedMemberImage(
							member.id,
							'banner',
							bannerImage.dataUri,
							bannerImage.mimeType
						);

					createdMedia.push({ path });

					member.banner = path;

					bannerCount += 1;
				}
			}

			await createMember(member);
		}

		/*
		 * =========================================================
		 * FRONT HISTORY
		 * =========================================================
		 *
		 * We insert these directly because these are historical
		 * events. We do NOT use setMemberFronting(), because that
		 * would create new "current" fronting events using now()
		 * instead of preserving the original Ampersand timestamps.
		 */

		for (const entry of importData.frontHistory) {
			await db.execute(
				`
					INSERT INTO front_history (
						id,
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
						$5
					)
				`,
				[
					entry.id,
					entry.memberId,
					entry.startedAt,
					entry.endedAt,
					entry.note
				]
			);
		}

		/*
		 * =========================================================
		 * COMMIT
		 * =========================================================
		 */

		await db.execute('COMMIT');

		transactionStarted = false;

		return {
			memberCount: importData.members.length,
			frontHistoryCount:
				importData.frontHistory.length,
			imageCount,
			bannerCount
		};
	} catch (error) {
		/*
		 * =========================================================
		 * ROLLBACK
		 * =========================================================
		 */

		if (transactionStarted) {
			try {
				await db.execute('ROLLBACK');
			} catch {
				// Keep the original import error.
			}
		}

		/*
		 * SQLite has rolled back, but files are outside SQLite.
		 *
		 * Remove any images/banners that were created before the
		 * failure so the filesystem stays consistent with the DB.
		 */

		for (const media of createdMedia) {
			await removeStoredMemberImage(
				media.path
			);
		}

		throw error;
	}
}

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

	const header = value.slice(
		5,
		commaIndex
	);

	const mimeType =
		header
			.split(';')[0]
			?.trim() ?? '';

	if (!mimeType) {
		return null;
	}

	return {
		dataUri: value,
		mimeType
	};
}