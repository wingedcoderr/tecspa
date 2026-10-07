import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import type { PluralSpaceImportData } from '$lib/importers/pluralspace';
import type { AmpersandImportResult } from '$lib/repositories/ampersand-import';
import { pool } from '$lib/server/db/postgres';
import { getAuthenticatedSystem } from '$lib/server/system';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { system } = await getAuthenticatedSystem(cookies);

	let importData: PluralSpaceImportData;

	try {
		importData = (await request.json()) as PluralSpaceImportData;
	} catch {
		return json(
			{ error: 'The import data is invalid.' },
			{ status: 400 }
		);
	}

	if (
		!importData ||
		!Array.isArray(importData.members) ||
		!Array.isArray(importData.frontHistory) ||
		!Array.isArray(importData.customFields) ||
		!Array.isArray(importData.journalEntries)
	) {
		return json(
			{ error: 'The PluralSpace import data is incomplete.' },
			{ status: 400 }
		);
	}

	if (importData.members.length === 0) {
		return json(
			{ error: 'The PluralSpace export contains no members.' },
			{ status: 400 }
		);
	}

	const sourceIds = new Set<string>();

	for (const member of importData.members) {
		if (!member.id || sourceIds.has(member.id)) {
			return json(
				{
					error:
						'The PluralSpace export contains duplicate or missing member IDs.'
				},
				{ status: 400 }
			);
		}

		sourceIds.add(member.id);
	}

	for (const entry of importData.frontHistory) {
		if (!sourceIds.has(entry.memberId)) {
			return json(
				{
					error:
						'The PluralSpace export contains front history for an unknown member.'
				},
				{ status: 400 }
			);
		}
	}

	for (const field of importData.customFields) {
		if (!sourceIds.has(field.memberId)) {
			return json(
				{
					error:
						'The PluralSpace export contains a custom field for an unknown member.'
				},
				{ status: 400 }
			);
		}
	}

	for (const entry of importData.journalEntries) {
		if (entry.authorMemberId && !sourceIds.has(entry.authorMemberId)) {
			return json(
				{
					error:
						'The PluralSpace export contains a journal entry for an unknown member.'
				},
				{ status: 400 }
			);
		}
	}

	const memberIdMap = new Map<string, string>();

	for (const member of importData.members) {
		memberIdMap.set(member.id, crypto.randomUUID());
	}

	const client = await pool.connect();

	try {
		await client.query('BEGIN');

		for (const sourceMember of importData.members) {
			const memberId = memberIdMap.get(sourceMember.id);

			if (!memberId) {
				throw new Error('Failed to map an imported member ID.');
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
						$1, $2, $3, $4, $5, $6, $7,
						$8, $9, $10, $11, $12, $13
					)
				`,
				[
					memberId,
					system.id,
					sourceMember.name,
					sourceMember.pronouns,
					JSON.stringify(sourceMember.aliases),
					sourceMember.role,
					sourceMember.status,
					sourceMember.about,
					JSON.stringify(sourceMember.interests),
					JSON.stringify(sourceMember.frontTriggers),
					'',
					'',
					sourceMember.isFronting ? 1 : 0
				]
			);
		}

		for (const field of importData.customFields) {
			const memberId = memberIdMap.get(field.memberId);

			if (!memberId) {
				throw new Error('Failed to map a custom field member ID.');
			}

			await client.query(
				`
					INSERT INTO custom_fields (
						id, system_id, member_id, label, type,
						value, description, sort_order
					)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
				`,
				[
					crypto.randomUUID(),
					system.id,
					memberId,
					field.label,
					field.type,
					field.value,
					field.description,
					field.sortOrder
				]
			);
		}

		for (const entry of importData.frontHistory) {
			const memberId = memberIdMap.get(entry.memberId);

			if (!memberId) {
				throw new Error('Failed to map a front history member ID.');
			}

			await client.query(
				`
					INSERT INTO front_history (
						id, system_id, member_id, started_at, ended_at, note
					)
					VALUES ($1, $2, $3, $4, $5, $6)
				`,
				[
					crypto.randomUUID(),
					system.id,
					memberId,
					entry.startedAt,
					entry.endedAt,
					entry.note
				]
			);
		}

		for (const entry of importData.journalEntries) {
			const authorMemberId = entry.authorMemberId
				? memberIdMap.get(entry.authorMemberId) ?? null
				: null;

			await client.query(
				`
					INSERT INTO journal_entries (
						id, system_id, author_member_id, entry_type,
						title, body, tags, is_pinned, created_at, updated_at
					)
					VALUES ($1, $2, $3, 'journal', $4, $5, '[]', $6, $7, $8)
				`,
				[
					crypto.randomUUID(),
					system.id,
					authorMemberId,
					entry.title,
					entry.body,
					entry.isPinned ? 1 : 0,
					entry.createdAt,
					entry.updatedAt
				]
			);
		}

		await client.query('COMMIT');

		const result: AmpersandImportResult = {
			memberCount: importData.members.length,
			frontHistoryCount: importData.frontHistory.length,
			imageCount: 0,
			bannerCount: 0
		};

		return json({
			result,
			memberIdMap: Object.fromEntries(memberIdMap)
		});
	} catch (error) {
		try {
			await client.query('ROLLBACK');
		} catch {
			// Preserve the original import error.
		}

		console.error('Tecspa PluralSpace import failed:', error);

		return json(
			{
				error:
					error instanceof Error
						? error.message
						: 'The PluralSpace system could not be imported.'
			},
			{ status: 500 }
		);
	} finally {
		client.release();
	}
};
