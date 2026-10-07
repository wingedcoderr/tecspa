import type { Member, CustomFieldType } from '$lib/data/members';
import type { FrontHistoryEntry } from '$lib/data/activity';

import { unzipSync, strFromU8 } from 'fflate';

export type PluralSpaceSourceFormat =
	| 'openplural-json'
	| 'openplural-zip'
	| 'legacy-json';

export type PluralSpaceMedia = {
	path: string;
	data: Uint8Array;
	mimeType: string;
};

export type PluralSpaceImportData = {
	system: {
		id: string;
		name: string;
		description: string;
		tag: string;
		color: string;
	};

	members: Member[];

	frontHistory: FrontHistoryEntry[];

	customFields: Array<{
		id: string;
		memberId: string;
		label: string;
		type: CustomFieldType;
		value: string;
		description: string;
		sortOrder: number;
	}>;

	journalEntries: Array<{
		id: string;
		title: string;
		body: string;
		authorMemberId: string | null;
		createdAt: string;
		updatedAt: string;
		isPinned: boolean;
	}>;

	media: PluralSpaceMedia[];

	warnings: string[];

	sourceFormat: PluralSpaceSourceFormat;
	sourceVersion: string;
};

type UnknownRecord = Record<string, unknown>;

type OpenPluralDocument = UnknownRecord & {
	openplural_version?: unknown;
	pluralport_version?: unknown;
	producer?: UnknownRecord;
	systems?: unknown[];
	members?: unknown[];
	front_periods?: unknown[];
	front_events?: unknown[];
	custom_fields?: unknown[];
	notes?: unknown[];
	assets?: unknown[];
	extensions?: UnknownRecord;
};

function isRecord(value: unknown): value is UnknownRecord {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value)
	);
}

function asString(
	value: unknown,
	fallback = ''
): string {
	return typeof value === 'string'
		? value
		: fallback;
}

function asBoolean(
	value: unknown,
	fallback = false
): boolean {
	return typeof value === 'boolean'
		? value
		: fallback;
}

function asNumber(
	value: unknown,
	fallback = 0
): number {
	return typeof value === 'number'
		? value
		: fallback;
}

function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function getFirstString(
	record: UnknownRecord,
	keys: string[],
	fallback = ''
): string {
	for (const key of keys) {
		const value = record[key];

		if (typeof value === 'string' && value.trim()) {
			return value;
		}
	}

	return fallback;
}

function getRecordId(record: UnknownRecord): string {
	return getFirstString(record, [
		'id',
		'uuid'
	]);
}

function getPrivacyText(
	value: unknown
): string {
	if (typeof value === 'string') {
		return value;
	}

	if (isRecord(value)) {
		return getFirstString(value, [
			'visibility',
			'level',
			'value'
		]);
	}

	return '';
}

function normalizeList(
	value: unknown
): string[] {
	return asArray(value)
		.map((item) => {
			if (typeof item === 'string') {
				return item.trim();
			}

			if (isRecord(item)) {
				return getFirstString(item, [
					'name',
					'label',
					'value'
				]).trim();
			}

			return '';
		})
		.filter(Boolean);
}

function getExtensions(
	record: UnknownRecord
): UnknownRecord {
	return isRecord(record.extensions)
		? record.extensions
		: {};
}

function getMediaMimeType(
	path: string
): string {
	const extension =
		path.split('.').pop()?.toLowerCase() ?? '';

	switch (extension) {
		case 'webp':
			return 'image/webp';

		case 'png':
			return 'image/png';

		case 'jpg':
		case 'jpeg':
			return 'image/jpeg';

		case 'gif':
			return 'image/gif';

		case 'svg':
			return 'image/svg+xml';

		default:
			return 'application/octet-stream';
	}
}

function bytesToBase64(
	data: Uint8Array
): string {
	const chunkSize = 0x8000;
	let binary = '';

	for (
		let offset = 0;
		offset < data.length;
		offset += chunkSize
	) {
		const chunk = data.subarray(
			offset,
			Math.min(offset + chunkSize, data.length)
		);

		binary += String.fromCharCode(...chunk);
	}

	return btoa(binary);
}

