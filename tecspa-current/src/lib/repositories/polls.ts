import { getDatabase } from '$lib/db/database';

import type {
	Poll,
	PollOption,
	PollVote,
	PollResults,
	PollOptionResults
} from '$lib/data/activity';

/*
 * =========================================================
 * INTERNAL CONVERTERS
 * =========================================================
 */

function databaseRowToPoll(
	row: any,
	options: PollOption[] = []
): Poll {
	return {
		id: row.id,
		creatorMemberId: row.creator_member_id,
		question: row.question ?? '',
		allowMultiple: Boolean(row.allow_multiple),
		createdAt: row.created_at,
		closedAt: row.closed_at ?? null,
		options
	};
}

function databaseRowToPollOption(
	row: any
): PollOption {
	return {
		id: row.id,
		pollId: row.poll_id,
		label: row.label ?? '',
		sortOrder: Number(
			row.sort_order ?? 0
		)
	};
}

function databaseRowToPollVote(
	row: any
): PollVote {
	return {
		id: row.id,
		pollId: row.poll_id,
		optionId: row.option_id,
		memberId: row.member_id,
		createdAt: row.created_at
	};
}

/*
 * =========================================================
 * GET OPTIONS
 * =========================================================
 */

async function getPollOptions(
	pollId: string
): Promise<PollOption[]> {
	const db = await getDatabase();

	const rows = await db.select<any[]>(
		`
			SELECT *
			FROM poll_options
			WHERE poll_id = $1
			ORDER BY sort_order ASC
		`,
		[pollId]
	);

	return rows.map(databaseRowToPollOption);
}

/*
 * =========================================================
 * GET ALL POLLS
 * =========================================================
 */

export async function getPolls(): Promise<Poll[]> {
	const db = await getDatabase();

	const rows = await db.select<any[]>(
		`
			SELECT *
			FROM polls
			ORDER BY created_at DESC
		`
	);

	const polls: Poll[] = [];

	for (const row of rows) {
		const options =
			await getPollOptions(row.id);

		polls.push(
			databaseRowToPoll(row, options)
		);
	}

	return polls;
}

/*
 * =========================================================
 * GET ONE POLL
 * =========================================================
 */

export async function getPollById(
	id: string
): Promise<Poll | null> {
	const db = await getDatabase();

	const rows = await db.select<any[]>(
		`
			SELECT *
			FROM polls
			WHERE id = $1
		`,
		[id]
	);

	if (rows.length === 0) {
		return null;
	}

	const options =
		await getPollOptions(id);

	return databaseRowToPoll(
		rows[0],
		options
	);
}

/*
 * =========================================================
 * CREATE POLL
 * =========================================================
 */

export async function createPoll(
	creatorMemberId: string,
	question: string,
	options: string[],
	allowMultiple = false
): Promise<Poll> {
	const db = await getDatabase();

	const trimmedQuestion =
		question.trim();

	const cleanedOptions = options
		.map((option) => option.trim())
		.filter(Boolean);

	if (!trimmedQuestion) {
		throw new Error(
			'Poll questions cannot be empty.'
		);
	}

	if (cleanedOptions.length < 2) {
		throw new Error(
			'Polls need at least two options.'
		);
	}

	const id = crypto.randomUUID();
	const createdAt =
		new Date().toISOString();

	await db.execute(
		`
			INSERT INTO polls (
				id,
				creator_member_id,
				question,
				allow_multiple,
				created_at
			)
			VALUES (
				$1,
				$2,
				$3,
				$4,
				$5
			)
		`,
		[
			id,
			creatorMemberId,
			trimmedQuestion,
			allowMultiple ? 1 : 0,
			createdAt
		]
	);

	const pollOptions: PollOption[] = [];

	for (
		let index = 0;
		index < cleanedOptions.length;
		index += 1
	) {
		const optionId =
			crypto.randomUUID();

		await db.execute(
			`
				INSERT INTO poll_options (
					id,
					poll_id,
					label,
					sort_order
				)
				VALUES (
					$1,
					$2,
					$3,
					$4
				)
			`,
			[
				optionId,
				id,
				cleanedOptions[index],
				index
			]
		);

		pollOptions.push({
			id: optionId,
			pollId: id,
			label: cleanedOptions[index],
			sortOrder: index
		});
	}

	return {
		id,
		creatorMemberId,
		question: trimmedQuestion,
		allowMultiple,
		createdAt,
		closedAt: null,
		options: pollOptions
	};
}

/*
 * =========================================================
 * CLOSE POLL
 * =========================================================
 */

export async function closePoll(
	id: string
) {
	const db = await getDatabase();

	await db.execute(
		`
			UPDATE polls
			SET closed_at = $1
			WHERE id = $2
		`,
		[
			new Date().toISOString(),
			id
		]
	);
}

/*
 * =========================================================
 * REOPEN POLL
 * =========================================================
 */

