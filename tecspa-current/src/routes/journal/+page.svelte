<script lang="ts">
	import { onMount } from 'svelte';

	import type { Member } from '$lib/data/members';
	import type { JournalEntry } from '$lib/data/activity';

import { getDataAdapter } from '$lib/db/data-adapter';

	let entries: JournalEntry[] = [];
	let members: Member[] = [];

	let loading = true;
	let errorMessage = '';

	let filter: 'all' | 'journal' | 'note' = 'all';

	onMount(() => {
		void loadJournal();
	});

	async function loadJournal() {
	loading = true;
	errorMessage = '';

	try {
		const dataAdapter = getDataAdapter();

		const [loadedEntries, loadedMembers] =
			await Promise.all([
				dataAdapter.getJournalEntries(),
				dataAdapter.getMembers()
			]);

		entries = loadedEntries;
		members = loadedMembers;
	} catch (error) {
		console.error(
			'Failed to load journal:',
			error
		);

		errorMessage =
			error instanceof Error
				? error.message
				: 'Could not load the journal.';
	} finally {
		loading = false;
	}
}

	function memberName(
		memberId: string | null
	): string {
		if (!memberId) {
			return 'system';
		}

		return (
			members.find(
				(member) => member.id === memberId
			)?.name ?? 'unknown member'
		);
	}

	function formatDate(
		value: string
	): string {
		return new Intl.DateTimeFormat(
			undefined,
			{
				dateStyle: 'medium',
				timeStyle: 'short'
			}
		).format(new Date(value));
	}

	function entryLabel(
		entry: JournalEntry
	): string {
		return entry.entryType === 'journal'
			? 'journal'
			: 'note';
	}

