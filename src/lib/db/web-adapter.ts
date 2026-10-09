import {
  deleteEncryptedRecord, listEncryptedRecords, loadEncryptedRecord, saveEncryptedRecord,
  deleteMemberRecord, listMemberRecords, loadMemberRecord, saveMemberRecord
} from '$lib/crypto/vault';
import { hasMasterKey } from '$lib/crypto/session';
import type { Member } from '$lib/data/members';
import type { ChatMessage, JournalEntry, Poll, PollResults, FrontHistoryEntry } from '$lib/data/activity';
import type { DataAdapter } from '$lib/db/adapter';
import type { AmpersandImportData } from '$lib/importers/ampersand';
import type { AmpersandImportResult } from '$lib/repositories/ampersand-import';
import type { PluralSpaceImportData } from '$lib/importers/pluralspace';

function requireUnlocked(): void {
  if (!hasMasterKey()) throw new Error('Unlock encryption before accessing private TECSPA data.');
}
function now(): string { return new Date().toISOString(); }
function id(): string { return crypto.randomUUID(); }

async function list<T>(type: 'journal' | 'chat-message' | 'front-history' | 'poll' | 'custom' | 'media') {
  requireUnlocked();
  return (await listEncryptedRecords<T>(type)).map((record) => record.value);
}

export class WebDataAdapter implements DataAdapter {
  async getMembers(): Promise<Member[]> { requireUnlocked(); return listMemberRecords<Member>(); }
  async getMemberById(memberId: string): Promise<Member | null> { requireUnlocked(); return loadMemberRecord<Member>(memberId); }
  async deleteMember(memberId: string): Promise<void> { requireUnlocked(); await deleteMemberRecord(memberId); }
  async updateMember(memberId: string, member: Member): Promise<Member> {
    requireUnlocked(); if (memberId !== member.id) throw new Error('Member ID mismatch.');
    await saveMemberRecord(member); return member;
  }
  async setMemberFronting(memberId: string, isFronting: boolean): Promise<void> {
    requireUnlocked();
    const member = await loadMemberRecord<Member>(memberId);
    if (!member) throw new Error('Member not found in encrypted storage.');
    if (member.isFronting === isFronting) return;
    const at = now();
    const entries = await list<FrontHistoryEntry>('front-history');
    if (isFronting) {
      const historyId = id();
      await saveEncryptedRecord('front-history', historyId, { id: historyId, memberId, startedAt: at, endedAt: null, note: '' } satisfies FrontHistoryEntry);
    } else {
      for (const entry of entries.filter((item) => item.memberId === memberId && !item.endedAt)) {
        await saveEncryptedRecord('front-history', entry.id, { ...entry, endedAt: at });
      }
    }
    await saveMemberRecord({ ...member, isFronting });
  }

  async importAmpersandData(data: AmpersandImportData): Promise<AmpersandImportResult> {
    requireUnlocked();
    for (const item of data.members) await saveMemberRecord(item.member);
    for (const entry of data.frontHistory) await saveEncryptedRecord('front-history', entry.id, entry);
    return { memberCount: data.members.length, frontHistoryCount: data.frontHistory.length, imageCount: data.summary.memberImages, bannerCount: data.summary.memberBanners };
  }
  async importPluralSpaceData(data: PluralSpaceImportData): Promise<AmpersandImportResult> {
    requireUnlocked();
    const customByMember = new Map<string, PluralSpaceImportData['customFields']>();
    for (const field of data.customFields) customByMember.set(field.memberId, [...(customByMember.get(field.memberId) ?? []), field]);
    for (const sourceMember of data.members) {
      const fields = customByMember.get(sourceMember.id) ?? [];
      const member: Member = { ...sourceMember, customFields: [...(sourceMember.customFields ?? []), ...fields] };
      await saveMemberRecord(member);
    }
    for (const entry of data.frontHistory) await saveEncryptedRecord('front-history', entry.id, entry);
    for (const entry of data.journalEntries) {
      const journal: JournalEntry = { ...entry, entryType: 'journal', tags: [], isPinned: entry.isPinned, authorMemberId: entry.authorMemberId, createdAt: entry.createdAt, updatedAt: entry.updatedAt };
      await saveEncryptedRecord('journal', journal.id, journal);
    }
    // Embedded media remains client-side. Preserve it inside the encrypted member record where possible.
    return { memberCount: data.members.length, frontHistoryCount: data.frontHistory.length, imageCount: 0, bannerCount: 0 };
  }