function mediaToDataUrl(
	media: PluralSpaceMedia
): string {
	return `data:${media.mimeType};base64,${bytesToBase64(media.data)}`;
}

function normalizeAssetUri(
	value: string
): string {
	return value
		.replace(/^\.\//, '')
		.replace(/^\//, '');
}

function buildAssetDataUrls(
	document: OpenPluralDocument,
	media: PluralSpaceMedia[]
): Map<string, string> {
	const result = new Map<string, string>();

	const mediaByPath = new Map(
		media.map((item) => [
			normalizeAssetUri(item.path),
			item
		])
	);

	for (const rawAsset of asArray(document.assets)) {
		if (!isRecord(rawAsset)) {
			continue;
		}

		const id = getRecordId(rawAsset);
		const uri = getFirstString(
			rawAsset,
			['uri', 'path', 'file_path', 'filePath']
		);

		if (!id || !uri) {
			continue;
		}

		const matchedMedia =
			mediaByPath.get(
				normalizeAssetUri(uri)
			);

		if (matchedMedia) {
			result.set(
				id,
				mediaToDataUrl(matchedMedia)
			);
		}
	}

	return result;
}

function getCurrentFrontingMemberIds(
	document: OpenPluralDocument
): Set<string> {
	const result = new Set<string>();

	for (const raw of asArray(document.front_periods)) {
		if (!isRecord(raw)) {
			continue;
		}

		const endedAt =
			getFirstString(
				raw,
				[
					'ended_at',
					'endedAt',
					'end'
				]
			);

		if (endedAt) {
			continue;
		}

		for (const memberId of extractMemberIds(raw)) {
			result.add(memberId);
		}
	}

	return result;
}

function normalizeCustomFieldType(
	value: unknown
): CustomFieldType {
	const type =
		typeof value === 'string'
			? value.toLowerCase()
			: 'text';

	switch (type) {
		case 'number':
			return 'number';

		case 'checkbox':
		case 'boolean':
		case 'bool':
			return 'checkbox';

		case 'date':
			return 'date';

		case 'tags':
		case 'tag':
		case 'multiselect':
		case 'multi-select':
			return 'tags';

		case 'long-text':
		case 'long_text':
		case 'textarea':
		case 'markdown':
			return 'long-text';

		default:
			return 'text';
	}
}

function normalizeSystem(
	raw: unknown
): PluralSpaceImportData['system'] {
	const system = isRecord(raw)
		? raw
		: {};

	return {
		id: getRecordId(system),
		name: getFirstString(
			system,
			['name', 'display_name'],
			'Imported TECSPA System'
		),
		description: getFirstString(
			system,
			['description', 'about']
		),
		tag: getFirstString(
			system,
			['tag', 'system_tag']
		),
		color: getFirstString(
			system,
			['color', 'colour']
		)
	};
}

function findSystem(
	document: OpenPluralDocument
): UnknownRecord | null {
	const systems = asArray(document.systems);

	if (systems.length > 0) {
		const first = systems[0];

		if (isRecord(first)) {
			return first;
		}
	}

	/*
	 * Some exporters may put the system information
	 * directly at the document root.
	 */
	if (
		document.name ||
		document.description ||
		document.system_name
	) {
		return document;
	}

	return null;
}

function normalizeMember(
	raw: unknown,
	index: number,
	currentFrontingIds: Set<string>,
	assetDataUrls: Map<string, string>,
	warnings: string[]
): Member | null {
	if (!isRecord(raw)) {
		return null;
	}

	const id =
		getRecordId(raw) ||
		`pluralspace-member-${index + 1}`;

	const extensions = getExtensions(raw);

	const aliases = normalizeList(
		raw.aliases ??
			raw.alternate_names ??
			raw.alternative_names
	);

	const interests = normalizeList(
		raw.interests ??
			raw.tags
	);

	const frontTriggers = normalizeList(
		raw.front_triggers ??
			raw.frontTriggers ??
			extensions.front_triggers
	);

	const avatarAssetId =
		getFirstString(raw, [
			'avatar_asset_id',
			'avatarAssetId'
		]);

	const bannerAssetId =
		getFirstString(raw, [
			'banner_asset_id',
			'bannerAssetId'
		]);

	const directAvatar =
		getFirstString(raw, [
			'avatar',
			'avatar_url',
			'avatarUrl'
		]);

	const directBanner =
		getFirstString(raw, [
			'banner',
			'banner_url',
			'bannerUrl'
		]);

	const avatar =
		directAvatar ||
		(avatarAssetId
			? assetDataUrls.get(avatarAssetId) ?? ''
			: '');

	const banner =
		directBanner ||
		(bannerAssetId
			? assetDataUrls.get(bannerAssetId) ?? ''
			: '');

	if (
		avatarAssetId &&
		!directAvatar &&
		!assetDataUrls.has(avatarAssetId)
	) {
		warnings.push(
			`Member "${getFirstString(raw, ['name', 'display_name'], `Imported Member ${index + 1}`)}" references an avatar asset that was not included in the selected export data.`
		);
	}

	if (
		bannerAssetId &&
		!directBanner &&
		!assetDataUrls.has(bannerAssetId)
	) {
		warnings.push(
			`Member "${getFirstString(raw, ['name', 'display_name'], `Imported Member ${index + 1}`)}" references a banner asset that was not included in the selected export data.`
		);
	}

	const explicitFronting =
		raw.is_fronting ??
		raw.isFronting ??
		raw.currently_fronting ??
		raw.currentFronting;

	const isFronting =
		typeof explicitFronting === 'boolean'
			? explicitFronting
			: currentFrontingIds.has(id);

	const role =
		getFirstString(
			raw,
			['role', 'member_role'],
			'member'
		);

	const status =
		getFirstString(
			raw,
			['status', 'state'],
			'as-active'
		);

	const about =
		getFirstString(
			raw,
			[
				'description',
				'about',
				'bio'
			]
		);

	return {
		id,
		name: getFirstString(
			raw,
			['name', 'display_name'],
			`Imported Member ${index + 1}`
		),
		pronouns: getFirstString(
			raw,
			['pronouns']
		),
		aliases,
		role,
		status,
		about,
		interests,
		frontTriggers,
		avatar,
		banner,
		isFronting,
		customFields: []
	};
}

function extractMemberId(
	raw: UnknownRecord
): string | null {
	const direct = getFirstString(raw, [
		'member_id',
		'memberId',
		'assigned_member_id',
		'assignedMemberId'
	]);

	if (direct) {
		return direct;
	}

	const assignments =
		asArray(raw.assignments);

	for (const assignment of assignments) {
		if (!isRecord(assignment)) {
			continue;
		}

		const memberId = getFirstString(
			assignment,
			[
				'member_id',
				'memberId',
				'subject_id'
			]
		);

		if (memberId) {
			return memberId;
		}
	}

	const memberIds =
		asArray(raw.member_ids);

	for (const memberId of memberIds) {
		if (typeof memberId === 'string') {
			return memberId;
		}

		if (isRecord(memberId)) {
			const id = getFirstString(
				memberId,
				['id', 'member_id']
			);

			if (id) {
				return id;
			}
		}
	}

	return null;
}

function extractMemberIds(
	raw: UnknownRecord
): string[] {
	const ids = new Set<string>();

	const single = extractMemberId(raw);

	if (single) {
		ids.add(single);
	}

	for (const item of asArray(raw.member_ids)) {
		if (typeof item === 'string') {
			ids.add(item);
		} else if (isRecord(item)) {
			const id = getFirstString(
				item,
				['id', 'member_id']
			);

			if (id) {
				ids.add(id);
			}
		}
	}

	for (const assignment of asArray(raw.assignments)) {
		if (!isRecord(assignment)) {
			continue;
		}

		const id = getFirstString(
			assignment,
			[
				'member_id',
				'memberId',
				'subject_id'
			]
		);

		if (id) {
			ids.add(id);
		}
	}

	return [...ids];
}

function normalizeFrontPeriods(
	document: OpenPluralDocument,
	validMemberIds: Set<string>,
	warnings: string[]
): FrontHistoryEntry[] {
	const result: FrontHistoryEntry[] = [];

	for (const raw of asArray(document.front_periods)) {
		if (!isRecord(raw)) {
			continue;
		}

		const startedAt = getFirstString(
			raw,
			[
				'started_at',
				'startedAt',
				'start'
			]
		);

		if (!startedAt) {
			warnings.push(
				'Skipped a fronting period without a start time.'
			);

			continue;
		}

		const endedAtValue =
			getFirstString(
				raw,
				[
					'ended_at',
					'endedAt',
					'end'
				]
			);

		const endedAt =
			endedAtValue || null;

		const note =
			getFirstString(
				raw,
				[
					'note',
					'comment',
					'front_note'
				]
			);

		const memberIds =
			extractMemberIds(raw)
				.filter((id) =>
					validMemberIds.has(id)
				);

		if (memberIds.length === 0) {
			warnings.push(
				`Skipped a fronting period at ${startedAt} because it did not reference a TECSPA member.`
			);

			continue;
		}

		const assignments = asArray(raw.assignments)
			.filter(isRecord);

		for (const memberId of memberIds) {
			const assignment =
				assignments.find(
					(item) =>
						getFirstString(item, [
							'member_id',
							'memberId',
							'subject_id'
						]) === memberId
				);

			const frontRole =
				assignment
					? getFirstString(
							assignment,
							[
								'front_role',
								'frontRole',
								'role'
							]
						)
					: '';

			const roleNote =
				frontRole &&
				frontRole !== 'primary'
					? `Front role: ${frontRole}`
					: '';

			const combinedNote =
				[note, roleNote]
					.filter(Boolean)
					.join(' — ');

			result.push({
				id:
					`${getRecordId(raw) || crypto.randomUUID()}-${memberId}`,
				memberId,
				startedAt,
				endedAt,
				note: combinedNote
			});
		}
	}

	/*
	 * Some OpenPlural producers also expose point-in-time
	 * front events. We only use them when front_periods
	 * did not exist, so the same interval is not imported twice.
	 */
	if (
		result.length === 0 &&
		asArray(document.front_events).length > 0
	) {
		const events = asArray(
			document.front_events
		)
			.filter(isRecord)
			.map((event) => ({
				event,
				at: getFirstString(
					event,
					[
						'at',
						'timestamp',
						'created_at'
					]
				),
				memberIds: extractMemberIds(event)
					.filter((id) =>
						validMemberIds.has(id)
					)
			}))
			.filter((item) => item.at)
			.sort(
				(a, b) =>
					new Date(a.at).getTime() -
					new Date(b.at).getTime()
			);

		for (let index = 0; index < events.length; index += 1) {
			const current = events[index];
			const next = events[index + 1];

			for (const memberId of current.memberIds) {
				result.push({
					id:
						`${getRecordId(current.event) || crypto.randomUUID()}-${memberId}`,
					memberId,
					startedAt: current.at,
					endedAt: next?.at ?? null,
					note: getFirstString(
						current.event,
						['note', 'comment']
					)
				});
			}
		}
	}

	return result;
}

function normalizeCustomFields(
	document: OpenPluralDocument,
	members: Member[],
	warnings: string[]
): PluralSpaceImportData['customFields'] {
	const result: PluralSpaceImportData['customFields'] = [];

	const memberIds =
		new Set(members.map((member) => member.id));

	for (const raw of asArray(
		document.custom_fields
	)) {
		if (!isRecord(raw)) {
			continue;
		}

		const fieldId =
			getRecordId(raw) ||
			crypto.randomUUID();

		const label =
			getFirstString(
				raw,
				['name', 'label'],
				'Custom Field'
			);

		const type =
			normalizeCustomFieldType(
				raw.field_type ??
					raw.type
			);

		const description =
			getFirstString(
				raw,
				['description', 'help_text']
			);

		const values =
			asArray(raw.values);

		/*
		 * PluralPort/OpenPlural normally stores values
		 * inside the field definition.
		 */
		for (const rawValue of values) {
			if (!isRecord(rawValue)) {
				continue;
			}

			const memberId =
				getFirstString(
					rawValue,
					[
						'member_id',
						'memberId',
						'subject_id'
					]
				);

			if (!memberId || !memberIds.has(memberId)) {
				continue;
			}

			let value =
				rawValue.value;

			if (
				typeof value === 'object' &&
				value !== null
			) {
				value = JSON.stringify(value);
			}

			result.push({
				id:
					`${fieldId}-${memberId}`,
				memberId,
				label,
				type,
				value:
					typeof value === 'string'
						? value
						: value == null
							? ''
							: String(value),
				description,
				sortOrder:
					asNumber(
						raw.order ??
							raw.sort_order,
						0
					)
			});
		}
	}

	/*
	 * A few producers place custom fields directly
	 * on each member rather than in the definition.
	 */
	for (const member of members) {
		const rawMember =
			asArray(document.members)
				.find((candidate) =>
					isRecord(candidate) &&
					getRecordId(candidate) === member.id
				);

		if (!isRecord(rawMember)) {
			continue;
		}

		for (const rawField of asArray(
			rawMember.custom_fields
		)) {
			if (!isRecord(rawField)) {
				continue;
			}

			const label =
				getFirstString(
					rawField,
					['label', 'name'],
					'Custom Field'
				);

			let value =
				rawField.value;

			if (
				typeof value === 'object' &&
				value !== null
			) {
				value = JSON.stringify(value);
			}

			result.push({
				id:
					`${getRecordId(rawField) || crypto.randomUUID()}-${member.id}`,
				memberId: member.id,
				label,
				type:
					normalizeCustomFieldType(
						rawField.type ??
							rawField.field_type
					),
				value:
					typeof value === 'string'
						? value
						: value == null
							? ''
							: String(value),
				description:
					getFirstString(
						rawField,
						['description']
					),
				sortOrder:
					asNumber(
						rawField.order ??
							rawField.sort_order,
						0
					)
			});
		}
	}

	/*
	 * Avoid importing duplicate member/field pairs
	 * when both representations are present.
	 */
	const unique = new Map<string, typeof result[number]>();

	for (const field of result) {
		const key =
			`${field.memberId}:${field.label}`;

		if (!unique.has(key)) {
			unique.set(key, field);
		}
	}

	return [...unique.values()];
}

function normalizeNotes(
	document: OpenPluralDocument,
	validMemberIds: Set<string>
): PluralSpaceImportData['journalEntries'] {
	const result: PluralSpaceImportData['journalEntries'] = [];

	for (const raw of asArray(document.notes)) {
		if (!isRecord(raw)) {
			continue;
		}

		const extensions =
			getExtensions(raw);

		const kind =
			getFirstString(
				extensions,
				['kind']
			);

		/*
		 * PluralSpace uses notes[] for both journal
		 * entries and ordinary notes. Only journal-like
		 * records should become TECSPA journal entries.
		 *
		 * If kind is absent, we keep the record rather
		 * than silently destroying user-written content.
		 */
		const isJournal =
			kind === '' ||
			kind === 'journal' ||
			kind === 'journal_entry';

		if (!isJournal) {
			continue;
		}

		const authorIds =
			asArray(
				raw.author_member_ids ??
					raw.authorMemberIds
			)
				.filter(
					(value): value is string =>
						typeof value === 'string'
				)
				.filter((id) =>
					validMemberIds.has(id)
				);

		const directAuthor =
			getFirstString(
				raw,
				[
					'author_member_id',
					'authorMemberId',
					'member_id'
				]
			);

		if (
			directAuthor &&
			validMemberIds.has(directAuthor) &&
			!authorIds.includes(directAuthor)
		) {
			authorIds.push(directAuthor);
		}

		const createdAt =
			getFirstString(
				raw,
				[
					'created_at',
					'createdAt'
				],
				new Date().toISOString()
			);

		const updatedAt =
			getFirstString(
				raw,
				[
					'updated_at',
					'updatedAt'
				],
				createdAt
			);

		result.push({
			id:
				getRecordId(raw) ||
				crypto.randomUUID(),

			title:
				getFirstString(
					raw,
					['title'],
					'Imported journal entry'
				),

			body:
				getFirstString(
					raw,
					['body', 'content', 'text']
				),

			authorMemberId:
				authorIds[0] ?? null,

			createdAt,
			updatedAt,

			isPinned:
				asBoolean(
					extensions.is_pinned ??
						raw.is_pinned,
					false
				)
		});
	}

	return result;
}

function validateDocument(
	document: OpenPluralDocument
): void {
	const version =
		asString(
			document.openplural_version
		);

	const pluralPortVersion =
		asString(
			document.pluralport_version
		);

	if (
		version !== '0.1' &&
		pluralPortVersion !== '0.1'
	) {
		throw new Error(
			'This does not look like a supported PluralSpace/OpenPlural v0.1 export.'
		);
	}

	const producer =
		isRecord(document.producer)
			? document.producer
			: null;

	const producerId =
		producer
			? asString(producer.app_id)
			: '';

	if (
		producerId &&
		producerId !== 'pluralspace'
	) {
		/*
		 * OpenPlural is a shared format, so do not reject
		 * other producers here. The importer is deliberately
		 * format-oriented rather than app-name-oriented.
		 */
	}
}

function parseDocument(
	document: OpenPluralDocument,
	sourceFormat: PluralSpaceSourceFormat,
	media: PluralSpaceMedia[] = []
): PluralSpaceImportData {
	validateDocument(document);

	const warnings: string[] = [];

	const systems =
		asArray(document.systems)
			.filter(isRecord);

	if (systems.length > 1) {
		warnings.push(
			`This export contains ${systems.length} systems. TECSPA currently imports the first system only.`
		);
	}

	const system =
		normalizeSystem(
			findSystem(document)
		);

	const currentFrontingIds =
		getCurrentFrontingMemberIds(document);

	const assetDataUrls =
		buildAssetDataUrls(
			document,
			media
		);

	const members =
		asArray(document.members)
			.map(
				(member, index) =>
					normalizeMember(
						member,
						index,
						currentFrontingIds,
						assetDataUrls,
						warnings
					)
			)
			.filter(
				(member): member is Member =>
					member !== null
			);

	const validMemberIds =
		new Set(
			members.map((member) => member.id)
		);

	const frontHistory =
		normalizeFrontPeriods(
			document,
			validMemberIds,
			warnings
		);

	const customFields =
		normalizeCustomFields(
			document,
			members,
			warnings
		);

	const journalEntries =
		normalizeNotes(
			document,
			validMemberIds
		);

	/*
	 * Attach normalized custom fields to each member
	 * because the TECSPA Member model carries the
	 * fields for the UI, while the importer result
	 * also exposes them separately for DB insertion.
	 */
	for (const member of members) {
		member.customFields =
			customFields.filter(
				(field) =>
					field.memberId === member.id
			);
	}

	if (document.groups) {
		warnings.push(
			'PluralSpace groups were found in the export. Group import will be added in the next importer step.'
		);
	}

	if (document.chat_messages || document.chat) {
		warnings.push(
			'PluralSpace chat data was found. TECSPA chat import will be added in the next importer step.'
		);
	}

	if (document.polls) {
		warnings.push(
			'PluralSpace poll data was found. TECSPA poll import will be added in the next importer step.'
		);
	}

	if (document.boards) {
		warnings.push(
			'PluralSpace board data was found. TECSPA does not currently have a matching board model.'
		);
	}

	return {
		system,
		members,
		frontHistory,
		customFields,
		journalEntries,
		media,
		warnings,
		sourceFormat,
		sourceVersion:
			asString(
				document.openplural_version
			) ||
			asString(
				document.pluralport_version
			)
	};
}

function parseJsonText(
	jsonText: string,
	sourceFormat: PluralSpaceSourceFormat,
	media: PluralSpaceMedia[] = []
): PluralSpaceImportData {
	let parsed: unknown;

	try {
		parsed = JSON.parse(jsonText);
	} catch {
		throw new Error(
			'The selected file is not valid JSON.'
		);
	}

	if (!isRecord(parsed)) {
		throw new Error(
			'The selected PluralSpace export is not a JSON object.'
		);
	}

	return parseDocument(
		parsed as OpenPluralDocument,
		sourceFormat,
		media
	);
}

function safeZipPath(
	path: string
): boolean {
	if (
		path.startsWith('/') ||
		path.startsWith('\\') ||
		path.includes('../') ||
		path.includes('..\\') ||
		/^[a-zA-Z]:/.test(path)
	) {
		return false;
	}

	return true;
}

function findOpenPluralJson(
	files: Record<string, Uint8Array>
): string {
	const candidates = Object.keys(files)
		.filter(safeZipPath)
		.filter(
			(path) =>
				path === 'openplural.json' ||
				path.endsWith('/openplural.json')
		);

	if (candidates.length === 0) {
		throw new Error(
			'The ZIP does not contain an openplural.json file.'
		);
	}

	return candidates[0];
}

function extractZipMedia(
	files: Record<string, Uint8Array>
): PluralSpaceMedia[] {
	const media: PluralSpaceMedia[] = [];

	for (const [path, data] of Object.entries(files)) {
		if (!safeZipPath(path)) {
			continue;
		}

		if (
			!path.startsWith('media/') &&
			!path.includes('/media/')
		) {
			continue;
		}

		if (data.byteLength === 0) {
			continue;
		}

		media.push({
			path,
			data,
			mimeType:
				getMediaMimeType(path)
		});
	}

	return media;
}

export function parsePluralSpaceJson(
	jsonText: string
): PluralSpaceImportData {
	return parseJsonText(
		jsonText,
		'openplural-json'
	);
}

export function parsePluralSpaceZip(
	data: Uint8Array
): PluralSpaceImportData {
	let files: Record<string, Uint8Array>;

	try {
		files = unzipSync(data);
	} catch {
		throw new Error(
			'The selected file is not a valid ZIP archive.'
		);
	}

	const jsonPath =
		findOpenPluralJson(files);

	const jsonBytes =
		files[jsonPath];

	if (!jsonBytes) {
		throw new Error(
			'The openplural.json file could not be read from the ZIP.'
		);
	}

	const jsonText =
		strFromU8(jsonBytes);

	const media =
		extractZipMedia(files);

	return parseJsonText(
		jsonText,
		'openplural-zip',
		media
	);
}

export function parsePluralSpaceExport(
	data: string | Uint8Array
): PluralSpaceImportData {
	if (typeof data === 'string') {
		return parsePluralSpaceJson(data);
	}

	const bytes =
		data.byteLength >= 2
			? data
			: new Uint8Array(data);

	/*
	 * ZIP files begin with PK.
	 * JSON exports begin with { or [ after whitespace.
	 */
	const firstByte =
		bytes[0];

	const secondByte =
		bytes[1];

	if (
		firstByte === 0x50 &&
		secondByte === 0x4b
	) {
		return parsePluralSpaceZip(bytes);
	}

	return parsePluralSpaceJson(
		new TextDecoder().decode(bytes)
	);
}