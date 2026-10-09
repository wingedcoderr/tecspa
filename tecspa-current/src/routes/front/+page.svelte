<script lang="ts">
	import { onMount } from 'svelte';

	import { getDataAdapter } from '$lib/db/data-adapter';

	import type { Member } from '$lib/data/members';
	import type { FrontHistoryEntry } from '$lib/data/activity';

	let members: Member[] = [];
	let avatarUrls: Record<string, string> = {};
	let frontHistory: FrontHistoryEntry[] = [];

	let loading = true;
	let errorMessage = '';
	let savingId = '';
	let historySavingId = '';
	let historyDeletingId = '';

	let editingNoteId = '';
	let editingNote = '';

	$: currentFronters = members.filter((member) => member.isFronting);
	$: otherMembers = members.filter((member) => !member.isFronting);

	$: memberById = new Map(
		members.map((member) => [member.id, member])
	);

	$: sortedHistory = [...frontHistory].sort(
		(a, b) =>
			new Date(b.startedAt).getTime() -
			new Date(a.startedAt).getTime()
	);

	onMount(async () => {
		await loadMembers();
	});

	async function loadMembers() {
	try {
		loading = true;
		errorMessage = '';

		const dataAdapter = getDataAdapter();

		members = await dataAdapter.getMembers();
		frontHistory = await dataAdapter.getFrontHistory();

		avatarUrls = Object.fromEntries(
			members
				.filter((member) => member.avatar)
				.map((member) => [
					member.id,
					member.avatar
				])
		);
	} catch (error) {
		console.error(
			'Failed to load fronting data:',
			error
		);

		errorMessage =
			error instanceof Error
				? error.message
				: 'Could not load fronting information.';
	} finally {
		loading = false;
	}
}
	async function toggleFronting(member: Member) {
		if (savingId) {
			return;
		}

		savingId = member.id;
		errorMessage = '';

		try {
			await getDataAdapter().setMemberFronting(
	member.id,
	!member.isFronting
);

			members = members.map((item) =>
				item.id === member.id
					? {
							...item,
							isFronting: !item.isFronting
						}
					: item
			);

			frontHistory = await getDataAdapter().getFrontHistory();
		} catch (error) {
			console.error('Failed to update fronting status:', error);

			errorMessage =
				error instanceof Error
					? error.message
					: 'Could not update fronting status.';
		} finally {
			savingId = '';
		}
	}

	function memberName(memberId: string) {
		return memberById.get(memberId)?.name ?? 'Unknown member';
	}

	function memberAvatar(memberId: string) {
		return avatarUrls[memberId] ?? '';
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);

		if (Number.isNaN(date.getTime())) {
			return 'unknown date';
		}

		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(date);
	}

	function formatDuration(startedAt: string, endedAt: string | null) {
		const start = new Date(startedAt).getTime();
		const end = endedAt
			? new Date(endedAt).getTime()
			: Date.now();

		if (Number.isNaN(start) || Number.isNaN(end)) {
			return 'unknown duration';
		}

		const totalMinutes = Math.max(
			0,
			Math.floor((end - start) / 60000)
		);

		const days = Math.floor(totalMinutes / 1440);
		const hours = Math.floor((totalMinutes % 1440) / 60);
		const minutes = totalMinutes % 60;

		const parts: string[] = [];

		if (days) {
			parts.push(`${days}d`);
		}

		if (hours) {
			parts.push(`${hours}h`);
		}

		if (minutes || parts.length === 0) {
			parts.push(`${minutes}m`);
		}

		return parts.join(' ');
	}

	function beginEditingNote(entry: FrontHistoryEntry) {
		editingNoteId = entry.id;
		editingNote = entry.note;
	}

	function cancelEditingNote() {
		editingNoteId = '';
		editingNote = '';
	}

	async function saveHistoryNote(entry: FrontHistoryEntry) {
	if (historySavingId) {
		return;
	}

	historySavingId = entry.id;
	errorMessage = '';

	try {
		await getDataAdapter().updateFrontHistoryNote(
			entry.id,
			editingNote.trim()
		);

		frontHistory = frontHistory.map((item) =>
			item.id === entry.id
				? {
						...item,
						note: editingNote.trim()
					}
				: item
		);

		cancelEditingNote();
	} catch (error) {
		console.error(
			'Failed to save front history note:',
			error
		);

		errorMessage =
			error instanceof Error
				? error.message
				: 'Could not save the history note.';
	} finally {
		historySavingId = '';
	}
}

	async function removeHistoryEntry(entry: FrontHistoryEntry) {
	if (historyDeletingId) {
		return;
	}

	const confirmed = window.confirm(
		'Delete this front history entry? This cannot be undone.'
	);

	if (!confirmed) {
		return;
	}

	historyDeletingId = entry.id;
	errorMessage = '';

	try {
		await getDataAdapter().deleteFrontHistoryEntry(
			entry.id
		);

		frontHistory = frontHistory.filter(
			(item) => item.id !== entry.id
		);

		if (editingNoteId === entry.id) {
			cancelEditingNote();
		}
	} catch (error) {
		console.error(
			'Failed to delete front history entry:',
			error
		);

		errorMessage =
			error instanceof Error
				? error.message
				: 'Could not delete the history entry.';
	} finally {
		historyDeletingId = '';
	}
}
</script>

