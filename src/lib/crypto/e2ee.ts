/**
 * TECSPA client-side encryption foundation.
 *
 * IMPORTANT: This module is intentionally isolated from the existing
 * plaintext PostgreSQL repositories. It provides the primitives we will use
 * for the full zero-knowledge migration, but importing this file alone does
 * NOT make existing server APIs end-to-end encrypted.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const PBKDF2_ITERATIONS = 600_000;
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	return new Uint8Array(bytes).buffer as ArrayBuffer;
}

export type EncryptedPayload = {
	version: 1;
	algorithm: 'AES-GCM';
	kdf: 'PBKDF2-SHA-256';
	iterations: number;
	salt: string;
	iv: string;
	ciphertext: string;
};

function bytesToBase64(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
	const material = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		'PBKDF2',
		false,
		['deriveKey']
	);

	return crypto.subtle.deriveKey(
		{
	name: 'PBKDF2',
	salt: toArrayBuffer(salt),
	iterations: PBKDF2_ITERATIONS,
	hash: 'SHA-256'
},
		material,
		{
			name: 'AES-GCM',
			length: KEY_LENGTH
		},
		false,
		['encrypt', 'decrypt']
	);
}

export async function encryptJson(
	value: unknown,
	password: string
): Promise<EncryptedPayload> {
	if (!password) throw new Error('An encryption password is required.');

	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const key = await deriveKey(password, salt);
	const plaintext = encoder.encode(JSON.stringify(value));
	const ciphertext = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		key,
		plaintext
	);

	return {
		version: 1,
		algorithm: 'AES-GCM',
		kdf: 'PBKDF2-SHA-256',
		iterations: PBKDF2_ITERATIONS,
		salt: bytesToBase64(salt),
		iv: bytesToBase64(iv),
		ciphertext: bytesToBase64(new Uint8Array(ciphertext))
	};
}

export async function decryptJson<T>(
	payload: EncryptedPayload,
	password: string
): Promise<T> {
	if (payload.version !== 1) {
		throw new Error('Unsupported TECSPA encryption version.');
	}

	if (payload.algorithm !== 'AES-GCM') {
		throw new Error('Unsupported TECSPA encryption algorithm.');
	}

	if (payload.kdf !== 'PBKDF2-SHA-256') {
		throw new Error('Unsupported TECSPA key derivation method.');
	}

	const salt = base64ToBytes(payload.salt);
	const iv = base64ToBytes(payload.iv);
	const key = await deriveKey(password, salt);
	const plaintext = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: toArrayBuffer(iv) },
		key,
		toArrayBuffer(base64ToBytes(payload.ciphertext))
	);

	return JSON.parse(decoder.decode(plaintext)) as T;
}


/**
 * Generate the random account master key used by future encrypted TECSPA data.
 * The key is intentionally created in the browser and is never sent to the server
 * in plaintext. It remains extractable only so it can be wrapped for persistence.
 */
export async function generateMasterKey(): Promise<CryptoKey> {
	const key = await crypto.subtle.generateKey(
		{ name: 'AES-GCM', length: KEY_LENGTH },
		true,
		['encrypt', 'decrypt']
	);

	return key as CryptoKey;
}

export async function wrapMasterKey(
	masterKey: CryptoKey,
	password: string
): Promise<EncryptedPayload> {
	const rawKey = await crypto.subtle.exportKey('raw', masterKey);
	return encryptJson(
		{
			type: 'tecspa-account-master-key',
			key: bytesToBase64(new Uint8Array(rawKey))
		},
		password
	);
}

export async function unwrapMasterKey(
	payload: EncryptedPayload,
	password: string
): Promise<CryptoKey> {
	const value = await decryptJson<{
		type: string;
		key: string;
	}>(payload, password);

	if (value.type !== 'tecspa-account-master-key' || !value.key) {
		throw new Error('Invalid TECSPA account encryption key.');
	}

	return crypto.subtle.importKey(
		'raw',
		toArrayBuffer(base64ToBytes(value.key)),
		{ name: 'AES-GCM', length: KEY_LENGTH },
		false,
		['encrypt', 'decrypt']
	);
}