  async getFrontHistory(): Promise<FrontHistoryEntry[]> { return (await list<FrontHistoryEntry>('front-history')).sort((a,b) => b.startedAt.localeCompare(a.startedAt)); }
  async getFrontHistoryForMember(memberId: string): Promise<FrontHistoryEntry[]> { return (await this.getFrontHistory()).filter((entry) => entry.memberId === memberId); }
  async getCurrentFronting(): Promise<FrontHistoryEntry[]> { return (await this.getFrontHistory()).filter((entry) => !entry.endedAt); }
  async updateFrontHistoryNote(entryId: string, note: string): Promise<void> {
    requireUnlocked(); const entry = await loadEncryptedRecord<FrontHistoryEntry>('front-history', entryId);
    if (!entry) throw new Error('Front-history entry not found.');
    await saveEncryptedRecord('front-history', entryId, { ...entry, note });
  }
  async deleteFrontHistoryEntry(entryId: string): Promise<void> { requireUnlocked(); await deleteEncryptedRecord('front-history', entryId); }

  async getChatMessages(): Promise<ChatMessage[]> { return (await list<ChatMessage>('chat-message')).sort((a,b) => a.createdAt.localeCompare(b.createdAt)); }
  async createChatMessage(senderMemberId: string, message: string): Promise<ChatMessage> {
    requireUnlocked(); const text = message.trim(); if (!text) throw new Error('Chat messages cannot be empty.');
    const entry: ChatMessage = { id: id(), senderMemberId, message: text, createdAt: now(), editedAt: null };
    await saveEncryptedRecord('chat-message', entry.id, entry); return entry;
  }
  async updateChatMessage(messageId: string, message: string): Promise<ChatMessage> {
    requireUnlocked(); const text = message.trim(); if (!text) throw new Error('Chat messages cannot be empty.');
    const previous = await loadEncryptedRecord<ChatMessage>('chat-message', messageId); if (!previous) throw new Error('Chat message not found.');
    const updated = { ...previous, message: text, editedAt: now() }; await saveEncryptedRecord('chat-message', messageId, updated); return updated;
  }
  async deleteChatMessage(messageId: string): Promise<void> { requireUnlocked(); await deleteEncryptedRecord('chat-message', messageId); }

  async getJournalEntries(): Promise<JournalEntry[]> { return (await list<JournalEntry>('journal')).sort((a,b) => Number(b.isPinned)-Number(a.isPinned) || b.createdAt.localeCompare(a.createdAt)); }
  async getJournalEntryById(entryId: string): Promise<JournalEntry | null> { requireUnlocked(); return loadEncryptedRecord<JournalEntry>('journal', entryId); }
  async createJournalEntry(entry: Omit<JournalEntry, 'id'|'createdAt'|'updatedAt'>): Promise<JournalEntry> {
    requireUnlocked(); const at = now(); const created: JournalEntry = { ...entry, id: id(), createdAt: at, updatedAt: at }; await saveEncryptedRecord('journal', created.id, created); return created;
  }
  async updateJournalEntry(entryId: string, entry: Omit<JournalEntry, 'id'|'createdAt'|'updatedAt'>): Promise<JournalEntry> {
    requireUnlocked(); const previous = await loadEncryptedRecord<JournalEntry>('journal', entryId); if (!previous) throw new Error('Journal entry not found.');
    const updated: JournalEntry = { ...entry, id: entryId, createdAt: previous.createdAt, updatedAt: now() }; await saveEncryptedRecord('journal', entryId, updated); return updated;
  }
  async setJournalEntryPinned(entryId: string, isPinned: boolean): Promise<JournalEntry> {
    requireUnlocked(); const entry = await loadEncryptedRecord<JournalEntry>('journal', entryId); if (!entry) throw new Error('Journal entry not found.');
    const updated = { ...entry, isPinned, updatedAt: now() }; await saveEncryptedRecord('journal', entryId, updated); return updated;
  }
  async deleteJournalEntry(entryId: string): Promise<void> { requireUnlocked(); await deleteEncryptedRecord('journal', entryId); }

  async getPolls(): Promise<Poll[]> { return (await list<Poll>('poll')).sort((a,b) => b.createdAt.localeCompare(a.createdAt)); }
  async getPollResults(pollId: string): Promise<PollResults | null> {
    requireUnlocked(); const poll = await loadEncryptedRecord<Poll>('poll', pollId); if (!poll) return null;
    const votes = (poll as Poll & { votes?: Array<{ optionId: string; memberId: string }> }).votes ?? [];
    const options = poll.options.map((option) => ({ ...option, voteCount: votes.filter((vote) => vote.optionId === option.id).length }));
    return { ...poll, options, totalVotes: votes.length };
  }
}
