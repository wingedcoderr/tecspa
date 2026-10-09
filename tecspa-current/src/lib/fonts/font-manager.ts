export interface CustomFont {
	id: string;
	name: string;
	fileName: string;
	format: 'woff2' | 'woff' | 'ttf' | 'otf';
	createdAt: number;
}

type StoredFont = CustomFont & {
	blob: Blob;
};

const DB_NAME = 'tecspa-fonts';
const DB_VERSION = 1;
const STORE_NAME = 'fonts';

const SELECTED_FONT_KEY = 'tecspa-selected-font';

let databasePromise: Promise<IDBDatabase> | null = null;

const loadedFontUrls = new Map<string, string>();

function getDatabase(): Promise<IDBDatabase> {
	if (typeof window === 'undefined' || !('indexedDB' in window)) {
		return Promise.reject(
			new Error('IndexedDB is not available in this environment.')
		);
	}

	if (databasePromise) {
		return databasePromise;
	}

	databasePromise = new Promise((resolve, reject) => {
		const request = window.indexedDB.open(
			DB_NAME,
			DB_VERSION
		);

		request.onerror = () => {
			reject(
				request.error ??
					new Error('Could not open the font database.')
			);
		};

		request.onupgradeneeded = () => {
			const db = request.result;

			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, {
					keyPath: 'id'
				});
			}
		};

		request.onsuccess = () => {
			resolve(request.result);
		};
	});

	return databasePromise;
}

function getFormat(
	fileName: string
): CustomFont['format'] | null {
	const extension =
		fileName
			.split('.')
			.pop()
			?.toLowerCase();

	switch (extension) {
		case 'woff2':
			return 'woff2';

		case 'woff':
			return 'woff';

		case 'ttf':
			return 'ttf';

		case 'otf':
			return 'otf';

		default:
			return null;
	}
}

function createFontId(): string {
	if (
		typeof crypto !== 'undefined' &&
		'randomUUID' in crypto
	) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random()
		.toString(36)
		.slice(2)}`;
}

export async function getCustomFonts(): Promise<
	CustomFont[]
> {
	const db = await getDatabase();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction(
			STORE_NAME,
			'readonly'
		);

		const store =
			transaction.objectStore(STORE_NAME);

		const request = store.getAll();

		request.onerror = () => {
			reject(
				request.error ??
					new Error(
						'Could not load custom fonts.'
					)
			);
		};

		request.onsuccess = () => {
			const records =
				request.result as StoredFont[];

			resolve(
				records
					.map(
						({
							blob: _blob,
							...font
						}) => font
					)
					.sort((a, b) =>
						a.name.localeCompare(
							b.name
						)
					)
			);
		};
	});
}

export async function importCustomFont(
	file: File,
	name: string
): Promise<CustomFont> {
	const format = getFormat(file.name);

	if (!format) {
		throw new Error(
			'Unsupported font format. Please use WOFF2, WOFF, TTF, or OTF.'
		);
	}

	const trimmedName = name.trim();

	if (!trimmedName) {
		throw new Error(
			'Please enter a name for the font.'
		);
	}

	const font: CustomFont = {
		id: createFontId(),
		name: trimmedName,
		fileName: file.name,
		format,
		createdAt: Date.now()
	};

	const db = await getDatabase();

	await new Promise<void>((resolve, reject) => {
		const transaction = db.transaction(
			STORE_NAME,
			'readwrite'
		);

		const store =
			transaction.objectStore(STORE_NAME);

		const request = store.put({
			...font,
			blob: file
		});

		request.onerror = () => {
			reject(
				request.error ??
					new Error(
						'Could not save the font.'
					)
			);
		};

		request.onsuccess = () => {
			resolve();
		};
	});

	return font;
}

async function getFontRecord(
	id: string
): Promise<StoredFont | null> {
	const db = await getDatabase();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction(
			STORE_NAME,
			'readonly'
		);

		const store =
			transaction.objectStore(STORE_NAME);

		const request = store.get(id);

		request.onerror = () => {
			reject(
				request.error ??
					new Error(
						'Could not load the font.'
					)
			);
		};

		request.onsuccess = () => {
			resolve(
				(request.result as
					| StoredFont
					| undefined) ?? null
			);
		};
	});
}

export async function loadCustomFont(
	id: string
): Promise<CustomFont> {
	const record = await getFontRecord(id);

	if (!record) {
		throw new Error(
			'The selected font could not be found.'
		);
	}

	const existingUrl =
		loadedFontUrls.get(id);

	if (existingUrl) {
		URL.revokeObjectURL(existingUrl);
		loadedFontUrls.delete(id);
	}

	const objectUrl =
		URL.createObjectURL(record.blob);

	const fontFace = new FontFace(
		record.name,
		`url("${objectUrl}")`
	);

	try {
		await fontFace.load();

		document.fonts.add(fontFace);

		loadedFontUrls.set(
			id,
			objectUrl
		);
	} catch (error) {
		URL.revokeObjectURL(objectUrl);

		throw error;
	}

	return {
		id: record.id,
		name: record.name,
		fileName: record.fileName,
		format: record.format,
		createdAt: record.createdAt
	};
}

export async function deleteCustomFont(
	id: string
): Promise<void> {
	const db = await getDatabase();

	await new Promise<void>((resolve, reject) => {
		const transaction = db.transaction(
			STORE_NAME,
			'readwrite'
		);

		const store =
			transaction.objectStore(STORE_NAME);

		const request = store.delete(id);

		request.onerror = () => {
			reject(
				request.error ??
					new Error(
						'Could not delete the font.'
					)
			);
		};

		request.onsuccess = () => {
			resolve();
		};
	});

	const objectUrl =
		loadedFontUrls.get(id);

	if (objectUrl) {
		URL.revokeObjectURL(objectUrl);
		loadedFontUrls.delete(id);
	}

	if (getSelectedFontId() === id) {
		clearSelectedFont();
	}
}

export function getSelectedFontId(): string | null {
	if (typeof window === 'undefined') {
		return null;
	}

	return window.localStorage.getItem(
		SELECTED_FONT_KEY
	);
}

export function setSelectedFontId(
	id: string
): void {
	if (typeof window === 'undefined') {
		return;
	}

	window.localStorage.setItem(
		SELECTED_FONT_KEY,
		id
	);
}

export function clearSelectedFont(): void {
	if (typeof window === 'undefined') {
		return;
	}

	window.localStorage.removeItem(
		SELECTED_FONT_KEY
	);
}

export function applySelectedFont(
	font: CustomFont | null
): void {
	if (typeof document === 'undefined') {
		return;
	}

	const root = document.documentElement;

	if (!font) {
		root.removeAttribute(
			'data-tecspa-font'
		);

		root.style.removeProperty(
			'--tecspa-accessibility-font'
		);

		return;
	}

	root.dataset.tecspaFont = font.id;

	root.style.setProperty(
		'--tecspa-accessibility-font',
		`"${font.name}"`
	);
}