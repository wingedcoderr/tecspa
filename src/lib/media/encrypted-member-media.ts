import { loadEncryptedRecord, saveEncryptedRecord, deleteEncryptedRecord } from '$lib/crypto/vault';

export type MemberMediaKind = 'avatar' | 'banner';
type EncryptedMediaRecord = { mimeType: string; dataUrl: string };
const marker = (memberId: string, kind: MemberMediaKind) => `e2ee-media:${encodeURIComponent(memberId)}:${kind}`;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function saveEncryptedMemberMedia(memberId: string, kind: MemberMediaKind, file: Blob): Promise<string> {
  if (!memberId || file.size <= 0) throw new Error('Choose a non-empty image first.');
  if (file.size > 1 * 1024 * 1024) throw new Error('Images must be 1 MB or smaller.');
  if (!file.type.startsWith('image/')) throw new Error('Only image files can be stored as member media.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${bytesToBase64(bytes)}`;
  await saveEncryptedRecord('media', `${memberId}:${kind}`, { mimeType: file.type, dataUrl } satisfies EncryptedMediaRecord);
  return marker(memberId, kind);
}

export async function resolveEncryptedMemberMedia(value: string): Promise<string> {
  if (!value.startsWith('e2ee-media:')) return value;
  const [, encodedId, kind] = value.split(':');
  if (!encodedId || (kind !== 'avatar' && kind !== 'banner')) return '';
  const memberId = decodeURIComponent(encodedId);
  const record = await loadEncryptedRecord<EncryptedMediaRecord>('media', `${memberId}:${kind}`);
  if (!record || !record.dataUrl.startsWith('data:image/')) return '';
  return record.dataUrl;
}

export async function deleteEncryptedMemberMedia(memberId: string, kind: MemberMediaKind): Promise<void> {
  await deleteEncryptedRecord('media', `${memberId}:${kind}`);
}

export async function saveEncryptedMemberMediaDataUrl(memberId: string, kind: MemberMediaKind, dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) throw new Error('The selected image is not a valid image data URL.');
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return saveEncryptedMemberMedia(memberId, kind, blob);
}
