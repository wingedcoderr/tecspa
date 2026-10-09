import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import {
	getAccountFromSession,
	getSessionCookieName
} from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	const token = cookies.get(
		getSessionCookieName()
	);

	const account = await getAccountFromSession(token);

	return json({
		account
	});
};