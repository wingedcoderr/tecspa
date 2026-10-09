import type { Handle } from '@sveltejs/kit';

import {
	getAccountFromSession,
	getSessionCookieName
} from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(getSessionCookieName());

	try {
		event.locals.account = await getAccountFromSession(token);
	} catch (error) {
		console.error('Session lookup failed:', error);
		event.locals.account = null;
	}

	if (
		event.url.pathname.startsWith('/api/') &&
		!event.locals.account &&
		!event.url.pathname.startsWith('/api/auth/') &&
		!event.url.pathname.startsWith('/api/health/')
	) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'content-type': 'application/json' }
		});
	}

	return resolve(event);
};
