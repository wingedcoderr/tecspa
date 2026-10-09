import type {
	CustomField,
	Member
} from '$lib/data/members';

/*
 * =========================================================
 * AMPERSAND SOURCE TYPES
 * =========================================================
 *
 * These types describe only the parts of the Ampersand
 * export that we currently need.
 *
 * TECSPA's own data model remains canonical.
 */

type AmpersandMember = {
	id?: string;
	uuid?: string;
	name?: string;
	pronouns?: string;
	role?: string;
	description?: string;
	isArchived?: boolean;
	isCustomFront?: boolean;
	isPinned?: boolean;
	tags?: string[];
	system?: string;
	image?: string;
	cover?: string;
	customFields?: Record<string, string>;
	[key: string]: unknown;
};

type AmpersandSystem = {
	uuid?: string;
	name?: string;
	description?: string;
	image?: string;
	[key: string]: unknown;
};

type AmpersandFrontingEntry = {
	uuid?: string;
	member?: string;
	startTime?: string;
	endTime?: string | null;
	isMainFronter?: boolean;
	isLocked?: boolean;
	[key: string]: unknown;
};

type AmpersandCustomFieldDefinition = {
	uuid?: string;
	name?: string;
	priority?: number;
	default?: boolean;
	[key: string]: unknown;
};

type AmpersandDatabase = {
	systems?: AmpersandSystem[];
	members?: AmpersandMember[];
	frontingEntries?: AmpersandFrontingEntry[];
	customFields?: AmpersandCustomFieldDefinition[];
	[key: string]: unknown;
};

type AmpersandExport = {
	revision?: unknown;
	config?: unknown;
	database?: AmpersandDatabase;
	[key: string]: unknown;
};

/*
 * =========================================================
 * NORMALIZED IMPORT TYPES
 * =========================================================
 */

export type AmpersandImportImage = {
	dataUri: string;
	mimeType: string;
};

export type AmpersandImportSystem = {
	sourceId: string;
	name: string;
	description: string;
	image: AmpersandImportImage | null;
};

export type AmpersandImportMember = {
	member: Member;

	/*
	 * Original Ampersand ID.
	 *
	 * We need this temporarily so fronting entries can be
	 * connected to the correct TECSPA member.
	 */
	sourceId: string;

	/*
	 * Information that exists in Ampersand but currently has
	 * no direct TECSPA field.
	 */
	unmapped: {
		tags: string[];
		isPinned: boolean;
		isCustomFront: boolean;
		color: string;
		dateCreated: string;
		imageClip: string;
	};
};

export type AmpersandImportFrontHistory = {
	id: string;
	sourceId: string;
	memberId: string;
	startedAt: string;
	endedAt: string | null;
	note: string;
};

export type AmpersandImportCustomFieldDefinition = {
	sourceId: string;
	label: string;
	sortOrder: number;
};

export type AmpersandImportData = {
	system: AmpersandImportSystem;

	members: AmpersandImportMember[];

	frontHistory: AmpersandImportFrontHistory[];

	customFieldDefinitions:
		AmpersandImportCustomFieldDefinition[];

	warnings: string[];

	summary: {
		memberCount: number;
		frontHistoryCount: number;
		customFieldCount: number;
		memberImages: number;
		memberBanners: number;
		systemImage: boolean;
	};
};

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function isObject(
	value: unknown
): value is Record<string, unknown> {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value)
	);
}

function stringValue(
	value: unknown,
	fallback = ''
): string {
	return typeof value === 'string'
		? value
		: fallback;
}

function booleanValue(
	value: unknown,
	fallback = false
): boolean {
	return typeof value === 'boolean'
		? value
		: fallback;
}

function numberValue(
	value: unknown,
	fallback = 0
): number {
	return typeof value === 'number' &&
		Number.isFinite(value)
		? value
		: fallback;
}

function parseEmbeddedImage(
	value: unknown
): AmpersandImportImage | null {
	if (
		typeof value !== 'string' ||
		!value.startsWith('data:')
	) {
		return null;
	}

	const commaIndex = value.indexOf(',');

	if (commaIndex === -1) {
		return null;
	}

	const header = value.slice(5, commaIndex);
	const mimeType =
		header.split(';')[0]?.trim() || '';

	if (!mimeType) {
		return null;
	}

	return {
		dataUri: value,
		mimeType
	};
}

function createCustomField(
	memberId: string,
	sourceId: string,
	label: string,
	value: string,
	sortOrder: number
): CustomField {
	return {
		id: crypto.randomUUID(),
		memberId,
		label,
		type: 'text',
		value,
		description: `Imported from Ampersand custom field ${sourceId}.`,
		sortOrder
	};
}

function createUniqueId(): string {
	return crypto.randomUUID();
}

