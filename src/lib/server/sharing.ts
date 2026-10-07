import { error } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';

import { pool } from '$lib/server/db/postgres';
import { getAuthenticatedSystem } from '$lib/server/system';

export type SharingRole = 'viewer' | 'contributor';

export type SharingPermissions = {
	viewMembers: boolean;
	viewFronting: boolean;
	viewFrontHistory: boolean;
	viewChat: boolean;
	participateChat: boolean;
	viewJournal: boolean;
	viewPolls: boolean;
};

export const DEFAULT_SHARING_PERMISSIONS: SharingPermissions = {
	viewMembers: true,
	viewFronting: true,
	viewFrontHistory: false,
	viewChat: false,
	participateChat: false,
	viewJournal: false,
	viewPolls: false
};

export type SharingRow = {
	id: string;
	systemId: string;
	systemName: string;
	recipientAccountId: string;
	recipientUsername: string;
	role: SharingRole;
	status: 'pending' | 'accepted' | 'revoked';
	permissions: SharingPermissions;
	createdAt: string;
	updatedAt: string;
	acceptedAt: string | null;
};

function normalizePermissions(value: unknown): SharingPermissions {
	if (!value || typeof value !== 'object') {
		return { ...DEFAULT_SHARING_PERMISSIONS };
	}

	const record = value as Record<string, unknown>;

	return {
		viewMembers: record.viewMembers !== false,
		viewFronting: record.viewFronting !== false,
		viewFrontHistory: record.viewFrontHistory === true,
		viewChat: record.viewChat === true,
		participateChat: record.participateChat === true,
		viewJournal: record.viewJournal === true,
		viewPolls: record.viewPolls === true
	};
}

export function rowToSharing(row: Record<string, unknown>): SharingRow {
	return {
		id: String(row.id),
		systemId: String(row.system_id),
		systemName: String(row.system_name),
		recipientAccountId: String(row.recipient_account_id),
		recipientUsername: String(row.recipient_username),
		role: row.role === 'contributor' ? 'contributor' : 'viewer',
		status:
			row.status === 'accepted' || row.status === 'revoked'
				? row.status
				: 'pending',
		permissions: normalizePermissions(row.permissions),
		createdAt: String(row.created_at),
		updatedAt: String(row.updated_at),
		acceptedAt: row.accepted_at ? String(row.accepted_at) : null
	};
}

export async function getOwnerShares(cookies: Cookies) {
	const { system } = await getAuthenticatedSystem(cookies);

	const result = await pool.query(
		`
			SELECT
				ss.id,
				ss.system_id,
				s.name AS system_name,
				ss.recipient_account_id,
				a.username AS recipient_username,
				ss.role,
				ss.status,
				ss.permissions,
				ss.created_at,
				ss.updated_at,
				ss.accepted_at
			FROM system_shares ss
			INNER JOIN systems s ON s.id = ss.system_id
			INNER JOIN accounts a ON a.id = ss.recipient_account_id
			WHERE ss.system_id = $1
			ORDER BY
				CASE ss.status
					WHEN 'accepted' THEN 0
					WHEN 'pending' THEN 1
					ELSE 2
				END,
				a.username
		`,
		[system.id]
	);

	return result.rows.map(rowToSharing);
}

export async function getIncomingShares(cookies: Cookies) {
	const { account } = await getAuthenticatedSystem(cookies);

	const result = await pool.query(
		`
			SELECT
				ss.id,
				ss.system_id,
				s.name AS system_name,
				ss.recipient_account_id,
				a.username AS recipient_username,
				ss.role,
				ss.status,
				ss.permissions,
				ss.created_at,
				ss.updated_at,
				ss.accepted_at
			FROM system_shares ss
			INNER JOIN systems s ON s.id = ss.system_id
			INNER JOIN accounts a ON a.id = s.owner_account_id
			WHERE ss.recipient_account_id = $1
			  AND ss.status IN ('pending', 'accepted')
			ORDER BY
				CASE ss.status
					WHEN 'pending' THEN 0
					ELSE 1
				END,
				s.name
		`,
		[account.id]
	);

	return result.rows.map((row) => ({
		...rowToSharing(row),
		ownerUsername: String(row.recipient_username)
	}));
}

