import type { Member } from '$lib/data/members';
import type {
	ChatMessage,
	JournalEntry,
	Poll,
	PollResults,
	FrontHistoryEntry
} from '$lib/data/activity';

import type { DataAdapter } from '$lib/db/adapter';
import type { AmpersandImportData } from '$lib/importers/ampersand';
import type { AmpersandImportResult } from '$lib/repositories/ampersand-import';

function webMediaUrl(
	memberId: string,
	kind: 'avatar' | 'banner'
): string {
	return new URL(
		`/api/media/members/${encodeURIComponent(memberId)}/${kind}`,
		window.location.origin
	).toString();
}

function withWebMediaUrls(member: Member): Member {
	return {
		...member,
		avatar: member.avatar
			? webMediaUrl(member.id, 'avatar')
			: '',
		banner: member.banner
			? webMediaUrl(member.id, 'banner')
			: ''
	};
}

export class WebDataAdapter implements DataAdapter {
	async getMembers(): Promise<Member[]> {
		const response = await fetch('/api/members');

		if (!response.ok) {
			throw new Error(
				`Failed to load members: ${response.status} ${response.statusText}`
			);
		}

		const members = (await response.json()) as Member[];

		return members.map(withWebMediaUrls);
	}

	async getMemberById(id: string): Promise<Member | null> {
		const response = await fetch(
			`/api/members/${encodeURIComponent(id)}`
		);

		if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			throw new Error(
				`Failed to load member: ${response.status} ${response.statusText}`
			);
		}

		const member = (await response.json()) as Member;

		return withWebMediaUrls(member);
	}

async deleteMember(id: string): Promise<void> {
	const response = await fetch(
		`/api/members/${encodeURIComponent(id)}`,
		{
			method: 'DELETE'
		}
	);

	if (!response.ok) {
		const data =
			await response.json().catch(() => null);

		throw new Error(
			data?.error ??
				`Failed to delete member: ${response.status} ${response.statusText}`
		);
	}
}

async updateMember(
	id: string,
	member: Member
): Promise<Member> {
	const response = await fetch(
		`/api/members/${encodeURIComponent(id)}`,
		{
			method: 'PATCH',
			headers: {
				'Content-Type':
					'application/json'
			},
			body: JSON.stringify(member)
		}
	);

	const data =
		await response.json().catch(() => null);

	if (!response.ok) {
		throw new Error(
			data?.error ??
				`Failed to update member: ${response.status} ${response.statusText}`
		);
	}

	return data.member ?? member;
}


	async importAmpersandData(
		importData: AmpersandImportData
	): Promise<AmpersandImportResult> {
		const response = await fetch('/api/import', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(importData)
		});

		if (!response.ok) {
			const data =
				await response.json().catch(() => null);

			throw new Error(
				data?.error ??
					`Failed to import system (${response.status}).`
			);
		}

		const data = await response.json();

		return data.result;
	}	

	async setMemberFronting(
		memberId: string,
		isFronting: boolean
	): Promise<void> {
		const response = await fetch(
			`/api/members/${encodeURIComponent(memberId)}/fronting`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					isFronting
				})
			}
		);

		if (!response.ok) {
			throw new Error(
				`Failed to update fronting status: ${response.status} ${response.statusText}`
			);
		}
	}

	async getFrontHistory(): Promise<FrontHistoryEntry[]> {
		const response = await fetch('/api/front-history');

		if (!response.ok) {
			throw new Error(
				`Failed to load front history: ${response.status} ${response.statusText}`
			);
		}

		return (await response.json()) as FrontHistoryEntry[];
	}

	async getFrontHistoryForMember(
		memberId: string
	): Promise<FrontHistoryEntry[]> {
		const response = await fetch(
			`/api/front-history/${encodeURIComponent(memberId)}`
		);

		if (!response.ok) {
			throw new Error(
				`Failed to load member front history: ${response.status} ${response.statusText}`
			);
		}

		return (await response.json()) as FrontHistoryEntry[];
	}

	async getCurrentFronting(): Promise<FrontHistoryEntry[]> {
		const response = await fetch('/api/front-history/current');

		if (!response.ok) {
			throw new Error(
				`Failed to load current fronting: ${response.status} ${response.statusText}`
			);
		}

		return (await response.json()) as FrontHistoryEntry[];
	}

	async updateFrontHistoryNote(
		id: string,
		note: string
	): Promise<void> {
		const response = await fetch(
			`/api/front-history/${encodeURIComponent(id)}`,
			{
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					note
				})
			}
		);

		if (!response.ok) {
			throw new Error(
				`Failed to update front history note: ${response.status} ${response.statusText}`
			);
		}
	}

	async deleteFrontHistoryEntry(id: string): Promise<void> {
		const response = await fetch(
			`/api/front-history/${encodeURIComponent(id)}`,
			{
				method: 'DELETE'
			}
		);

		if (!response.ok) {
			throw new Error(
				`Failed to delete front history entry: ${response.status} ${response.statusText}`
			);
		}
	}

	async getChatMessages(): Promise<ChatMessage[]> {
	const response = await fetch('/api/chat');

	if (!response.ok) {
		throw new Error(
			`Failed to load chat messages (${response.status}).`
		);
	}

	const data = await response.json();

	return data.messages;
}

