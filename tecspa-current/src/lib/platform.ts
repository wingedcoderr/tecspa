import { browser } from '$app/environment';

function runningInsideTauri(): boolean {
	if (!browser) {
		return false;
	}

	return (
		'__TAURI_INTERNALS__' in window ||
		'isTauri' in window
	);
}

export function isDesktop(): boolean {
	return runningInsideTauri();
}

export function isWeb(): boolean {
	return browser && !runningInsideTauri();
}