import { decryptWithMasterKey, encryptWithMasterKey, type VaultEncryptedPayload } from '$lib/crypto/e2ee';
import { getMasterKey } from '$lib/crypto/session';

export type VaultRecordType = 'member' | 'journal' | 'chat-message' | 'front-history' | 'poll' | 'custom' | 'media';

function requireMasterKey(): CryptoKey {
  const key = getMasterKey();
  if (!key) throw new Error('Your encryption key is locked. Sign in again to unlock encrypted data.');
  return key;
}

function query(type: VaultRecordType, id?: string): string {
  const params = new URLSearchParams({ type });
  if (id !== undefined) params.set('id', id);
  return `/api/crypto/vault?${params.toString()}`;
}

export async function saveEncryptedRecord<T>(type: VaultRecordType, id: string, value: T): Promise<void> {
  if (!id || id.length > 256) throw new Error('Invalid encrypted record ID.');
  const payload = await encryptWithMasterKey(value, requireMasterKey());
  const response = await fetch('/api/crypto/vault', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordType: type, recordId: id, payload })
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error ?? `Could not save encrypted record (${response.status}).`);
}

export async function loadEncryptedRecord<T>(type: VaultRecordType, id: string): Promise<T | null> {
  const response = await fetch(query(type, id));
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error ?? `Could not load encrypted record (${response.status}).`);
  if (!result?.record) return null;
  return decryptWithMasterKey<T>(result.record as VaultEncryptedPayload, requireMasterKey());
}

export async function listEncryptedRecords<T>(type: VaultRecordType): Promise<Array<{ id: string; value: T; updatedAt: string }>> {
  const response = await fetch(query(type));
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error ?? `Could not list encrypted records (${response.status}).`);
  const records = Array.isArray(result?.records) ? result.records : [];
  const key = requireMasterKey();
  return Promise.all(records.map(async (record: { record_id: string; encrypted_payload: VaultEncryptedPayload; updated_at: string }) => ({
    id: String(record.record_id),
    value: await decryptWithMasterKey<T>(record.encrypted_payload, key),
    updatedAt: String(record.updated_at)
  })));
}

export async function deleteEncryptedRecord(type: VaultRecordType, id: string): Promise<void> {
  const response = await fetch(query(type, id), { method: 'DELETE' });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error ?? `Could not delete encrypted record (${response.status}).`);
}


/** Save a complete member profile as one authenticated encrypted record. */
export async function saveMemberRecord<T extends { id: string }>(member: T): Promise<void> {
  await saveEncryptedRecord('member', member.id, member);
}

/** Load one encrypted member profile. No plaintext fallback is performed. */
export async function loadMemberRecord<T>(id: string): Promise<T | null> {
  return loadEncryptedRecord<T>('member', id);
}

/** List and decrypt member profiles stored in the encrypted vault. */
export async function listMemberRecords<T extends { id: string }>(): Promise<T[]> {
  const records = await listEncryptedRecords<T>('member');
  return records.map((record) => record.value);
}

export async function deleteMemberRecord(id: string): Promise<void> {
  await deleteEncryptedRecord('member', id);
}