export async function getShareForOwner(
	cookies: Cookies,
	shareId: string
) {
	const { system } = await getAuthenticatedSystem(cookies);

	const result = await pool.query(
		`
			SELECT
				ss.id,
				ss.system_id,
				s.name AS system_name,
				ss.recipient_account_id,
				a.username AS recipient_username,
				ss.role,
				ss.status,
				ss.permissions,
				ss.created_at,
				ss.updated_at,
				ss.accepted_at
			FROM system_shares ss
			INNER JOIN systems s ON s.id = ss.system_id
			INNER JOIN accounts a ON a.id = ss.recipient_account_id
			WHERE ss.id = $1
			  AND ss.system_id = $2
			LIMIT 1
		`,
		[shareId, system.id]
	);

	if (result.rows.length === 0) {
		throw error(404, 'That sharing invitation could not be found.');
	}

	return rowToSharing(result.rows[0]);
}

export async function getIncomingShare(
	cookies: Cookies,
	shareId: string
) {
	const { account } = await getAuthenticatedSystem(cookies);

	const result = await pool.query(
		`
			SELECT
				ss.id,
				ss.system_id,
				s.name AS system_name,
				ss.recipient_account_id,
				owner.username AS recipient_username,
				ss.role,
				ss.status,
				ss.permissions,
				ss.created_at,
				ss.updated_at,
				ss.accepted_at
			FROM system_shares ss
			INNER JOIN systems s ON s.id = ss.system_id
			INNER JOIN accounts owner ON owner.id = s.owner_account_id
			WHERE ss.id = $1
			  AND ss.recipient_account_id = $2
			LIMIT 1
		`,
		[shareId, account.id]
	);

	if (result.rows.length === 0) {
		throw error(404, 'That sharing invitation could not be found.');
	}

	return rowToSharing(result.rows[0]);
}

export async function createShare(
	cookies: Cookies,
	username: string,
	role: SharingRole,
	permissions: SharingPermissions
) {
	const { account, system } = await getAuthenticatedSystem(cookies);
	const normalizedUsername = username.trim();

	if (!normalizedUsername) {
		throw error(400, 'Enter the TECSPA username you want to share with.');
	}

	if (role !== 'viewer' && role !== 'contributor') {
		throw error(400, 'Invalid sharing role.');
	}

	const recipient = await pool.query<{ id: string }>(
		`
			SELECT id
			FROM accounts
			WHERE LOWER(username) = LOWER($1)
			LIMIT 1
		`,
		[normalizedUsername]
	);

	if (recipient.rows.length === 0) {
		throw error(404, 'No TECSPA account with that username was found.');
	}

	if (recipient.rows[0].id === account.id) {
		throw error(400, 'You cannot share your system with yourself.');
	}

	const existing = await pool.query(
		`
			SELECT id, status
			FROM system_shares
			WHERE system_id = $1
			  AND recipient_account_id = $2
			  AND status IN ('pending', 'accepted')
			LIMIT 1
		`,
		[system.id, recipient.rows[0].id]
	);

	if (existing.rows.length > 0) {
		throw error(
			409,
			'This person already has a pending or active share.'
		);
	}

	const id = crypto.randomUUID();

	await pool.query(
		`
			INSERT INTO system_shares (
				id,
				system_id,
				recipient_account_id,
				role,
				status,
				permissions
			)
			VALUES ($1, $2, $3, $4, 'pending', $5::jsonb)
		`,
		[
			id,
			system.id,
			recipient.rows[0].id,
			role,
			JSON.stringify(permissions)
		]
	);

	return getShareForOwner(cookies, id);
}
