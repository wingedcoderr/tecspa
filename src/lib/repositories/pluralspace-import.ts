import type { Member } from '$lib/data/members';

import type { PluralSpaceImportData } from '$lib/importers/pluralspace';

import type { AmpersandImportResult } from '$lib/repositories/ampersand-import';



import { getDatabase } from '$lib/db/database';

async function storeMemberImage(
	memberId: string,
	kind: 'avatar' | 'banner',
	dataUri: string
): Promise<string> {
	const image = dataUriParts(dataUri);

	if (!image) {
		return '';
	}

	const mediaModule = await withImportTimeout(
		import('$lib/media/member-media'),
		'loading the member media module'
	);

	return withImportTimeout(
		mediaModule.storeEmbeddedMemberImage(
			memberId,
			kind,
			dataUri,
			image.mimeType
		),
		`storing ${kind} media`
	);
}

function dataUriParts(value: string): {

    mimeType: string;

    bytes: Uint8Array;

} | null {

    if (!value || !value.startsWith('data:')) {

        return null;

    }



    const commaIndex = value.indexOf(',');



    if (commaIndex === -1) {

        throw new Error('The embedded member image is malformed.');

    }



    const header = value.slice(5, commaIndex);

    const payload = value.slice(commaIndex + 1);

    const mimeType = header.split(';')[0]?.trim();



    if (!mimeType) {

        throw new Error('The embedded member image has no MIME type.');

    }



    if (header.includes(';base64')) {

        const binary = atob(payload);

        const bytes = new Uint8Array(binary.length);



        for (let index = 0; index < binary.length; index += 1) {

            bytes[index] = binary.charCodeAt(index);

        }



        return { mimeType, bytes };

    }



    return {

        mimeType,

        bytes: new TextEncoder().encode(decodeURIComponent(payload))

    };

}



function extensionForMimeType(mimeType: string): string {

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



function withImportTimeout<T>(
	promise: Promise<T>,
	stage: string,
	timeoutMs = 5000
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(
				new Error(
					`PluralSpace import timed out during ${stage}.`
				)
			);
		}, timeoutMs);

		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			}
		);
	});
}

function remapMember(

    member: Member,

    id: string

): Member {

    return {

        ...member,

        id,

        avatar: '',

        banner: '',

        customFields: []

    };

}



