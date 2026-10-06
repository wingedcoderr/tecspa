import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';

import {
	createAccount,
	createSession,
	getSessionCookieName,
	isValidEmail,
	isValidPassword,
	isValidUsername
} from '$lib/server/auth';
import { enforceRateLimit } from '$lib/server/rate-limit';

function getClientAddressSafe(event: RequestEvent): string {
	try {
		return event.getClientAddress();
	} catch {
		return 'unknown';
	}
}

export const POST: RequestHandler = async (event) => {
	const { request, cookies } = event;

	const body = await request.json();

	const tooManyRequests = await enforceRateLimit(
		`register:${getClientAddressSafe(event)}`,
		5,
		3600
	);

	if (tooManyRequests) {
		return tooManyRequests;
	}

	const email =
		typeof body.email === 'string'
			? body.email
			: '';

	const username =
		typeof body.username === 'string'
			? body.username
			: '';

	const password =
		typeof body.password === 'string'
			? body.password
			: '';

	if (!isValidEmail(email)) {
		return json(
			{ error: 'Please enter a valid email address.' },
			{ status: 400 }
		);
	}

	if (!isValidUsername(username)) {
		return json(
			{
				error:
					'Username must be 3–32 characters and contain only letters, numbers, and underscores.'
			},
			{ status: 400 }
		);
	}

	if (!isValidPassword(password)) {
		return json(
			{
				error:
					'Password must be at least 8 characters long.'
			},
			{ status: 400 }
		);
	}

	try {
		const account = await createAccount(
			email,
			username,
			password
		);

		const session = await createSession(account.id);

		cookies.set(
			getSessionCookieName(),
			session.token,
			{
				httpOnly: true,
				secure: !dev,
				sameSite: 'lax',
				path: '/',
				expires: session.expiresAt
			}
		);

		return json({
			account
		});
	} catch (error) {
		if (
			error &&
			typeof error === 'object' &&
			'code' in error &&
			error.code === '23505'
		) {
			return json(
				{
					error:
						'That email address or username is already in use.'
				},
				{ status: 409 }
			);
		}

		console.error(
			'Account registration failed:',
			error
		);

		return json(
			{ error: 'Unable to create the account.' },
			{ status: 500 }
		);
	}
};
