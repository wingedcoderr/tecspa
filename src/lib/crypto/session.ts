/**
 * In-memory TECSPA encryption-key state.
 *
 * The account master key is deliberately not persisted in localStorage,
 * sessionStorage, IndexedDB, cookies, or URL parameters. It exists only for
 * the lifetime of the current page session and is cleared on logout.
 */
let masterKey: CryptoKey | null = null;

export function setMasterKey(key: CryptoKey): void {
	masterKey = key;
}

export function getMasterKey(): CryptoKey | null {
	return masterKey;
}

export function hasMasterKey(): boolean {
	return masterKey !== null;
}

export function clearMasterKey(): void {
	masterKey = null;
}
