import type { Member } from '$lib/data/members';
import type { FrontHistoryEntry } from '$lib/data/activity';
import type {
	ChatMessage,
	JournalEntry,
	Poll,
	PollResults
} from '$lib/data/activity';

import type { AmpersandImportData } from '$lib/importers/ampersand';
import type { AmpersandImportResult } from '$lib/repositories/ampersand-import';

export interface DataAdapter {
	getMembers(): Promise<Member[]>;

	getMemberById(id: string): Promise<Member | null>;

	deleteMember(id: string): Promise<void>;

	updateMember(
		id: string,
		member: Member
	): Promise<Member>;

	setMemberFronting(
		memberId: string,
		isFronting: boolean
	): Promise<void>;

	importAmpersandData(
		importData: AmpersandImportData
	): Promise<AmpersandImportResult>;

	getFrontHistory(): Promise<FrontHistoryEntry[]>;

	getFrontHistoryForMember(
		memberId: string
	): Promise<FrontHistoryEntry[]>;

	getCurrentFronting(): Promise<FrontHistoryEntry[]>;

	updateFrontHistoryNote(
		id: string,
		note: string
	): Promise<void>;

	deleteFrontHistoryEntry(
		id: string
	): Promise<void>;

	getChatMessages(): Promise<ChatMessage[]>;

	createChatMessage(
		senderMemberId: string,
		message: string
	): Promise<ChatMessage>;

	updateChatMessage(
		id: string,
		message: string
	): Promise<ChatMessage>;

	deleteChatMessage(
		id: string
	): Promise<void>;

	getJournalEntries(): Promise<JournalEntry[]>;

	getJournalEntryById(
		id: string
	): Promise<JournalEntry | null>;

	createJournalEntry(
		entry: Omit<
			JournalEntry,
			'id' | 'createdAt' | 'updatedAt'
		>
	): Promise<JournalEntry>;

	updateJournalEntry(
		id: string,
		entry: Omit<
			JournalEntry,
			'id' | 'createdAt' | 'updatedAt'
		>
	): Promise<JournalEntry>;

	setJournalEntryPinned(
		id: string,
		isPinned: boolean
	): Promise<JournalEntry>;

	deleteJournalEntry(
		id: string
	): Promise<void>;

	getPolls(): Promise<Poll[]>;

	getPollResults(
		pollId: string
	): Promise<PollResults | null>;
}