/*
 * =========================================================
 * VALIDATION
 * =========================================================
 */

export function validateAmpersandExport(
	input: unknown
): string[] {
	const errors: string[] = [];

	if (!isObject(input)) {
		errors.push(
			'The selected file does not contain a JSON object.'
		);

		return errors;
	}

	if (!isObject(input.database)) {
		errors.push(
			'The selected JSON does not contain an Ampersand database object.'
		);

		return errors;
	}

	const database =
		input.database as Record<string, unknown>;

	if (!Array.isArray(database.members)) {
		errors.push(
			'The Ampersand export does not contain a members collection.'
		);
	}

	if (!Array.isArray(database.frontingEntries)) {
		errors.push(
			'The Ampersand export does not contain a frontingEntries collection.'
		);
	}

	if (!Array.isArray(database.customFields)) {
		errors.push(
			'The Ampersand export does not contain a customFields collection.'
		);
	}

	if (!Array.isArray(database.systems)) {
		errors.push(
			'The Ampersand export does not contain a systems collection.'
		);
	}

	return errors;
}

/*
 * =========================================================
 * PARSER
 * =========================================================
 */

export function parseAmpersandExport(
	input: string | unknown
): AmpersandImportData {
	let parsed: unknown;

	if (typeof input === 'string') {
		try {
			parsed = JSON.parse(input);
		} catch {
			throw new Error(
				'The selected file is not valid JSON.'
			);
		}
	} else {
		parsed = input;
	}

	const validationErrors =
		validateAmpersandExport(parsed);

	if (validationErrors.length > 0) {
		throw new Error(
			validationErrors.join('\n')
		);
	}

	const exportData =
		parsed as AmpersandExport;

	const database =
		exportData.database!;

	const sourceSystems =
		database.systems ?? [];

	const sourceMembers =
		database.members ?? [];

	const sourceFrontHistory =
		database.frontingEntries ?? [];

	const sourceCustomFields =
		database.customFields ?? [];

	const warnings: string[] = [];

	/*
	 * =======================================================
	 * SYSTEM
	 * =======================================================
	 */

	const sourceSystem =
		sourceSystems[0];

	if (!sourceSystem) {
		throw new Error(
			'The Ampersand export does not contain a system.'
		);
	}

	const systemSourceId =
		stringValue(
			sourceSystem.uuid,
			''
		);

	if (!systemSourceId) {
		warnings.push(
			'The exported system does not have a UUID.'
		);
	}

	const systemImage =
		parseEmbeddedImage(
			sourceSystem.image
		);

	const system: AmpersandImportSystem = {
		sourceId:
			systemSourceId || createUniqueId(),
		name:
			stringValue(
				sourceSystem.name,
				'Imported System'
			),
		description:
			stringValue(
				sourceSystem.description
			),
		image: systemImage
	};

	/*
	 * TECSPA does not currently have a system-level image
	 * field, so the image is preserved in the normalized
	 * import data but will not be attached to a member.
	 */

	if (systemImage) {
		warnings.push(
			'The Ampersand system has an embedded image. TECSPA does not currently have a system-level image field, so it will be preserved for the importer without being attached to a member.'
		);
	}

	/*
	 * =======================================================
	 * CUSTOM FIELD DEFINITIONS
	 * =======================================================
	 */

	const customFieldDefinitions =
		sourceCustomFields.map(
			(sourceField, index) => ({
				sourceId:
					stringValue(
						sourceField.uuid,
						createUniqueId()
					),
				label:
					stringValue(
						sourceField.name,
						`Imported Field ${index + 1}`
					),
				sortOrder:
					numberValue(
						sourceField.priority,
						index
					)
			})
		);

	/*
	 * Ampersand's exported custom field definitions do not
	 * provide one of TECSPA's current field types.
	 *
	 * Therefore imported values are initially stored as
	 * plain text rather than guessing whether they should
	 * be numbers, dates, checkboxes, etc.
	 */

	if (customFieldDefinitions.length > 0) {
		warnings.push(
			'Ampersand custom field types do not map directly to TECSPA field types in this export. Imported custom field values will initially use the text type.'
		);
	}

	const customFieldDefinitionMap =
		new Map(
			customFieldDefinitions.map(
				(field) => [
					field.sourceId,
					field
				]
			)
		);

	/*
	 * =======================================================
	 * MEMBERS
	 * =======================================================
	 */

	const sourceIdToTecspaId =
		new Map<string, string>();

	/*
	 * First pass: generate TECSPA IDs.
	 *
	 * This allows front-history entries to reference
	 * members regardless of their order in the export.
	 */

	for (const sourceMember of sourceMembers) {
		const sourceId =
			stringValue(
				sourceMember.uuid ??
					sourceMember.id
			);

		if (!sourceId) {
			continue;
		}

		sourceIdToTecspaId.set(
			sourceId,
			createUniqueId()
		);
	}

	/*
	 * Find currently-open fronting entries before building
	 * members, so isFronting can be restored correctly.
	 */

	const currentlyFronting =
		new Set<string>();

	for (const entry of sourceFrontHistory) {
		const memberSourceId =
			stringValue(entry.member);

		if (
			memberSourceId &&
			(entry.endTime === null ||
				entry.endTime === undefined)
		) {
			currentlyFronting.add(
				memberSourceId
			);
		}
	}

	const members: AmpersandImportMember[] =
		[];

	for (let index = 0;
		index < sourceMembers.length;
		index += 1
	) {
		const sourceMember =
			sourceMembers[index];

		const sourceId =
			stringValue(
				sourceMember.uuid ??
					sourceMember.id
			);

		if (!sourceId) {
			warnings.push(
				`Member ${index + 1} does not have an Ampersand ID and cannot be linked to front history.`
			);

			continue;
		}

		const memberId =
			sourceIdToTecspaId.get(
				sourceId
			) ?? createUniqueId();

		const avatar =
			parseEmbeddedImage(
				sourceMember.image
			);

		const banner =
			parseEmbeddedImage(
				sourceMember.cover
			);

		/*
		 * Convert Ampersand custom field values.
		 */

		const memberCustomFields:
			CustomField[] = [];

		const sourceMemberCustomFields =
			isObject(
				sourceMember.customFields
			)
				? sourceMember.customFields
				: {};

		for (
			const [
				fieldSourceId,
				fieldValue
			] of Object.entries(
				sourceMemberCustomFields
			)
		) {
			const definition =
				customFieldDefinitionMap.get(
					fieldSourceId
				);

			const label =
				definition?.label ??
				`Imported Field ${fieldSourceId}`;

			const sortOrder =
				definition?.sortOrder ??
				memberCustomFields.length;

			memberCustomFields.push(
				createCustomField(
					memberId,
					fieldSourceId,
					label,
					stringValue(
						fieldValue
					),
					sortOrder
				)
			);

			if (!definition) {
				warnings.push(
					`Member "${stringValue(sourceMember.name, 'Unnamed member')}" references an Ampersand custom field definition that was not found in the export.`
				);
			}
		}

		memberCustomFields.sort(
			(a, b) =>
				a.sortOrder - b.sortOrder
		);

		const member: Member = {
			id: memberId,

			name:
				stringValue(
					sourceMember.name,
					'Unnamed Member'
				),

			pronouns:
				stringValue(
					sourceMember.pronouns
				),

			/*
			 * Ampersand has no direct TECSPA aliases field
			 * in the exported member structure.
			 */
			aliases: [],

			role:
				stringValue(
					sourceMember.role,
					'member'
				),

			status:
				booleanValue(
					sourceMember.isArchived
				)
					? 'archived'
					: 'active',

			/*
			 * Ampersand calls this field description.
			 * TECSPA calls the equivalent field about.
			 */
			about:
				stringValue(
					sourceMember.description
				),

			/*
			 * Ampersand tags are not treated as interests.
			 * There is no direct equivalent in the current
			 * TECSPA member model.
			 */
			interests: [],

			frontTriggers: [],

			avatar:
				avatar?.dataUri ?? '',

			banner:
				banner?.dataUri ?? '',

			isFronting:
				currentlyFronting.has(
					sourceId
				),

			customFields:
				memberCustomFields
		};

		members.push({
			member,
			sourceId,

			unmapped: {
				tags:
					Array.isArray(
						sourceMember.tags
					)
						? sourceMember.tags.filter(
								(tag): tag is string =>
									typeof tag === 'string'
							)
						: [],

				isPinned:
					booleanValue(
						sourceMember.isPinned
					),

				isCustomFront:
					booleanValue(
						sourceMember.isCustomFront
					),

				color:
					stringValue(
						sourceMember.color
					),

				dateCreated:
					stringValue(
						sourceMember.dateCreated
					),

				imageClip:
					stringValue(
						sourceMember.imageClip
					)
			}
		});
	}

	/*
	 * =======================================================
	 * FRONT HISTORY
	 * =======================================================
	 */

	const frontHistory:
		AmpersandImportFrontHistory[] =
		[];

	for (
		let index = 0;
		index < sourceFrontHistory.length;
		index += 1
	) {
		const sourceEntry =
			sourceFrontHistory[index];

		const sourceEntryId =
			stringValue(
				sourceEntry.uuid,
				''
			);

		const sourceMemberId =
			stringValue(
				sourceEntry.member
			);

		const memberId =
			sourceIdToTecspaId.get(
				sourceMemberId
			);

		const startedAt =
			stringValue(
				sourceEntry.startTime
			);

		const endedAt =
			sourceEntry.endTime === null ||
			sourceEntry.endTime === undefined
				? null
				: stringValue(
						sourceEntry.endTime
					);

		if (!memberId) {
			warnings.push(
				`Fronting entry ${sourceEntryId || index + 1} references a member that was not found in the export.`
			);

			continue;
		}

		if (!startedAt) {
			warnings.push(
				`Fronting entry ${sourceEntryId || index + 1} does not have a start time and was skipped.`
			);

			continue;
		}

		frontHistory.push({
			id: createUniqueId(),

			sourceId:
				sourceEntryId ||
				createUniqueId(),

			memberId,

			startedAt,

			endedAt,

			note: ''
		});
	}

	/*
	 * =======================================================
	 * UNMAPPED DATA WARNINGS
	 * =======================================================
	 */

	const membersWithTags =
		members.filter(
			(item) =>
				item.unmapped.tags.length > 0
		).length;

	const pinnedMembers =
		members.filter(
			(item) =>
				item.unmapped.isPinned
		).length;

	const customFrontMembers =
		members.filter(
			(item) =>
				item.unmapped.isCustomFront
		).length;

	const membersWithColors =
		members.filter(
			(item) =>
				Boolean(item.unmapped.color)
		).length;

	const membersWithCreatedDates =
		members.filter(
			(item) =>
				Boolean(
					item.unmapped.dateCreated
				)
		).length;

	const membersWithImageClips =
		members.filter(
			(item) =>
				Boolean(
					item.unmapped.imageClip
				)
		).length;

	if (membersWithTags > 0) {
		warnings.push(
			`${membersWithTags} member(s) contain Ampersand tags. TECSPA currently has no equivalent member tag system, so those tags will not be imported as interests.`
		);
	}

	if (pinnedMembers > 0) {
		warnings.push(
			`${pinnedMembers} member(s) are marked as pinned in Ampersand. TECSPA currently has no equivalent pinned-member property.`
		);
	}

	if (customFrontMembers > 0) {
		warnings.push(
			`${customFrontMembers} member(s) are marked as custom fronts in Ampersand. TECSPA currently has no equivalent custom-front property.`
		);
	}

	if (membersWithColors > 0) {
		warnings.push(
			`${membersWithColors} member(s) have custom colors in Ampersand. TECSPA currently has no member color property.`
		);
	}

	if (membersWithCreatedDates > 0) {
		warnings.push(
			`${membersWithCreatedDates} member(s) have creation dates in Ampersand. TECSPA currently has no member creation-date property.`
		);
	}

	if (membersWithImageClips > 0) {
		warnings.push(
			`${membersWithImageClips} member(s) have Ampersand image clip settings. TECSPA currently has no equivalent image-clip property.`
		);
	}

	if (
		sourceMembers.some(
			(member) =>
				typeof member.image ===
					'string' &&
				member.image &&
				!member.image.startsWith(
					'data:'
				)
		)
	) {
		warnings.push(
			'At least one Ampersand member image is not an embedded data URI and could not be prepared as local media.'
		);
	}

	if (
		sourceMembers.some(
			(member) =>
				typeof member.cover ===
					'string' &&
				member.cover &&
				!member.cover.startsWith(
					'data:'
				)
		)
	) {
		warnings.push(
			'At least one Ampersand member cover is not an embedded data URI and could not be prepared as local media.'
		);
	}

	/*
	 * Remote Markdown images inside descriptions are left
	 * untouched. We do not download them automatically.
	 */

	if (
		members.some(
			(item) =>
				/!\[[^\]]*\]\(https?:\/\/[^)]+\)/.test(
					item.member.about
				)
		)
	) {
		warnings.push(
			'Some member descriptions contain remote Markdown images. Their original Markdown will be preserved; the remote images will not be downloaded automatically.'
		);
	}

	if (
		/!\[[^\]]*\]\(https?:\/\/[^)]+\)/.test(
			system.description
		)
	) {
		warnings.push(
			'The system description contains remote Markdown images. The original Markdown will be preserved; the remote images will not be downloaded automatically.'
		);
	}

	/*
	 * =======================================================
	 * RESULT
	 * =======================================================
	 */

	return {
		system,

		members,

		frontHistory,

		customFieldDefinitions,

		warnings,

		summary: {
			memberCount:
				members.length,

			frontHistoryCount:
				frontHistory.length,

			customFieldCount:
				customFieldDefinitions.length,

			memberImages:
				members.filter(
					(item) =>
						Boolean(
							item.member.avatar
						)
				).length,

			memberBanners:
				members.filter(
					(item) =>
						Boolean(
							item.member.banner
						)
				).length,

			systemImage:
				Boolean(system.image)
		}
	};
}