async createChatMessage(
	senderMemberId: string,
	message: string
): Promise<ChatMessage> {
	const response = await fetch('/api/chat', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			senderMemberId,
			message
		})
	});

	if (!response.ok) {
		const data = await response.json().catch(() => null);

		throw new Error(
			data?.error ??
				`Failed to create chat message (${response.status}).`
		);
	}

	const data = await response.json();

	return data.message;
}

async updateChatMessage(
	id: string,
	message: string
): Promise<ChatMessage> {
	const response = await fetch(
		`/api/chat/${encodeURIComponent(id)}`,
		{
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				message
			})
		}
	);

	if (!response.ok) {
		const data = await response.json().catch(() => null);

		throw new Error(
			data?.error ??
				`Failed to update chat message (${response.status}).`
		);
	}

	const data = await response.json();

	return data.message;
}

async deleteChatMessage(
	id: string
): Promise<void> {
	const response = await fetch(
		`/api/chat/${encodeURIComponent(id)}`,
		{
			method: 'DELETE'
		}
	);

	if (!response.ok) {
		const data = await response.json().catch(() => null);

		throw new Error(
			data?.error ??
				`Failed to delete chat message (${response.status}).`
		);
	}
}

	async getJournalEntries(): Promise<JournalEntry[]> {
		const response = await fetch('/api/journal');

		if (!response.ok) {
			throw new Error(
				`Failed to load journal entries: ${response.status} ${response.statusText}`
			);
		}

		return (await response.json()) as JournalEntry[];
	}

	async getJournalEntryById(
		id: string
	): Promise<JournalEntry | null> {
		const response = await fetch(
			`/api/journal/${encodeURIComponent(id)}`
		);

		if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			throw new Error(
				`Failed to load journal entry: ${response.status} ${response.statusText}`
			);
		}

		return (await response.json()) as JournalEntry;
	}

	async createJournalEntry(
		entry: Omit<
			JournalEntry,
			'id' | 'createdAt' | 'updatedAt'
		>
	): Promise<JournalEntry> {
		const response = await fetch('/api/journal', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(entry)
		});

		if (!response.ok) {
			throw new Error(
				`Failed to create journal entry: ${response.status} ${response.statusText}`
			);
		}

		return (await response.json()) as JournalEntry;
	}

	async updateJournalEntry(
		id: string,
		entry: Omit<
			JournalEntry,
			'id' | 'createdAt' | 'updatedAt'
		>
	): Promise<JournalEntry> {
		const response = await fetch(
			`/api/journal/${encodeURIComponent(id)}`,
			{
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(entry)
			}
		);

		if (!response.ok) {
			throw new Error(
				`Failed to update journal entry: ${response.status} ${response.statusText}`
			);
		}

		return (await response.json()) as JournalEntry;
	}

	async setJournalEntryPinned(
		id: string,
		isPinned: boolean
	): Promise<JournalEntry> {
		const response = await fetch(
			`/api/journal/${encodeURIComponent(id)}/pin`,
			{
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					isPinned
				})
			}
		);

		if (!response.ok) {
			throw new Error(
				`Failed to update journal pin status: ${response.status} ${response.statusText}`
			);
		}

		return (await response.json()) as JournalEntry;
	}

	async deleteJournalEntry(id: string): Promise<void> {
		const response = await fetch(
			`/api/journal/${encodeURIComponent(id)}`,
			{
				method: 'DELETE'
			}
		);

		if (!response.ok) {
			throw new Error(
				`Failed to delete journal entry: ${response.status} ${response.statusText}`
			);
		}
	}

	async getPolls(): Promise<Poll[]> {
		throw new Error('Web polls API is not available yet.');
	}

	async getPollResults(
		pollId: string
	): Promise<PollResults | null> {
		void pollId;

		throw new Error('Web poll API is not available yet.');
	}
}