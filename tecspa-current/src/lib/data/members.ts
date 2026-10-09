export type CustomFieldType =
	| 'text'
	| 'long-text'
	| 'number'
	| 'checkbox'
	| 'date'
	| 'tags';

export type CustomField = {
	id: string;
	memberId: string;
	label: string;
	type: CustomFieldType;
	value: string;
	description: string;
	sortOrder: number;
};

export type Member = {
	id: string;
	name: string;
	pronouns: string;
	aliases: string[];
	role: string;
	status: string;
	about: string;
	interests: string[];
	frontTriggers: string[];
	avatar: string;
	banner: string;
	isFronting: boolean;
	customFields: CustomField[];
	/** Optional organization folder. Stored with the encrypted member record. */
	folder?: string;
};

export const members: Member[] = [
	{
		id: 'first-member',
		name: 'Your First Member',
		pronouns: 'they / them',
		aliases: ['First Member', 'Example'],
		role: 'member',
		status: 'active',
		about:
			'This is where a member can introduce themselves. Eventually, this entire profile will be customizable.',
		interests: ['art', 'music', 'writing', 'vampires'],
		frontTriggers: [
			'music',
			'certain memories',
			'specific environments'
		],
		avatar: '',
		banner: '',
		isFronting: false,
		customFields: []
	},
	{
		id: 'another-member',
		name: 'Another Member',
		pronouns: 'she / her',
		aliases: ['Another'],
		role: 'member',
		status: 'active',
		about:
			'Another member of the system. Their profile will eventually be completely customizable.',
		interests: ['reading', 'fashion', 'flowers'],
		frontTriggers: ['certain songs', 'specific places'],
		avatar: '',
		banner: '',
		isFronting: false,
		customFields: []
	},
	{
		id: 'third-member',
		name: 'A Third Member',
		pronouns: 'he / they',
		aliases: ['Third'],
		role: 'member',
		status: 'active',
		about:
			'A third example member for testing the TECSPA member directory.',
		interests: ['games', 'technology', 'drawing'],
		frontTriggers: [
			'music',
			'conversations',
			'specific environments'
		],
		avatar: '',
		banner: '',
		isFronting: false,
		customFields: []
	}
];

export function addMember(member: Member) {
	members.push(member);
}

export function updateMember(
	id: string,
	updatedMember: Member
) {
	const index = members.findIndex(
		(member) => member.id === id
	);

	if (index === -1) {
		return false;
	}

	members[index] = updatedMember;

	return true;
}