export async function reopenPoll(
	id: string
) {
	const db = await getDatabase();

	await db.execute(
		`
			UPDATE polls
			SET closed_at = NULL
			WHERE id = $1
		`,
		[id]
	);
}

/*
 * =========================================================
 * GET VOTES
 * =========================================================
 */

export async function getPollVotes(
	pollId: string
): Promise<PollVote[]> {
	const db = await getDatabase();

	const rows = await db.select<any[]>(
		`
			SELECT *
			FROM poll_votes
			WHERE poll_id = $1
			ORDER BY created_at ASC
		`,
		[pollId]
	);

	return rows.map(databaseRowToPollVote);
}

/*
 * =========================================================
 * GET A MEMBER'S VOTES
 * =========================================================
 */

export async function getMemberPollVotes(
	pollId: string,
	memberId: string
): Promise<PollVote[]> {
	const db = await getDatabase();

	const rows = await db.select<any[]>(
		`
			SELECT *
			FROM poll_votes
			WHERE
				poll_id = $1
				AND member_id = $2
			ORDER BY created_at ASC
		`,
		[
			pollId,
			memberId
		]
	);

	return rows.map(databaseRowToPollVote);
}

/*
 * =========================================================
 * VOTE
 * =========================================================
 */

export async function voteOnPoll(
	pollId: string,
	memberId: string,
	optionIds: string[]
) {
	const db = await getDatabase();

	const poll =
		await getPollById(pollId);

	if (!poll) {
		throw new Error(
			'Poll not found.'
		);
	}

	if (poll.closedAt) {
		throw new Error(
			'This poll is closed.'
		);
	}

	const uniqueOptionIds = [
		...new Set(optionIds)
	];

	const validOptionIds =
		new Set(
			poll.options.map(
				(option) => option.id
			)
		);

	for (const optionId of uniqueOptionIds) {
		if (!validOptionIds.has(optionId)) {
			throw new Error(
				'One or more selected poll options are invalid.'
			);
		}
	}

	if (
		!poll.allowMultiple &&
		uniqueOptionIds.length > 1
	) {
		throw new Error(
			'This poll only allows one choice.'
		);
	}

	/*
	 * Replace this member's previous vote(s).
	 *
	 * This makes changing a vote straightforward.
	 */

	await db.execute(
		`
			DELETE FROM poll_votes
			WHERE
				poll_id = $1
				AND member_id = $2
		`,
		[
			pollId,
			memberId
		]
	);

	const createdAt =
		new Date().toISOString();

	for (const optionId of uniqueOptionIds) {
		await db.execute(
			`
				INSERT INTO poll_votes (
					id,
					poll_id,
					option_id,
					member_id,
					created_at
				)
				VALUES (
					$1,
					$2,
					$3,
					$4,
					$5
				)
			`,
			[
				crypto.randomUUID(),
				pollId,
				optionId,
				memberId,
				createdAt
			]
		);
	}
}

/*
 * =========================================================
 * REMOVE MEMBER'S VOTE
 * =========================================================
 */

export async function removePollVote(
	pollId: string,
	memberId: string
) {
	const db = await getDatabase();

	await db.execute(
		`
			DELETE FROM poll_votes
			WHERE
				poll_id = $1
				AND member_id = $2
		`,
		[
			pollId,
			memberId
		]
	);
}

/*
 * =========================================================
 * GET POLL RESULTS
 * =========================================================
 */

export async function getPollResults(
	pollId: string
): Promise<PollResults | null> {
	const poll =
		await getPollById(pollId);

	if (!poll) {
		return null;
	}

	const db = await getDatabase();

	const rows = await db.select<any[]>(
		`
			SELECT
				option_id,
				COUNT(*) AS vote_count
			FROM poll_votes
			WHERE poll_id = $1
			GROUP BY option_id
		`,
		[pollId]
	);

	const voteCounts = new Map<
		string,
		number
	>();

	for (const row of rows) {
		voteCounts.set(
			row.option_id,
			Number(row.vote_count ?? 0)
		);
	}

	const resultOptions: PollOptionResults[] =
		poll.options.map((option) => ({
			...option,
			voteCount:
				voteCounts.get(option.id) ?? 0
		}));

	const totalVotes =
		resultOptions.reduce(
			(total, option) =>
				total + option.voteCount,
			0
		);

	return {
		id: poll.id,
		creatorMemberId:
			poll.creatorMemberId,
		question: poll.question,
		allowMultiple:
			poll.allowMultiple,
		createdAt:
			poll.createdAt,
		closedAt:
			poll.closedAt,
		options: resultOptions,
		totalVotes
	};
}

/*
 * =========================================================
 * DELETE POLL
 * =========================================================
 */

export async function deletePoll(
	id: string
) {
	const db = await getDatabase();

	await db.execute(
		`
			DELETE FROM polls
			WHERE id = $1
		`,
		[id]
	);
}