import { getDataAdapter } from '$lib/db/data-adapter';

import type { FrontHistoryEntry } from '$lib/data/activity';

export type { FrontHistoryEntry };

export async function getFrontHistory(): Promise<
	FrontHistoryEntry[]
> {
	return getDataAdapter().getFrontHistory();
}

export async function getFrontHistoryForMember(
	memberId: string
): Promise<FrontHistoryEntry[]> {
	return getDataAdapter().getFrontHistoryForMember(memberId);
}

export async function getCurrentFronting(): Promise<
	FrontHistoryEntry[]
> {
	return getDataAdapter().getCurrentFronting();
}

export async function updateFrontHistoryNote(
	id: string,
	note: string
): Promise<void> {
	return getDataAdapter().updateFrontHistoryNote(
		id,
		note
	);
}

export async function deleteFrontHistoryEntry(
	id: string
): Promise<void> {
	return getDataAdapter().deleteFrontHistoryEntry(id);
}