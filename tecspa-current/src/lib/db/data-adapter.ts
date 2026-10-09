import { browser } from '$app/environment';

import type { DataAdapter } from '$lib/db/adapter';
import { DesktopDataAdapter } from '$lib/db/desktop-adapter';
import { WebDataAdapter } from '$lib/db/web-adapter';
import { isDesktop } from '$lib/platform';

let dataAdapter: DataAdapter | null = null;

export function getDataAdapter(): DataAdapter {
	if (!browser) {
		throw new Error(
			'The TECSPA data adapter cannot be accessed during server rendering.'
		);
	}

	if (!dataAdapter) {
		if (isDesktop()) {
			dataAdapter = new DesktopDataAdapter();
		} else {
			dataAdapter = new WebDataAdapter();
		}
	}

	if (!dataAdapter) {
		throw new Error(
			'Failed to initialize the TECSPA data adapter.'
		);
	}

	return dataAdapter;
}