<svelte:head>
	<title>Front · TECSPA™</title>

	<meta
		name="description"
		content="See and manage who is currently fronting in TECSPA."
	/>
</svelte:head>

<div class="page-shell">
	<div class="lace lace-top"></div>

	<header class="page-header">
		<div class="header-ornament">✦</div>

		<p class="eyebrow">TECSPA™ · front</p>

		<h1>who is here right now?</h1>

		<p class="subtitle">
			Keep track of who is currently fronting.
			Multiple members can front at the same time.
		</p>

		<nav class="page-navigation" aria-label="Front navigation">
			<a href="/">
				<span>⌂</span>
				home
			</a>

			<a href="/members">
				<span>୨୧</span>
				members
			</a>

			<a class="active" href="/front">
				<span>✦</span>
				front
			</a>

			<a href="/customize">
				<span>⚙</span>
				customize
			</a>
		</nav>
	</header>

	<div class="ornament-divider">
		<span>୨୧</span>
		<span>─────</span>
		<span>✦</span>
		<span>─────</span>
		<span>୨୧</span>
	</div>

	{#if loading}
		<section class="message-panel">
			<div class="message-symbol">✦</div>
			<p>loading fronting information...</p>
		</section>
	{:else if errorMessage}
		<section class="message-panel error-panel">
			<div class="message-symbol">†</div>

			<h2>something went wrong</h2>

			<p>{errorMessage}</p>

			<button type="button" on:click={loadMembers}>
				try again
			</button>
		</section>
	{:else}
		<section class="front-section">
			<div class="section-heading">
				<div>
					<p class="eyebrow">✦ current front</p>

					<h2>
						{currentFronters.length === 0
							? 'nobody is marked fronting'
							: currentFronters.length === 1
								? 'currently fronting'
								: 'currently fronting together'}
					</h2>
				</div>

				<div class="front-count">
					<strong>{currentFronters.length}</strong>

					<span>
						{currentFronters.length === 1 ? 'fronter' : 'fronters'}
					</span>
				</div>
			</div>

			{#if currentFronters.length === 0}
				<div class="empty-front">
					<div class="empty-symbol">♡</div>

					<h3>the front is quiet</h3>

					<p>
						Choose someone below to mark them as currently
						fronting.
					</p>
				</div>
			{:else}
				<div class="fronter-grid">
					{#each currentFronters as member}
						<article class="fronter-card">
							<a
								class="fronter-main"
								href={`/members/${member.id}`}
							>
								<div class="avatar">
									{#if avatarUrls[member.id]}
										<img
											src={avatarUrls[member.id]}
											alt={`${member.name} profile picture`}
										/>
									{:else}
										<span>✦</span>
									{/if}
								</div>

								<div class="fronter-details">
									<p class="front-label">✦ fronting now</p>

									<h3>{member.name}</h3>

									<p class="pronouns">
										{member.pronouns}
									</p>
								</div>
							</a>

							<button
								class="stop-button"
								type="button"
								on:click={() => toggleFronting(member)}
								disabled={savingId === member.id}
							>
								{savingId === member.id
									? 'saving...'
									: '♡ stop fronting'}
							</button>
						</article>
					{/each}
				</div>
			{/if}
		</section>

		<div class="ornament-divider small-divider">
			<span>✧</span>
			<span>· · ·</span>
			<span>✧</span>
		</div>

		<section class="front-section">
			<div class="section-heading">
				<div>
					<p class="eyebrow">୨୧ system members</p>

					<h2>set someone fronting</h2>
				</div>
			</div>

			{#if otherMembers.length === 0}
				<div class="empty-front">
					<div class="empty-symbol">✦</div>

					<h3>everyone is currently fronting</h3>

					<p>
						There aren't any other members to add right now.
					</p>
				</div>
			{:else}
				<div class="member-list">
					{#each otherMembers as member}
						<article class="member-row">
							<a
								class="member-row-main"
								href={`/members/${member.id}`}
							>
								<div class="small-avatar">
									{#if avatarUrls[member.id]}
										<img
											src={avatarUrls[member.id]}
											alt={`${member.name} profile picture`}
										/>
									{:else}
										<span>✦</span>
									{/if}
								</div>

								<div>
									<strong>{member.name}</strong>

									<span>{member.pronouns}</span>
								</div>
							</a>

							<button
								class="set-button"
								type="button"
								on:click={() => toggleFronting(member)}
								disabled={savingId === member.id}
							>
								{savingId === member.id
									? 'saving...'
									: '✦ set fronting'}
							</button>
						</article>
					{/each}
				</div>
			{/if}
		</section>
	{/if}

		<section class="front-section history-section">
			<div class="section-heading">
				<div>
					<p class="eyebrow">✧ front history</p>

					<h2>where we've been</h2>

					<p class="section-description">
						A record of when each member has been fronting.
					</p>
				</div>

				<div class="history-count">
					<strong>{sortedHistory.length}</strong>
					<span>
						{sortedHistory.length === 1 ? 'entry' : 'entries'}
					</span>
				</div>
			</div>

			{#if sortedHistory.length === 0}
				<div class="empty-front">
					<div class="empty-symbol">♡</div>

					<h3>no front history yet</h3>

					<p>
						Once someone is marked as fronting, their fronting
						session will appear here.
					</p>
				</div>
			{:else}
				<div class="history-list">
					{#each sortedHistory as entry}
						<article
							class="history-entry"
							class:history-current={!entry.endedAt}
						>
							<div class="history-marker">
								{#if memberAvatar(entry.memberId)}
									<img
										src={memberAvatar(entry.memberId)}
										alt=""
									/>
								{:else}
									<span>✦</span>
								{/if}
							</div>

							<div class="history-content">
								<div class="history-top">
									<div>
										<div class="history-member-line">
											<a href={`/members/${entry.memberId}`}>
												{memberName(entry.memberId)}
											</a>

											{#if !entry.endedAt}
												<span class="history-live">
													● currently fronting
												</span>
											{/if}
										</div>

										<p class="history-date">
											{formatDate(entry.startedAt)}
											<span>→</span>
											{entry.endedAt ? formatDate(entry.endedAt) : 'now'}
										</p>
									</div>

									<div class="history-duration">
										<span>duration</span>
										<strong>
											{formatDuration(
												entry.startedAt,
												entry.endedAt
											)}
										</strong>
									</div>
								</div>

								{#if editingNoteId === entry.id}
									<div class="history-note-editor">
										<label for={`history-note-${entry.id}`}>
											note
										</label>

										<textarea
											id={`history-note-${entry.id}`}
											bind:value={editingNote}
											rows="3"
											placeholder="Add a note about this fronting session..."
										></textarea>

										<div class="history-note-actions">
											<button
											type="button"
											on:click={() =>
												saveHistoryNote(entry)}
											disabled={
												historySavingId === entry.id
											}
										>
											{historySavingId === entry.id
												? 'saving...'
												: 'save note'}
										</button>

											<button
												class="quiet-button"
												type="button"
												on:click={cancelEditingNote}
											>
												cancel
											</button>
										</div>
									</div>
								{:else}
									<div class="history-note">
										{#if entry.note}
											<p>“{entry.note}”</p>
										{:else}
											<p class="empty-note">no note added</p>
										{/if}

										<button
											class="note-button"
											type="button"
											on:click={() =>
												beginEditingNote(entry)}
										>
											{entry.note ? 'edit note' : '+ add note'}
										</button>
									</div>
								{/if}

								<div class="history-actions">
									<button
										class="delete-history-button"
										type="button"
										on:click={() =>
											removeHistoryEntry(entry)}
										disabled={
											historyDeletingId === entry.id
										}
									>
										{historyDeletingId === entry.id
											? 'deleting...'
											: 'delete entry'}
									</button>
								</div>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</section>

	<div class="bottom-actions">
		<a href="/members">← back to members</a>

		<a href="/">return home →</a>
	</div>

	<footer>
		<div class="footer-ornament">✦ · ♡ · ✦</div>

		<p>made with ♡ for systems</p>

		<p class="tiny">
			TECSPA™ · the extremely customizable plural app™
		</p>
	</footer>

	<div class="lace lace-bottom"></div>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(html) {
		background: var(--tecspa-background);
	}

	:global(body) {
		margin: 0;
		min-width: 320px;

		background: var(--tecspa-background);
		color: var(--tecspa-text);

		font-family:
			var(
				--tecspa-body-font,
				Georgia,
				'Times New Roman',
				serif
			);
	}

	:global(a) {
		color: inherit;
	}

	:global(button) {
		font: inherit;
	}

	.page-shell {
		position: relative;

		max-width: var(--tecspa-panel-width, 1100px);

		min-height: 100vh;

		margin: 0 auto;

		padding: 3rem 2rem;

		background:
			linear-gradient(
				135deg,
				color-mix(
					in srgb,
					var(--tecspa-surface) 96%,
					transparent
				),
				color-mix(
					in srgb,
					var(--tecspa-surface-alt) 92%,
					transparent
				)
			);

		border-left: 1px solid var(--tecspa-border);
		border-right: 1px solid var(--tecspa-border);

		box-shadow: var(--tecspa-panel-shadow);
	}

	.page-header {
		max-width: 760px;

		margin: 0 auto;

		text-align: center;
	}

	.header-ornament {
		margin-bottom: 0.75rem;

		color: var(--tecspa-accent);

		font-size: 2rem;
	}

	.eyebrow {
		margin: 0 0 0.4rem;

		color: var(--tecspa-accent-dark);

		font-size: 0.75rem;
		font-weight: 700;

		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	h1,
	h2,
	h3 {
		font-family:
			var(
				--tecspa-heading-font,
				Georgia,
				serif
			);
	}

	h1 {
		margin: 0;

		color: var(--tecspa-text);

		font-size: clamp(2rem, 5vw, 3.5rem);

		font-weight: 500;
	}

	.subtitle {
		max-width: 600px;

		margin: 1rem auto 0;

		color: var(--tecspa-text-muted);

		line-height: 1.7;
	}

	.page-navigation {
		display: flex;

		justify-content: center;

		flex-wrap: wrap;

		gap: 0.5rem;

		margin-top: 1.5rem;
	}

	.page-navigation a {
		display: inline-flex;

		align-items: center;

		gap: 0.4rem;

		padding: 0.55rem 0.9rem;

		color: var(--tecspa-text-muted);

		border: 1px solid transparent;

		border-radius: 999px;

		text-decoration: none;

		transition:
			color 0.2s ease,
			background 0.2s ease,
			border-color 0.2s ease;
	}

	.page-navigation a:hover,
	.page-navigation a.active {
		color: var(--tecspa-accent-dark);

		background: color-mix(
			in srgb,
			var(--tecspa-accent) 9%,
			transparent
		);

		border-color: var(--tecspa-border);
	}

	.ornament-divider {
		display: flex;

		align-items: center;

		justify-content: center;

		gap: 1rem;

		margin: 2.5rem 0;

		color: var(--tecspa-accent);

		opacity: 0.75;
	}

	.small-divider {
		margin: 2.25rem 0;
	}

	.front-section {
		max-width: 900px;

		margin: 0 auto;
	}

	.section-heading {
		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 1.5rem;

		margin-bottom: 1.25rem;
	}

	.section-heading h2 {
		margin: 0;

		font-size: clamp(1.4rem, 3vw, 2rem);

		font-weight: 500;
	}

	.front-count {
		display: flex;

		align-items: center;

		gap: 0.45rem;

		padding: 0.5rem 0.8rem;

		color: var(--tecspa-accent-dark);

		background: color-mix(
			in srgb,
			var(--tecspa-accent) 9%,
			var(--tecspa-surface)
		);

		border: 1px solid var(--tecspa-border);

		border-radius: 999px;

		white-space: nowrap;
	}

	.front-count strong {
		font-size: 1.1rem;
	}

	.front-count span {
		font-size: 0.8rem;
	}

	.fronter-grid {
		display: grid;

		grid-template-columns: repeat(
			auto-fit,
			minmax(280px, 1fr)
		);

		gap: 1rem;
	}

	.fronter-card {
		padding: 1rem;

		background:
			linear-gradient(
				135deg,
				color-mix(
					in srgb,
					var(--tecspa-accent) 7%,
					var(--tecspa-surface)
				),
				var(--tecspa-surface)
			);

		border: 1px solid var(--tecspa-border);

		border-radius: var(--tecspa-panel-radius);

		box-shadow: var(--tecspa-panel-shadow);
	}

	.fronter-main {
		display: flex;

		align-items: center;

		gap: 1rem;

		padding: 0.35rem;

		text-decoration: none;
	}

	.avatar {
		flex: 0 0 auto;

		width: 76px;
		height: 76px;

		overflow: hidden;

		display: grid;

		place-items: center;

		background: var(--tecspa-surface-alt);

		border: 1px solid var(--tecspa-border);

		border-radius: 50%;

		color: var(--tecspa-accent);

		font-size: 1.6rem;
	}

	.avatar img {
		width: 100%;
		height: 100%;

		object-fit: cover;
	}

	.fronter-details {
		min-width: 0;
	}

	.front-label {
		margin: 0 0 0.2rem;

		color: var(--tecspa-accent-dark);

		font-size: 0.7rem;
		font-weight: 700;

		letter-spacing: 0.08em;

		text-transform: uppercase;
	}

	.fronter-details h3 {
		margin: 0;

		overflow: hidden;

		color: var(--tecspa-text);

		font-size: 1.35rem;

		font-weight: 600;

		text-overflow: ellipsis;

		white-space: nowrap;
	}

	.pronouns {
		margin: 0.2rem 0 0;

		color: var(--tecspa-text-muted);

		font-size: 0.85rem;
	}

	.stop-button,
	.set-button,
	.message-panel button {
		border: 1px solid var(--tecspa-border);

		border-radius: 999px;

		cursor: pointer;

		transition:
			background 0.2s ease,
			color 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease;
	}

	.stop-button {
		width: 100%;

		margin-top: 0.8rem;

		padding: 0.65rem 1rem;

		color: var(--tecspa-accent-dark);

		background: transparent;
	}

	.stop-button:hover,
	.set-button:hover {
		background: color-mix(
			in srgb,
			var(--tecspa-accent) 10%,
			var(--tecspa-surface)
		);

		border-color: var(--tecspa-accent);

		transform: translateY(-1px);
	}

	button:disabled {
		cursor: wait;

		opacity: 0.6;

		transform: none;
	}

	.member-list {
		display: flex;

		flex-direction: column;

		gap: 0.65rem;
	}

	.member-row {
		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 1rem;

		padding: 0.7rem;

		background: color-mix(
			in srgb,
			var(--tecspa-surface-alt) 70%,
			var(--tecspa-surface)
		);

		border: 1px solid var(--tecspa-border);

		border-radius: var(--tecspa-panel-radius);
	}

	.member-row-main {
		display: flex;

		align-items: center;

		min-width: 0;

		gap: 0.75rem;

		text-decoration: none;
	}

	.small-avatar {
		flex: 0 0 auto;

		width: 46px;
		height: 46px;

		overflow: hidden;

		display: grid;

		place-items: center;

		background: var(--tecspa-surface);

		border: 1px solid var(--tecspa-border);

		border-radius: 50%;

		color: var(--tecspa-accent);
	}

	.small-avatar img {
		width: 100%;
		height: 100%;

		object-fit: cover;
	}

	.member-row-main strong {
		display: block;

		color: var(--tecspa-text);

		font-size: 0.95rem;
	}

	.member-row-main span {
		display: block;

		margin-top: 0.15rem;

		color: var(--tecspa-text-muted);

		font-size: 0.78rem;
	}

	.set-button {
		flex: 0 0 auto;

		padding: 0.55rem 0.85rem;

		color: var(--tecspa-accent-dark);

		background: var(--tecspa-surface);
	}

	.empty-front {
		padding: 3rem 1.5rem;

		text-align: center;

		background: color-mix(
			in srgb,
			var(--tecspa-surface-alt) 65%,
			var(--tecspa-surface)
		);

		border: 1px dashed var(--tecspa-border);

		border-radius: var(--tecspa-panel-radius);
	}

	.empty-symbol {
		margin-bottom: 0.75rem;

		color: var(--tecspa-accent);

		font-size: 2rem;
	}

	.empty-front h3 {
		margin: 0;

		font-size: 1.25rem;

		font-weight: 500;
	}

	.empty-front p {
		max-width: 500px;

		margin: 0.6rem auto 0;

		color: var(--tecspa-text-muted);

		line-height: 1.6;
	}

	.message-panel {
		max-width: 650px;

		margin: 0 auto;

		padding: 3rem 1.5rem;

		text-align: center;

		background: var(--tecspa-surface);

		border: 1px solid var(--tecspa-border);

		border-radius: var(--tecspa-panel-radius);
	}

	.message-symbol {
		margin-bottom: 0.75rem;

		color: var(--tecspa-accent);

		font-size: 2rem;
	}

	.message-panel p {
		color: var(--tecspa-text-muted);
	}

	.message-panel button {
		margin-top: 0.75rem;

		padding: 0.65rem 1rem;

		color: var(--tecspa-accent-dark);

		background: transparent;
	}

	.bottom-actions {
		display: flex;

		justify-content: center;

		flex-wrap: wrap;

		gap: 1rem;

		margin: 3rem auto 2rem;
	}

	.bottom-actions a {
		color: var(--tecspa-accent-dark);

		text-decoration: none;
	}

	.bottom-actions a:hover {
		text-decoration: underline;
	}

	footer {
		padding-top: 1.5rem;

		text-align: center;

		color: var(--tecspa-text-muted);
	}

	.footer-ornament {
		margin-bottom: 0.75rem;

		color: var(--tecspa-accent);

		letter-spacing: 0.4em;
	}

	footer p {
		margin: 0.25rem 0;
	}

	footer .tiny {
		font-size: 0.7rem;

		opacity: 0.7;
	}

	.lace {
		pointer-events: none;
	}

	.lace-top::before,
	.lace-bottom::before {
		content: '✦  ♡  ✦  ♡  ✦  ♡  ✦';

		display: block;

		color: var(--tecspa-accent);

		font-size: 0.75rem;

		letter-spacing: 0.8em;

		text-align: center;

		opacity: var(--tecspa-ornament-opacity, 0.7);
	}

	.lace-top {
		margin-bottom: 1.5rem;
	}

	.lace-bottom {
		margin-top: 1.5rem;
	}

	.section-description {
		margin: 0.45rem 0 0;
		color: var(--tecspa-text-muted);
		font-size: 0.88rem;
		line-height: 1.6;
	}

	.history-section {
		margin-top: 0.5rem;
	}

	.history-count {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.5rem 0.8rem;
		color: var(--tecspa-accent-dark);
		background: color-mix(
			in srgb,
			var(--tecspa-accent) 9%,
			var(--tecspa-surface)
		);
		border: 1px solid var(--tecspa-border);
		border-radius: 999px;
		white-space: nowrap;
	}

	.history-count strong {
		font-size: 1.1rem;
	}

	.history-count span {
		font-size: 0.8rem;
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.history-entry {
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1rem;
		padding: 1rem;
		background: color-mix(
			in srgb,
			var(--tecspa-surface-alt) 55%,
			var(--tecspa-surface)
		);
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		box-shadow: var(--tecspa-panel-shadow);
	}

	.history-entry.history-current {
		border-color: var(--tecspa-accent);
		background: linear-gradient(
			135deg,
			color-mix(
				in srgb,
				var(--tecspa-accent) 8%,
				var(--tecspa-surface)
			),
			var(--tecspa-surface)
		);
	}

	.history-marker {
		width: 54px;
		height: 54px;
		overflow: hidden;
		display: grid;
		place-items: center;
		align-self: start;
		background: var(--tecspa-surface);
		border: 1px solid var(--tecspa-border);
		border-radius: 50%;
		color: var(--tecspa-accent);
		font-size: 1.2rem;
	}

	.history-marker img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.history-content {
		min-width: 0;
	}

	.history-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.history-member-line {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.55rem;
	}

	.history-member-line a {
		color: var(--tecspa-text);
		font-family:
			var(
				--tecspa-heading-font,
				Georgia,
				serif
			);
		font-size: 1.2rem;
		font-weight: 600;
		text-decoration: none;
	}

	.history-member-line a:hover {
		color: var(--tecspa-accent-dark);
		text-decoration: underline;
	}

	.history-live {
		padding: 0.22rem 0.5rem;
		color: var(--tecspa-accent-dark);
		background: color-mix(
			in srgb,
			var(--tecspa-accent) 12%,
			transparent
		);
		border: 1px solid var(--tecspa-border);
		border-radius: 999px;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.history-date {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin: 0.35rem 0 0;
		color: var(--tecspa-text-muted);
		font-size: 0.78rem;
		line-height: 1.5;
	}

	.history-duration {
		flex: 0 0 auto;
		min-width: 80px;
		padding: 0.45rem 0.65rem;
		text-align: right;
		background: color-mix(
			in srgb,
			var(--tecspa-surface-alt) 70%,
			var(--tecspa-surface)
		);
		border: 1px solid var(--tecspa-border);
		border-radius: 0.7rem;
	}

	.history-duration span {
		display: block;
		color: var(--tecspa-text-muted);
		font-size: 0.62rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.history-duration strong {
		display: block;
		margin-top: 0.1rem;
		color: var(--tecspa-accent-dark);
		font-size: 0.9rem;
	}

	.history-note {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.85rem;
		padding-top: 0.75rem;
		border-top: 1px dashed var(--tecspa-border);
	}

	.history-note p {
		margin: 0;
		color: var(--tecspa-text-muted);
		font-size: 0.85rem;
		line-height: 1.6;
	}

	.history-note .empty-note {
		font-style: italic;
		opacity: 0.7;
	}

	.note-button {
		flex: 0 0 auto;
		padding: 0;
		color: var(--tecspa-accent-dark);
		background: transparent;
		border: 0;
		cursor: pointer;
		font-size: 0.75rem;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.note-button:hover {
		color: var(--tecspa-text);
	}

	.history-note-editor {
		margin-top: 0.85rem;
		padding-top: 0.85rem;
		border-top: 1px dashed var(--tecspa-border);
	}

	.history-note-editor label {
		display: block;
		margin-bottom: 0.4rem;
		color: var(--tecspa-accent-dark);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.history-note-editor textarea {
		width: 100%;
		resize: vertical;
		padding: 0.75rem;
		color: var(--tecspa-text);
		background: var(--tecspa-surface);
		border: 1px solid var(--tecspa-border);
		border-radius: 0.75rem;
		font: inherit;
		line-height: 1.5;
	}

	.history-note-editor textarea:focus {
		outline: 2px solid color-mix(
			in srgb,
			var(--tecspa-accent) 35%,
			transparent
		);
		outline-offset: 1px;
	}

	.history-note-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.55rem;
	}

	.history-note-actions button {
		padding: 0.5rem 0.75rem;
		color: var(--tecspa-accent-dark);
		background: transparent;
		border: 1px solid var(--tecspa-border);
		border-radius: 999px;
		cursor: pointer;
	}

	.history-note-actions button:hover {
		background: color-mix(
			in srgb,
			var(--tecspa-accent) 9%,
			var(--tecspa-surface)
		);
		border-color: var(--tecspa-accent);
	}

	.history-note-actions .quiet-button {
		color: var(--tecspa-text-muted);
	}

	.history-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 0.6rem;
	}

	.delete-history-button {
		padding: 0.3rem 0;
		color: var(--tecspa-text-muted);
		background: transparent;
		border: 0;
		cursor: pointer;
		font-size: 0.7rem;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.delete-history-button:hover {
		color: var(--tecspa-accent-dark);
	}

	.delete-history-button:disabled {
		cursor: wait;
		opacity: 0.5;
	}

	@media (max-width: 680px) {
		.page-shell {
			padding: 2rem 1rem;
		}

		.section-heading {
			align-items: flex-start;

			flex-direction: column;
		}

		.member-row {
			align-items: stretch;

			flex-direction: column;
		}

		.set-button {
			width: 100%;
		}

		.history-entry {
			grid-template-columns: 1fr;
		}

		.history-marker {
			width: 46px;
			height: 46px;
		}

		.history-top {
			flex-direction: column;
		}

		.history-duration {
			width: fit-content;
			text-align: left;
		}

		.history-note {
			flex-direction: column;
		}

		.note-button {
			align-self: flex-start;
		}

		.bottom-actions {
			flex-direction: column;

			align-items: center;
		}
	}

/* =========================================================
   TECSPA FRONT — MOBILE REBUILD
   ========================================================= */

@media (max-width: 700px) {
	/* -----------------------------------------------------
	   PAGE FOUNDATION
	   ----------------------------------------------------- */

	.page-shell {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding-left: 10px;
		padding-right: 10px;

		overflow-x: hidden;
	}

	.page-header {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding: 26px 14px 18px;

		overflow: hidden;
	}

	.page-header > div:first-child {
		width: 100%;
		max-width: 100%;
		min-width: 0;
	}

	.header-ornament {
		font-size: 1.8rem;
	}

	.eyebrow {
		max-width: 100%;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.page-header h1 {
		max-width: 100%;

		font-size: clamp(2.25rem, 11vw, 3.6rem);
		line-height: 1;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.subtitle {
		max-width: 100%;

		font-size: 0.84rem;
		line-height: 1.65;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	/* -----------------------------------------------------
	   PAGE NAVIGATION
	   ----------------------------------------------------- */

	.page-navigation {
		width: 100%;
		max-width: 100%;

		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));

		gap: 4px;

		box-sizing: border-box;

		margin-top: 20px;
		padding: 5px;
	}

	.page-navigation a {
		min-width: 0;
		min-height: 44px;

		display: flex;
		align-items: center;
		justify-content: center;

		box-sizing: border-box;

		padding: 8px 5px;

		text-align: center;

		font-size: 0.84rem;
		line-height: 1.15;

		overflow-wrap: anywhere;
	}

	.page-navigation a span {
		flex: 0 0 auto;
	}

	/* -----------------------------------------------------
	   DIVIDERS
	   ----------------------------------------------------- */

	.ornament-divider {
		width: 100%;
		max-width: 100%;

		display: flex;
		align-items: center;

		gap: 7px;

		box-sizing: border-box;

		overflow: hidden;
	}

	.ornament-divider span {
		flex: 0 0 auto;
	}

	.ornament-divider span:nth-child(2),
	.ornament-divider span:nth-child(4) {
		flex: 1;
		min-width: 0;

		overflow: hidden;
		white-space: nowrap;
	}

	/* -----------------------------------------------------
	   LOADING / ERROR PANELS
	   ----------------------------------------------------- */

	.message-panel {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding: 30px 18px;

		overflow: hidden;
	}

	.message-panel h2,
	.message-panel p {
		max-width: 100%;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.message-panel button {
		min-height: 46px;

		padding: 10px 18px;
	}

	/* -----------------------------------------------------
	   MAIN SECTIONS
	   ----------------------------------------------------- */

	.front-section {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		margin: 0;
		padding: 24px 10px;
	}

	.section-heading {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-direction: column;
		align-items: stretch;

		gap: 14px;

		box-sizing: border-box;
	}

	.section-heading > div {
		min-width: 0;
		max-width: 100%;
	}

	.section-heading h2 {
		max-width: 100%;

		font-size: clamp(1.9rem, 9vw, 3rem);
		line-height: 1.05;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.section-description {
		max-width: 100%;

		font-size: 0.84rem;
		line-height: 1.6;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.front-count,
	.history-count {
		align-self: flex-start;

		box-sizing: border-box;

		padding: 9px 14px;
	}

	.front-count strong,
	.history-count strong {
		font-size: 1.4rem;
	}

	/* -----------------------------------------------------
	   CURRENT FRONTERS
	   ----------------------------------------------------- */

	.fronter-grid {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: grid;
		grid-template-columns: 1fr;

		gap: 14px;

		box-sizing: border-box;

		margin-top: 20px;
	}

	.fronter-card {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		overflow: hidden;
	}

	.fronter-main {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-direction: column;

		box-sizing: border-box;
	}

	.fronter-card .avatar {
		width: 100%;
		max-width: 100%;

		height: 205px;

		flex: 0 0 205px;

		box-sizing: border-box;

		overflow: hidden;
	}

	.fronter-card .avatar img {
		display: block;

		width: 100%;
		height: 100%;

		object-fit: cover;
	}

	.fronter-details {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding: 17px 16px 16px;
	}

	.front-label {
		max-width: 100%;

		font-size: 0.7rem;
		letter-spacing: 0.1em;
	}

	.fronter-details h3 {
		max-width: 100%;

		margin: 5px 0 0;

		font-size: clamp(1.55rem, 8vw, 2.3rem);
		line-height: 1.05;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.fronter-details .pronouns {
		max-width: 100%;

		overflow-wrap: anywhere;
	}

	.fronter-actions {
		width: 100%;
		max-width: 100%;

		display: flex;
		flex-direction: column;

		gap: 8px;

		box-sizing: border-box;

		padding: 0 16px 16px;
	}

	.fronter-actions a,
	.fronter-actions button {
		width: 100%;
		min-height: 46px;

		box-sizing: border-box;

		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* -----------------------------------------------------
	   SET SOMEONE FRONTING
	   ----------------------------------------------------- */

	.member-list {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-direction: column;

		gap: 10px;

		box-sizing: border-box;

		margin-top: 18px;
	}

	.member-row {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-direction: column;

		gap: 10px;

		box-sizing: border-box;

		padding: 12px;
	}

	.member-row-main {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		align-items: center;

		gap: 12px;

		box-sizing: border-box;

		overflow: hidden;
	}

	.member-row-main > div:last-child {
		min-width: 0;
		max-width: 100%;
	}

	.member-row-main strong {
		display: block;

		max-width: 100%;

		font-size: 1rem;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.member-row-main span {
		display: block;

		max-width: 100%;

		font-size: 0.78rem;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.small-avatar {
		width: 54px;
		height: 54px;

		flex: 0 0 54px;

		box-sizing: border-box;

		overflow: hidden;
	}

	.small-avatar img {
		width: 100%;
		height: 100%;

		display: block;

		object-fit: cover;
	}

	.set-button {
		width: 100%;
		min-height: 46px;

		box-sizing: border-box;

		display: flex;
		align-items: center;
		justify-content: center;

		padding: 10px 12px;

		font-size: 0.82rem;
	}

	/* -----------------------------------------------------
	   EMPTY STATES
	   ----------------------------------------------------- */

	.empty-front {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding: 30px 18px;

		overflow: hidden;
	}

	.empty-front h3 {
		max-width: 100%;

		font-size: 1.5rem;
		line-height: 1.15;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.empty-front p {
		max-width: 100%;

		font-size: 0.85rem;
		line-height: 1.65;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	/* -----------------------------------------------------
	   FRONT HISTORY
	   ----------------------------------------------------- */

	.history-section {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;
	}

	.history-list {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-direction: column;

		gap: 12px;

		box-sizing: border-box;

		margin-top: 20px;
	}

	.history-entry {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		align-items: flex-start;

		gap: 12px;

		box-sizing: border-box;

		padding: 14px;
	}

	.history-marker {
		width: 44px;
		height: 44px;

		flex: 0 0 44px;

		box-sizing: border-box;

		overflow: hidden;
	}

	.history-marker img {
		width: 100%;
		height: 100%;

		display: block;

		object-fit: cover;
	}

	.history-content {
		flex: 1 1 auto;

		width: 0;
		min-width: 0;
		max-width: 100%;
	}

	.history-top {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-direction: column;

		gap: 12px;
	}

	.history-member-line {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-wrap: wrap;
		align-items: center;

		gap: 6px;
	}

	.history-member-line a {
		max-width: 100%;

		font-size: 1rem;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.history-live {
		max-width: 100%;

		font-size: 0.65rem;

		overflow-wrap: anywhere;
	}

	.history-date {
		max-width: 100%;

		display: flex;
		flex-wrap: wrap;

		gap: 5px;

		margin: 6px 0 0;

		font-size: 0.72rem;
		line-height: 1.5;

		overflow-wrap: anywhere;
	}

	.history-duration {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		padding-top: 10px;

		border-top: 1px solid var(--tecspa-border);
	}

	.history-duration span,
	.history-duration strong {
		display: block;

		overflow-wrap: anywhere;
	}

	.history-duration span {
		font-size: 0.65rem;
	}

	.history-duration strong {
		margin-top: 3px;

		font-size: 0.9rem;
	}

	/* -----------------------------------------------------
	   HISTORY NOTES
	   ----------------------------------------------------- */

	.history-note-editor {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		margin-top: 14px;
	}

	.history-note-editor textarea {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		min-height: 100px;
	}

	.history-note-actions {
		width: 100%;
		max-width: 100%;

		display: flex;
		flex-direction: column;

		gap: 8px;

		margin-top: 8px;
	}

	.history-note-actions button {
		width: 100%;
		min-height: 44px;

		box-sizing: border-box;
	}

	/* -----------------------------------------------------
	   HISTORY ACTIONS
	   ----------------------------------------------------- */

	.history-actions {
		width: 100%;
		max-width: 100%;

		display: flex;
		flex-direction: column;

		gap: 8px;

		margin-top: 12px;
	}

	.history-actions button,
	.history-actions a {
		width: 100%;
		min-height: 44px;

		box-sizing: border-box;

		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* -----------------------------------------------------
	   LONG TEXT SAFETY
	   ----------------------------------------------------- */

	.front-section *,
	.history-section * {
		min-width: 0;
		max-width: 100%;
	}

	.front-section a,
	.history-section a,
	.front-section p,
	.history-section p,
	.front-section h2,
	.front-section h3,
	.history-section h2,
	.history-section h3,
	.history-section span {
		overflow-wrap: anywhere;
		word-break: break-word;
	}
}


/* =========================================================
   SMALL PHONE
   ========================================================= */

@media (max-width: 420px) {
	.page-shell {
		padding-left: 6px;
		padding-right: 6px;
	}

	.page-header {
		padding-left: 10px;
		padding-right: 10px;
	}

	.page-header h1 {
		font-size: clamp(2.05rem, 11vw, 3rem);
	}

	.front-section {
		padding-left: 7px;
		padding-right: 7px;
	}

	.fronter-card .avatar {
		height: 185px;
		flex-basis: 185px;
	}

	.member-row {
		padding: 10px;
	}

	.history-entry {
		gap: 9px;
		padding: 11px;
	}

	.history-marker {
		width: 40px;
		height: 40px;

		flex-basis: 40px;
	}
}


/* =========================================================
   VERY SMALL PHONE
   ========================================================= */

@media (max-width: 350px) {
	.page-navigation {
		gap: 3px;
		padding: 4px;
	}

	.page-navigation a {
		min-height: 46px;

		padding-left: 3px;
		padding-right: 3px;

		font-size: 0.79rem;
	}

	.fronter-card .avatar {
		height: 165px;
		flex-basis: 165px;
	}

	.history-entry {
		display: block;
	}

	.history-marker {
		margin-bottom: 10px;
	}
}

</style>