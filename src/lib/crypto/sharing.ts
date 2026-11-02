/** Client-side ECDH key envelopes. Private keys and category keys must never be sent to the server. */

export type EcdhPublicJwk = JsonWebKey & { kty: 'EC'; crv: 'P-256'; x: string; y: string };
export type SharingKeyEnvelope = {
  version: 1;
  algorithm: 'AES-GCM';
  ephemeralPublicKey: EcdhPublicJwk;
  salt: string;
  iv: string;
  ciphertext: string;
};

const encoder = new TextEncoder();
const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));

// WebCrypto's newer TypeScript definitions require an ArrayBuffer-backed BufferSource.
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export async function generateSharingIdentity() {
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  ) as CryptoKeyPair;
  const publicKey = await crypto.subtle.exportKey('jwk', pair.publicKey) as EcdhPublicJwk;
  const privateKey = await crypto.subtle.exportKey('jwk', pair.privateKey);
  return { publicKey, privateKey };
}

export async function importSharingPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
}

async function deriveWrappingKey(privateKey: CryptoKey, publicKey: CryptoKey, salt: Uint8Array) {
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: publicKey }, privateKey, 256);
  const material = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      info: toArrayBuffer(encoder.encode('TECSPA share key envelope v1'))
    },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}

export async function createSharingKeyEnvelope(categoryKey: CryptoKey, recipientPublicJwk: EcdhPublicJwk): Promise<SharingKeyEnvelope> {
  const recipientPublic = await crypto.subtle.importKey('jwk', recipientPublicJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ephemeral = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']) as CryptoKeyPair;
  const ephemeralPublicKey = await crypto.subtle.exportKey('jwk', ephemeral.publicKey) as EcdhPublicJwk;
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrappingKey = await deriveWrappingKey(ephemeral.privateKey, recipientPublic, salt);
  const rawCategoryKey = await crypto.subtle.exportKey('raw', categoryKey);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrappingKey, rawCategoryKey);
  return { version: 1, algorithm: 'AES-GCM', ephemeralPublicKey, salt: toBase64(salt), iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}

export async function openSharingKeyEnvelope(envelope: SharingKeyEnvelope, recipientPrivateKey: CryptoKey): Promise<CryptoKey> {
  if (envelope.version !== 1 || envelope.algorithm !== 'AES-GCM') throw new Error('Unsupported sharing key envelope.');
  const ephemeralPublic = await crypto.subtle.importKey('jwk', envelope.ephemeralPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const wrappingKey = await deriveWrappingKey(recipientPrivateKey, ephemeralPublic, fromBase64(envelope.salt));
  const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(envelope.iv) }, wrappingKey, fromBase64(envelope.ciphertext));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function exportSharingPrivateKeyForVault(privateJwk: JsonWebKey): Promise<string> {
  return JSON.stringify(privateJwk);
}

export async function importSharingPrivateKeyFromVault(serialized: string): Promise<CryptoKey> {
  const value = JSON.parse(serialized) as JsonWebKey;
  if (value.kty !== 'EC' || value.crv !== 'P-256' || typeof value.d !== 'string') throw new Error('Invalid stored TECSPA sharing identity.');
  return importSharingPrivateKey(value);
}