function previewText(
	value: string
): string {
	return value
		.replace(
			/!\[([^\]]*)\]\([^)]*\)/g,
			'$1'
		)
		.replace(
			/\[([^\]]+)\]\([^)]*\)/g,
			'$1'
		)
		.replace(
			/```[\s\S]*?```/g,
			''
		)
		.replace(
			/[*_~`>#]/g,
			''
		)
		.replace(
			/\s+/g,
			' '
		)
		.trim();
}

	function filteredEntries(): JournalEntry[] {
		if (filter === 'all') {
			return entries;
		}

		return entries.filter(
			(entry) =>
				entry.entryType === filter
		);
	}

		async function togglePinned(
		entry: JournalEntry
	) {
		try {
			const dataAdapter = getDataAdapter();

			const updatedEntry =
				await dataAdapter.setJournalEntryPinned(
					entry.id,
					!entry.isPinned
				);

			entries = entries.map((item) =>
				item.id === updatedEntry.id
					? updatedEntry
					: item
			);
		} catch (error) {
			console.error(
				'Failed to update journal pin:',
				error
			);

			errorMessage =
				error instanceof Error
					? error.message
					: 'Could not update the entry.';
		}
	}
</script>

<svelte:head>
	<title>Journal · TECSPA™</title>

	<meta
		name="description"
		content="Journal and notes for TECSPA."
	/>
</svelte:head>

<div class="background">
	<main class="page">
		<div class="top-decoration">
			<span>✦</span>
			<span>♡</span>
			<span>✦</span>
			<span>♡</span>
			<span>✦</span>
		</div>

		<nav class="top-navigation">
			<a href="/">← back home</a>
			<a href="/members">members</a>
			<a href="/chat">chat</a>
		</nav>

		<header class="page-header">
			<p class="eyebrow">
				TECSPA™ · journal
			</p>

			<h1>journal & notes</h1>

			<p class="subtitle">
				Thoughts, records, notes, and little pieces
				of system history.
			</p>

			<div class="header-actions">
				<a
					class="primary-button"
					href="/journal/new"
				>
					+ new entry
				</a>
			</div>
		</header>

		<div class="divider">
			<span>୨୧</span>
			<span>─────</span>
			<span>✦</span>
			<span>─────</span>
			<span>୨୧</span>
		</div>

		{#if errorMessage}
			<div class="error-message">
				{errorMessage}
			</div>
		{/if}

		<section class="filters">
			<button
				type="button"
				class:active={filter === 'all'}
				onclick={() => {
					filter = 'all';
				}}
			>
				all
			</button>

			<button
				type="button"
				class:active={filter === 'journal'}
				onclick={() => {
					filter = 'journal';
				}}
			>
				journal
			</button>

			<button
				type="button"
				class:active={filter === 'note'}
				onclick={() => {
					filter = 'note';
				}}
			>
				notes
			</button>
		</section>

		{#if loading}
			<section class="empty-state">
				<div class="empty-symbol">✦</div>
				<p>loading journal...</p>
			</section>
		{:else if filteredEntries().length === 0}
			<section class="empty-state">
				<div class="empty-symbol">♡</div>

				<h2>
					{filter === 'all'
						? 'nothing here yet'
						: `no ${filter}s yet`}
				</h2>

				<p>
					Start writing something and it'll
					appear here.
				</p>

				<a
					class="secondary-button"
					href="/journal/new"
				>
					write something
				</a>
			</section>
		{:else}
			<section class="entry-list">
				{#each filteredEntries() as entry}
					<article
						class:is-pinned={entry.isPinned}
						class="entry-card"
					>
						<div class="entry-card-top">
							<div>
								<div class="entry-meta">
									<span class="entry-type">
										{entryLabel(entry)}
									</span>

									<span>·</span>

									<span>
										{memberName(
											entry.authorMemberId
										)}
									</span>

									<span>·</span>

									<span>
										{formatDate(
											entry.createdAt
										)}
									</span>
								</div>

								<h2>
									<a
										href={`/journal/${entry.id}`}
									>
										{entry.title ||
											'untitled entry'}
									</a>
								</h2>
							</div>

							<button
								class="pin-button"
								class:pinned={entry.isPinned}
								type="button"
								title={
									entry.isPinned
										? 'Unpin entry'
										: 'Pin entry'
								}
								onclick={() =>
									togglePinned(entry)}
							>
								{entry.isPinned
									? '★'
									: '☆'}
							</button>
						</div>

						{#if entry.tags.length > 0}
							<div class="tags">
								{#each entry.tags as tag}
									<span>#{tag}</span>
								{/each}
							</div>
						{/if}

						<p class="entry-preview">
	{#if previewText(entry.body)}
		{previewText(entry.body).length > 280
			? `${previewText(entry.body).slice(0, 280)}…`
			: previewText(entry.body)}
	{:else}
		<em>this entry contains only media or formatting</em>
	{/if}
</p>

						<a
							class="read-link"
							href={`/journal/${entry.id}`}
						>
							read entry →
						</a>
					</article>
				{/each}
			</section>
		{/if}
	</main>
</div>

<style>
	.background {
		min-height: 100vh;
		padding: 2.5rem 1rem 5rem;
	}

	.page {
		width: min(
			var(--tecspa-panel-width),
			100%
		);

		margin: 0 auto;
		padding: 2.25rem;

		background:
			linear-gradient(
				180deg,
				var(--tecspa-surface),
				var(--tecspa-surface-alt)
			);

		border:
			1px solid
			var(--tecspa-border);

		border-radius:
			var(--tecspa-panel-radius);

		box-shadow:
			var(--tecspa-panel-shadow);
	}

	/* =====================================================
	   NAVIGATION
	   ===================================================== */

	.top-navigation {
		display: flex;
		flex-wrap: wrap;
		gap: 1.2rem;

		margin-bottom: 2.5rem;
		padding-bottom: 0.75rem;

		border-bottom:
			1px solid
			var(--tecspa-border);

		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.top-navigation a {
		color: var(--tecspa-text-muted);
		text-decoration: none;

		transition:
			color 120ms ease,
			transform 120ms ease;
	}

	.top-navigation a:hover {
		color: var(--tecspa-accent);
		transform: translateY(-1px);
	}

	/* =====================================================
	   HEADER
	   ===================================================== */

	.top-decoration {
		display: flex;
		justify-content: center;
		gap: 1rem;

		margin-bottom: 1rem;

		color: var(--tecspa-accent);
		font-size: 0.9rem;

		opacity:
			var(--tecspa-ornament-opacity);
	}

	.page-header {
		text-align: center;
	}

	.eyebrow {
		margin: 0 0 0.45rem;

		color: var(--tecspa-accent);

		font-size: 0.68rem;
		font-weight: 800;

		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;

		color: var(--tecspa-text);

		font-family:
			var(--tecspa-heading-font);

		font-size: clamp(
			2rem,
			5vw,
			3.3rem
		);

		line-height: 1;
	}

	.subtitle {
		max-width: 620px;

		margin:
			0.8rem
			auto
			0;

		color: var(--tecspa-text-muted);

		font-size: 0.9rem;
		line-height: 1.65;
	}

	.header-actions {
		display: flex;
		justify-content: center;

		margin-top: 1.35rem;
	}

	/* =====================================================
	   BUTTONS
	   ===================================================== */

	.primary-button,
	.secondary-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		padding:
			0.65rem
			1rem;

		border:
			1px solid
			var(--tecspa-border);

		border-radius:
			var(--tecspa-panel-radius);

		font-size: 0.76rem;
		font-weight: 800;
		letter-spacing: 0.04em;

		text-decoration: none;

		transition:
			transform 120ms ease,
			box-shadow 120ms ease,
			filter 120ms ease;
	}

	.primary-button {
		color: white;

		background:
			var(--tecspa-accent);

		border-color:
			var(--tecspa-accent);

		box-shadow:
			0 3px 8px
			color-mix(
				in srgb,
				var(--tecspa-accent) 20%,
				transparent
			);
	}

	.secondary-button {
		color: var(--tecspa-accent-dark);
		background: var(--tecspa-surface);
	}

	.primary-button:hover,
	.secondary-button:hover {
		transform: translateY(-2px);
		filter: brightness(1.02);
	}

	/* =====================================================
	   DIVIDER
	   ===================================================== */

	.divider {
		display: flex;
		align-items: center;
		justify-content: center;

		gap: 0.65rem;

		margin:
			2rem
			0
			1.5rem;

		color: var(--tecspa-accent);

		font-size: 0.75rem;

		opacity:
			var(--tecspa-ornament-opacity);
	}

	/* =====================================================
	   FILTERS
	   ===================================================== */

	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;

		gap: 0.45rem;

		margin-bottom: 1.3rem;
	}

	.filters button {
		padding:
			0.45rem
			0.8rem;

		border:
			1px solid
			var(--tecspa-border);

		border-radius: 999px;

		color: var(--tecspa-text-muted);

		background:
			var(--tecspa-surface);

		font: inherit;

		font-size: 0.72rem;
		font-weight: 800;

		cursor: pointer;

		transition:
			background 120ms ease,
			color 120ms ease,
			border-color 120ms ease,
			transform 120ms ease;
	}

	.filters button:hover {
		transform: translateY(-1px);

		border-color:
			var(--tecspa-accent);

		color: var(--tecspa-accent);
	}

	.filters button.active {
		color: white;

		background:
			var(--tecspa-accent);

		border-color:
			var(--tecspa-accent);
	}

	/* =====================================================
	   ERROR
	   ===================================================== */

	.error-message {
		margin-bottom: 1rem;
		padding:
			0.8rem
			1rem;

		border:
			1px solid
			var(--tecspa-border);

		border-radius:
			var(--tecspa-panel-radius);

		color: var(--tecspa-accent-dark);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 8%,
				var(--tecspa-surface)
			);

		font-size: 0.82rem;
	}

	/* =====================================================
	   ENTRY LIST
	   ===================================================== */

	.entry-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.entry-card {
		position: relative;

		padding:
			1.35rem
			1.45rem;

		border:
			1px solid
			var(--tecspa-border);

		border-radius:
			var(--tecspa-panel-radius);

		background:
			var(--tecspa-surface);

		box-shadow:
			0 4px 14px
			color-mix(
				in srgb,
				var(--tecspa-accent) 7%,
				transparent
			);

		transition:
			transform 140ms ease,
			border-color 140ms ease,
			box-shadow 140ms ease;
	}

	.entry-card:hover {
		transform: translateY(-2px);

		border-color:
			color-mix(
				in srgb,
				var(--tecspa-accent) 55%,
				var(--tecspa-border)
			);

		box-shadow:
			0 8px 20px
			color-mix(
				in srgb,
				var(--tecspa-accent) 10%,
				transparent
			);
	}

	.entry-card.is-pinned {
		border-color:
			var(--tecspa-accent);
	}

	.entry-card.is-pinned::before {
		content: 'PINNED';

		position: absolute;

		top: -0.55rem;
		left: 1.15rem;

		padding:
			0.2rem
			0.45rem;

		border:
			1px solid
			var(--tecspa-accent);

		border-radius: 999px;

		color:
			var(--tecspa-accent-dark);

		background:
			var(--tecspa-surface);

		font-size: 0.58rem;
		font-weight: 900;

		letter-spacing: 0.1em;
	}

	.entry-card-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;

		gap: 1rem;
	}

	.entry-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;

		gap: 0.35rem;

		color: var(--tecspa-text-muted);

		font-size: 0.68rem;
		line-height: 1.5;
	}

	.entry-type {
		color: var(--tecspa-accent);

		font-weight: 900;

		letter-spacing: 0.08em;

		text-transform: uppercase;
	}

	.entry-card h2 {
		margin:
			0.45rem
			0
			0;
	}

	.entry-card h2 a {
		color: var(--tecspa-text);

		font-family:
			var(--tecspa-heading-font);

		font-size: 1.35rem;

		line-height: 1.2;

		text-decoration: none;
	}

	.entry-card h2 a:hover {
		color: var(--tecspa-accent);
	}

	/* =====================================================
	   PIN BUTTON
	   ===================================================== */

	.pin-button {
		flex: 0 0 auto;

		display: inline-flex;
		align-items: center;
		justify-content: center;

		width: 2.1rem;
		height: 2.1rem;

		padding: 0;

		border:
			1px solid
			var(--tecspa-border);

		border-radius: 50%;

		color: var(--tecspa-text-muted);

		background:
			var(--tecspa-surface);

		font-size: 1rem;

		cursor: pointer;

		transition:
			transform 120ms ease,
			color 120ms ease,
			border-color 120ms ease;
	}

	.pin-button:hover {
		transform: rotate(-8deg) scale(1.05);

		color: var(--tecspa-accent);

		border-color:
			var(--tecspa-accent);
	}

	.pin-button.pinned {
		color: var(--tecspa-accent);

		border-color:
			var(--tecspa-accent);
	}

	/* =====================================================
	   TAGS
	   ===================================================== */

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;

		margin-top: 0.85rem;
	}

	.tags span {
		padding:
			0.22rem
			0.5rem;

		border:
			1px solid
			color-mix(
				in srgb,
				var(--tecspa-accent) 25%,
				var(--tecspa-border)
			);

		border-radius: 999px;

		color:
			var(--tecspa-accent-dark);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 6%,
				var(--tecspa-surface)
			);

		font-size: 0.65rem;
		font-weight: 700;
	}

	/* =====================================================
	   PREVIEW
	   ===================================================== */

	.entry-preview {
		max-width: 760px;

		margin:
			0.9rem
			0
			0;

		color:
			var(--tecspa-text-muted);

		font-size: 0.84rem;

		line-height: 1.7;

		overflow-wrap: anywhere;
	}

	.entry-preview em {
		opacity: 0.75;
	}

	.read-link {
		display: inline-block;

		margin-top: 0.85rem;

		color:
			var(--tecspa-accent-dark);

		font-size: 0.74rem;
		font-weight: 800;

		text-decoration: none;
	}

	.read-link:hover {
		text-decoration: underline;
	}

	/* =====================================================
	   EMPTY STATE
	   ===================================================== */

	.empty-state {
		padding:
			4rem
			1rem;

		text-align: center;

		border:
			1px dashed
			var(--tecspa-border);

		border-radius:
			var(--tecspa-panel-radius);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 3%,
				var(--tecspa-surface)
			);
	}

	.empty-symbol {
		margin-bottom: 0.7rem;

		color:
			var(--tecspa-accent);

		font-size: 2rem;

		opacity:
			var(--tecspa-ornament-opacity);
	}

	.empty-state h2 {
		margin: 0;

		color:
			var(--tecspa-text);

		font-family:
			var(--tecspa-heading-font);
	}

	.empty-state p {
		margin:
			0.5rem
			0
			1.2rem;

		color:
			var(--tecspa-text-muted);

		font-size: 0.84rem;
	}

	/* =====================================================
	   MOBILE
	   ===================================================== */

	@media (max-width: 680px) {
		.background {
			padding:
				1rem
				0.5rem
				3rem;
		}

		.page {
			padding: 1.2rem;
		}

		.top-navigation {
			margin-bottom: 1.7rem;
		}

		.entry-card {
			padding:
				1.1rem;
		}

		.entry-card h2 a {
			font-size: 1.15rem;
		}

		.entry-card-top {
			gap: 0.7rem;
		}

		.entry-preview {
			font-size: 0.8rem;
		}

		.empty-state {
			padding:
				3rem
				1rem;
		}
	}

/* =========================================================
   TECSPA JOURNAL — MOBILE REBUILD
   ========================================================= */

@media (max-width: 700px) {
	/* -----------------------------------------------------
	   PAGE FOUNDATION
	   ----------------------------------------------------- */

	.background {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding: 12px 6px 32px;

		overflow-x: hidden;
	}

	.page {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding: 20px 13px 28px;

		overflow: hidden;
	}

	.page > * {
		max-width: 100%;
		min-width: 0;
		box-sizing: border-box;
	}

	/* -----------------------------------------------------
	   TOP NAV
	   ----------------------------------------------------- */

	.top-navigation {
		width: 100%;
		max-width: 100%;

		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));

		gap: 4px;

		box-sizing: border-box;

		margin-bottom: 20px;
		padding-bottom: 0;

		border-bottom: 0;
	}

	.top-navigation a {
		min-width: 0;
		min-height: 44px;

		display: flex;
		align-items: center;
		justify-content: center;

		box-sizing: border-box;

		padding: 8px 5px;

		border: 1px solid var(--tecspa-border);

		background:
			color-mix(
				in srgb,
				var(--tecspa-surface) 80%,
				transparent
			);

		text-align: center;

		font-size: 0.7rem;
		line-height: 1.2;

		overflow-wrap: anywhere;
	}

	/* -----------------------------------------------------
	   HEADER
	   ----------------------------------------------------- */

	.top-decoration {
		gap: 0.65rem;

		margin-bottom: 12px;

		font-size: 0.75rem;
	}

	.page-header {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		text-align: center;
	}

	.page-header h1 {
		max-width: 100%;

		font-size: clamp(2.2rem, 12vw, 3.5rem);
		line-height: 0.98;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.subtitle {
		max-width: 100%;

		margin-top: 10px;

		font-size: 0.8rem;
		line-height: 1.65;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.header-actions {
		width: 100%;
		max-width: 100%;

		margin-top: 15px;
	}

	.header-actions .primary-button {
		width: 100%;
		min-height: 46px;

		box-sizing: border-box;
	}

	/* -----------------------------------------------------
	   DIVIDER
	   ----------------------------------------------------- */

	.divider {
		width: 100%;
		max-width: 100%;

		display: flex;

		gap: 6px;

		margin: 20px 0 15px;

		overflow: hidden;
	}

	.divider span {
		flex: 0 0 auto;
	}

	.divider span:nth-child(2),
	.divider span:nth-child(4) {
		flex: 1;
		min-width: 0;

		overflow: hidden;
		white-space: nowrap;
	}

	/* -----------------------------------------------------
	   FILTERS
	   ----------------------------------------------------- */

	.filters {
		width: 100%;
		max-width: 100%;

		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));

		gap: 5px;

		box-sizing: border-box;

		margin-bottom: 15px;
	}

	.filters button {
		width: 100%;
		min-height: 44px;

		box-sizing: border-box;

		padding: 8px 4px;

		font-size: 0.7rem;

		-webkit-tap-highlight-color: transparent;
	}

	/* -----------------------------------------------------
	   ERROR
	   ----------------------------------------------------- */

	.error-message {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		padding: 11px 12px;

		font-size: 0.78rem;
		line-height: 1.5;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	/* -----------------------------------------------------
	   ENTRY LIST
	   ----------------------------------------------------- */

	.entry-list {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-direction: column;

		gap: 12px;

		box-sizing: border-box;
	}

	/* -----------------------------------------------------
	   ENTRY CARD
	   ----------------------------------------------------- */

	.entry-card {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding: 16px 14px;

		overflow: hidden;
	}

	.entry-card-top {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		align-items: flex-start;
		justify-content: space-between;

		gap: 10px;

		box-sizing: border-box;
	}

	.entry-card-top > div:first-child {
		min-width: 0;
		max-width: 100%;
	}

	/* -----------------------------------------------------
	   ENTRY META
	   ----------------------------------------------------- */

	.entry-meta {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-wrap: wrap;
		align-items: center;

		gap: 4px 6px;

		font-size: 0.62rem;
		line-height: 1.45;

		overflow-wrap: anywhere;
	}

	.entry-meta > span {
		max-width: 100%;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.entry-type {
		font-weight: 800;
	}

	/* -----------------------------------------------------
	   ENTRY TITLE
	   ----------------------------------------------------- */

	.entry-card h2 {
		width: 100%;
		max-width: 100%;

		margin: 7px 0 0;

		font-size: clamp(1.45rem, 8vw, 2.15rem);
		line-height: 1.05;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.entry-card h2 a {
		max-width: 100%;

		color: inherit;
		text-decoration: none;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.entry-card h2 a:hover {
		color: var(--tecspa-accent);
	}

	/* -----------------------------------------------------
	   PIN
	   ----------------------------------------------------- */

	.pin-button {
		width: 42px;
		height: 42px;

		flex: 0 0 42px;

		box-sizing: border-box;

		display: flex;
		align-items: center;
		justify-content: center;

		padding: 0;

		border: 1px solid var(--tecspa-border);
		border-radius: 50%;

		background: var(--tecspa-surface);

		color: var(--tecspa-text-muted);

		font-size: 1rem;

		cursor: pointer;
	}

	.pin-button.pinned {
		border-color: var(--tecspa-accent);

		color: var(--tecspa-accent);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 10%,
				var(--tecspa-surface)
			);
	}

	/* -----------------------------------------------------
	   TAGS
	   ----------------------------------------------------- */

	.tags {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-wrap: wrap;

		gap: 5px;

		margin-top: 11px;
	}

	.tags span {
		max-width: 100%;

		padding: 4px 7px;

		border: 1px solid var(--tecspa-border);
		border-radius: 999px;

		color: var(--tecspa-text-muted);

		font-size: 0.6rem;
		line-height: 1.3;

		overflow-wrap: anywhere;
	}

	/* -----------------------------------------------------
	   PREVIEW
	   ----------------------------------------------------- */

	.entry-preview {
		width: 100%;
		max-width: 100%;

		margin: 13px 0 0;

		color: var(--tecspa-text-muted);

		font-size: 0.8rem;
		line-height: 1.65;

		overflow-wrap: anywhere;
		word-break: break-word;

		white-space: normal;
	}

	/* -----------------------------------------------------
	   READ LINK
	   ----------------------------------------------------- */

	.read-link {
		display: inline-flex;
		align-items: center;

		min-height: 42px;

		margin-top: 12px;

		padding: 7px 0;

		color: var(--tecspa-accent-dark);

		font-size: 0.72rem;
		font-weight: 800;

		text-decoration: none;
	}

	.read-link:hover {
		color: var(--tecspa-accent);
	}

	/* -----------------------------------------------------
	   EMPTY STATE
	   ----------------------------------------------------- */

	.empty-state {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding: 34px 16px;

		text-align: center;

		overflow: hidden;
	}

	.empty-state h2 {
		max-width: 100%;

		font-size: 1.65rem;
		line-height: 1.1;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.empty-state p {
		max-width: 100%;

		font-size: 0.8rem;
		line-height: 1.6;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.empty-state .secondary-button {
		width: 100%;
		min-height: 46px;

		box-sizing: border-box;

		margin-top: 12px;
	}

	.empty-symbol {
		font-size: 2.5rem;
	}

	/* -----------------------------------------------------
	   HARD OVERFLOW SAFETY
	   ----------------------------------------------------- */

	.background *,
	.background *::before,
	.background *::after {
		min-width: 0;
		max-width: 100%;
	}

	.background img,
	.background textarea,
	.background input,
	.background button {
		max-width: 100%;
	}
}


/* =========================================================
   SMALL PHONE
   ========================================================= */

@media (max-width: 420px) {
	.background {
		padding-left: 4px;
		padding-right: 4px;
	}

	.page {
		padding-left: 10px;
		padding-right: 10px;
	}

	.entry-card {
		padding: 14px 12px;
	}

	.entry-card h2 {
		font-size: clamp(1.35rem, 8.5vw, 1.9rem);
	}

	.entry-preview {
		font-size: 0.77rem;
	}

	.pin-button {
		width: 40px;
		height: 40px;

		flex-basis: 40px;
	}
}


/* =========================================================
   VERY SMALL PHONE
   ========================================================= */

@media (max-width: 350px) {
	.page {
		padding-left: 8px;
		padding-right: 8px;
	}

	.top-navigation a {
		font-size: 0.65rem;
	}

	.filters {
		gap: 3px;
	}

	.filters button {
		font-size: 0.65rem;
	}

	.entry-card {
		padding: 12px 10px;
	}

	.entry-card-top {
		gap: 7px;
	}

	.pin-button {
		width: 38px;
		height: 38px;

		flex-basis: 38px;
	}
}

</style>