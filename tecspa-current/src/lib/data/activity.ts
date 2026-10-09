/*
 * =========================================================
 * CHAT
 * =========================================================
 */

export interface ChatMessage {
	id: string;
	senderMemberId: string;
	message: string;
	createdAt: string;
	editedAt: string | null;
}

/*
 * =========================================================
 * JOURNAL / NOTES
 * =========================================================
 */

export type JournalEntryType = 'journal' | 'note';

export interface JournalEntry {
	id: string;
	authorMemberId: string | null;
	entryType: JournalEntryType;
	title: string;
	body: string;
	tags: string[];
	isPinned: boolean;
	createdAt: string;
	updatedAt: string;
}

/*
 * =========================================================
 * FRONT HISTORY
 * =========================================================
 */

export type FrontHistoryEntry = {
	id: string;
	memberId: string;
	startedAt: string;
	endedAt: string | null;
	note: string;
};

/*
 * =========================================================
 * POLLS
 * =========================================================
 */

export interface PollOption {
	id: string;
	pollId: string;
	label: string;
	sortOrder: number;
}

export interface PollVote {
	id: string;
	pollId: string;
	optionId: string;
	memberId: string;
	createdAt: string;
}

export interface Poll {
	id: string;
	creatorMemberId: string;
	question: string;
	allowMultiple: boolean;
	createdAt: string;
	closedAt: string | null;
	options: PollOption[];
}

/*
 * A convenient shape for displaying a poll with
 * calculated vote totals.
 */

export interface PollOptionResults extends PollOption {
	voteCount: number;
}

export interface PollResults extends Omit<Poll, 'options'> {
	options: PollOptionResults[];
	totalVotes: number;
}