export async function importPluralSpaceData(
    importData: PluralSpaceImportData
): Promise<AmpersandImportResult> {
    if (!importData.members.length) {
        throw new Error('The PluralSpace export contains no members.');
    }

    const sourceIds = new Set<string>();

    for (const member of importData.members) {
        if (!member.id || sourceIds.has(member.id)) {
            throw new Error(
                'The PluralSpace export contains duplicate or missing member IDs.'
            );
        }

        sourceIds.add(member.id);
    }

    const memberIdMap = new Map<string, string>();

    for (const member of importData.members) {
        memberIdMap.set(member.id, crypto.randomUUID());
    }

    for (const entry of importData.frontHistory) {
        if (!sourceIds.has(entry.memberId)) {
            throw new Error(
                'The PluralSpace export contains front history for an unknown member.'
            );
        }
    }

    for (const field of importData.customFields) {
        if (!sourceIds.has(field.memberId)) {
            throw new Error(
                'The PluralSpace export contains a custom field for an unknown member.'
            );
        }
    }

    for (const entry of importData.journalEntries) {
        if (
            entry.authorMemberId &&
            !sourceIds.has(entry.authorMemberId)
        ) {
            throw new Error(
                'The PluralSpace export contains a journal entry for an unknown member.'
            );
        }
    }

    const createdMembers: Member[] = [];
    let imageCount = 0;
    let bannerCount = 0;

    /*
     * Store imported media before opening the SQLite transaction.
     *
     * Tauri's filesystem APIs are asynchronous and independent from the
     * SQLite connection. Keeping a SQLite transaction open while awaiting
     * filesystem commands can leave the desktop import waiting indefinitely.
     */
    try {
        for (let memberIndex = 0; memberIndex < importData.members.length; memberIndex += 1) {
	const sourceMember = importData.members[memberIndex];
            const id = memberIdMap.get(sourceMember.id);

            if (!id) {
                throw new Error('Failed to map an imported member ID.');
            }

            const member = remapMember(sourceMember, id);

            if (sourceMember.avatar?.startsWith('data:')) {
                member.avatar = await withImportTimeout(
	storeMemberImage(
                    		id,
		'avatar',
		sourceMember.avatar
	),
	`storing avatar for member ${memberIndex + 1}`
);

                if (member.avatar) {
                    imageCount += 1;
                }
            }

            if (sourceMember.banner?.startsWith('data:')) {
                member.banner = await withImportTimeout(
                    storeMemberImage(
                        id,
                        'banner',
                        sourceMember.banner
                    ),
                    `storing banner for member ${memberIndex + 1}`
                );

                if (member.banner) {
                    bannerCount += 1;
                }
            }

            createdMembers.push(member);
        }

       const db = await withImportTimeout(
	getDatabase(),
	'opening the SQLite database'
);
        await withImportTimeout(
	db.execute('BEGIN'),
	'starting the SQLite transaction'
);

        try {
            for (const member of createdMembers) {
                await withImportTimeout(
                    db.execute(
                        `
                        INSERT INTO members (
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
                            $12
                        )
                    `,
                    [
                        member.id,
                        member.name,
                        member.pronouns,
                        JSON.stringify(member.aliases),
                        member.role,
                        member.status,
                        member.about,
                        JSON.stringify(member.interests),
                        JSON.stringify(member.frontTriggers),
                        member.avatar,
                        member.banner,
                        member.isFronting ? 1 : 0
                    ]
                    ),
                    'inserting the first imported member'
                );
            }

            for (const field of importData.customFields) {
                const memberId = memberIdMap.get(field.memberId);

                if (!memberId) {
                    throw new Error('Failed to map a custom field member ID.');
                }

                await db.execute(
                    `
                        INSERT INTO custom_fields (
                            id,
                            member_id,
                            label,
                            type,
                            value,
                            description,
                            sort_order
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `,
                    [
                        crypto.randomUUID(),
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

                await db.execute(
                    `
                        INSERT INTO front_history (
                            id,
                            member_id,
                            started_at,
                            ended_at,
                            note
                        )
                        VALUES ($1, $2, $3, $4, $5)
                    `,
                    [
                        crypto.randomUUID(),
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

                await db.execute(
                    `
                        INSERT INTO journal_entries (
                            id,
                            author_member_id,
                            entry_type,
                            title,
                            body,
                            tags,
                            is_pinned,
                            created_at,
                            updated_at
                        )
                        VALUES ($1, $2, 'journal', $3, $4, '[]', $5, $6, $7)
                    `,
                    [
                        crypto.randomUUID(),
                        authorMemberId,
                        entry.title,
                        entry.body,
                        entry.isPinned ? 1 : 0,
                        entry.createdAt,
                        entry.updatedAt
                    ]
                );
            }

            await withImportTimeout(
                db.execute('COMMIT'),
                'committing the SQLite transaction'
            );
        } catch (error) {
            try {
                await db.execute('ROLLBACK');
            } catch {
                // Preserve the original import error.
            }

            throw error;
        }
    } catch (error) {
        for (const member of createdMembers) {
            try {
                const { deleteMemberMedia } = await import(
                    '$lib/media/member-media'
                );

                await deleteMemberMedia(member);
            } catch {
                // Keep the original import error.
            }
        }

        throw error;
    }

    return {
        memberCount: importData.members.length,
        frontHistoryCount: importData.frontHistory.length,
        imageCount,
        bannerCount
    };
}
