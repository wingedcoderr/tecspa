<script lang="ts">
	import { onMount } from 'svelte';

	import type { Member } from '$lib/data/members';
	import type { JournalEntry } from '$lib/data/activity';

	import { page } from '$app/state';

	import Markdown from '$lib/components/Markdown.svelte';

import { getDataAdapter } from '$lib/db/data-adapter';

let entry = $state<JournalEntry | null>(null);
let members = $state<Member[]>([]);

let loading = $state(true);
let editing = $state(false);
let saving = $state(false);
let deleting = $state(false);

let errorMessage = $state('');

let entryType = $state<'journal' | 'note'>('journal');
let title = $state('');
let body = $state('');
let authorMemberId = $state('');
let tagsText = $state('');

	const entryId = $derived(
		page.params.entry ?? ''
	);

	onMount(() => {
		void loadEntry();
	});

	async function loadEntry() {
	loading = true;
	errorMessage = '';

	try {
		const dataAdapter = getDataAdapter();

		const [loadedEntry, loadedMembers] =
			await Promise.all([
				dataAdapter.getJournalEntryById(entryId),
				dataAdapter.getMembers()
			]);

		entry = loadedEntry;
		members = loadedMembers;

		if (!entry) {
			errorMessage =
				'This journal entry could not be found.';

			return;
		}

		startEditingValues(entry);
	} catch (error) {
		console.error(
			'Failed to load journal entry:',
			error
		);

		errorMessage =
			error instanceof Error
				? error.message
				: 'Could not load the entry.';
	} finally {
		loading = false;
	}
	}
function startEditingValues(
	value: JournalEntry
) {
	entryType = value.entryType;
	title = value.title;
	body = value.body;
	authorMemberId =
		value.authorMemberId ?? '';
	tagsText = value.tags.join(', ');
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

async function saveChanges() {
	if (!entry || !body.trim()) {
		errorMessage =
			'The entry body cannot be empty.';

		return;
	}

	saving = true;
	errorMessage = '';

	try {
		const tags = tagsText
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean);

		const dataAdapter = getDataAdapter();

		const updatedEntry =
			await dataAdapter.updateJournalEntry(
				entry.id,
				{
					authorMemberId:
						authorMemberId || null,

					entryType,

					title: title.trim(),

					body: body.trim(),

					tags,

					isPinned: entry.isPinned
				}
			);

		entry = updatedEntry;

		editing = false;
	} catch (error) {
		console.error(
			'Failed to update journal entry:',
			error
		);

		errorMessage =
			error instanceof Error
				? error.message
				: 'Could not save the entry.';
	} finally {
		saving = false;
	}
}

async function togglePinned() {
	if (!entry) {
		return;
	}

	try {
		const dataAdapter = getDataAdapter();

		const updatedEntry =
			await dataAdapter.setJournalEntryPinned(
				entry.id,
				!entry.isPinned
			);

		entry = updatedEntry;
	} catch (error) {
		console.error(
			'Failed to update pin:',
			error
		);

		errorMessage =
			error instanceof Error
				? error.message
				: 'Could not update the pin.';
	}
}

async function removeEntry() {
	if (!entry || deleting) {
		return;
	}

	const confirmed =
		window.confirm(
			'Delete this journal entry? This cannot be undone.'
		);

	if (!confirmed) {
		return;
	}

	deleting = true;
	errorMessage = '';

	try {
		const dataAdapter = getDataAdapter();

		await dataAdapter.deleteJournalEntry(
			entry.id
		);

		window.location.href = '/journal';
	} catch (error) {
		console.error(
			'Failed to delete journal entry:',
			error
		);

		errorMessage =
			error instanceof Error
				? error.message
				: 'Could not delete the entry.';
	} finally {
		deleting = false;
	}
}
</script>

<svelte:head>
	<title>
		{entry?.title || 'Journal Entry'} · TECSPA™
	</title>
</svelte:head>

<div class="background">
	<main class="page">
		<nav class="top-navigation">
			<a href="/journal">
				← back to journal
			</a>

			<a href="/">
				home
			</a>
		</nav>

		{#if loading}
			<section class="empty-state">
				<p>loading entry...</p>
			</section>
		{:else if !entry}
			<section class="empty-state">
				<div class="empty-symbol">♡</div>

				<h1>entry not found</h1>

				<p>{errorMessage}</p>

				<a
					class="secondary-button"
					href="/journal"
				>
					back to journal
				</a>
			</section>
		{:else}
			<header class="entry-header">
				<div class="entry-meta">
					<span class="entry-type">
						{entry.entryType}
					</span>

					<span>·</span>

					<span>
						{memberName(
							entry.authorMemberId
						)}
					</span>

					<span>·</span>

					<span>
						{formatDate(entry.createdAt)}
					</span>

					{#if entry.updatedAt !== entry.createdAt}
						<span>·</span>

						<span>
							updated
							{formatDate(
								entry.updatedAt
							)}
						</span>
					{/if}
				</div>

				<h1>
					{entry.title ||
						'untitled entry'}
				</h1>

				{#if entry.tags.length > 0}
					<div class="tags">
						{#each entry.tags as tag}
							<span>#{tag}</span>
						{/each}
					</div>
				{/if}
			</header>

			<div class="entry-actions">
				<button
					type="button"
					onclick={() => {
						void togglePinned();
					}}
				>
					{entry.isPinned
						? '★ unpin'
						: '☆ pin'}
				</button>

				<button
					type="button"
					onclick={() => {
						editing = !editing;

						if (!editing && entry) {
							startEditingValues(entry);
						}
					}}
				>
					{editing ? 'cancel edit' : 'edit'}
				</button>

				<button
					class="danger-button"
					type="button"
					disabled={deleting}
					onclick={() => {
						void removeEntry();
					}}
				>
					{deleting
						? 'deleting...'
						: 'delete'}
				</button>
			</div>

			{#if errorMessage}
				<div class="error-message">
					{errorMessage}
				</div>
			{/if}

			{#if editing}
				<form
					class="edit-form"
					onsubmit={(event) => {
						event.preventDefault();
						void saveChanges();
					}}
				>
					<label>
						<span>type</span>

						<select bind:value={entryType}>
							<option value="journal">
								journal
							</option>

							<option value="note">
								note
							</option>
						</select>
					</label>

					<label>
						<span>author</span>

						<select
							bind:value={authorMemberId}
						>
							<option value="">
								system / everyone
							</option>

							{#each members as member}
								<option value={member.id}>
									{member.name}
								</option>
							{/each}
						</select>
					</label>

					<label>
						<span>title</span>

						<input
							type="text"
							bind:value={title}
						/>
					</label>

					<label>
						<span>tags</span>

						<input
							type="text"
							bind:value={tagsText}
						/>
					</label>

					<label class="body-field">
						<span>body · Markdown supported</span>

						<textarea
							bind:value={body}
							rows="18"
						></textarea>
					</label>

					<button
						class="save-button"
						type="submit"
						disabled={
							saving ||
							!body.trim()
						}
					>
						{saving
							? 'saving...'
							: 'save changes'}
					</button>
				</form>
			{:else}
				<article class="entry-body">
					<Markdown
						content={entry.body}
					/>
				</article>
			{/if}
		{/if}
	</main>
</div>

<style>
	.background {
		min-height: 100vh;
		padding: 2rem 1rem 4rem;
	}

	.page {
		width: min(
			var(--tecspa-panel-width),
			100%
		);

		margin: 0 auto;
		padding: 2rem;

		background:
			var(--tecspa-surface);

		border:
			1px solid
			var(--tecspa-border);

		border-radius:
			var(--tecspa-panel-radius);

		box-shadow:
			var(--tecspa-panel-shadow);
	}

	.top-navigation {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;

		font-size: 0.78rem;
	}

	.top-navigation a {
		color: var(--tecspa-text-muted);
		text-decoration: none;
	}

	.top-navigation a:hover {
		color: var(--tecspa-accent);
	}

	.entry-header {
		padding-bottom: 1.3rem;

		border-bottom:
			1px solid
			var(--tecspa-border);
	}

	.entry-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;

		color: var(--tecspa-text-muted);
		font-size: 0.75rem;
	}

	.entry-type {
		color: var(--tecspa-accent);
		font-weight: 700;
		text-transform: uppercase;
	}

	.entry-header h1 {
		margin: 0.55rem 0 0;

		color: var(--tecspa-text);
		font-family: var(--tecspa-heading-font);
		font-size: clamp(
			1.8rem,
			5vw,
			3rem
		);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.9rem;
	}

	.tags span {
		padding:
			0.2rem
			0.5rem;

		border-radius: 999px;

		color: var(--tecspa-accent-dark);
		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 8%,
				var(--tecspa-surface)
			);

		font-size: 0.72rem;
	}

	.entry-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 1rem 0;
	}

	.entry-actions button,
	.save-button {
		padding:
			0.55rem
			0.8rem;

		border:
			1px solid
			var(--tecspa-border);

		border-radius:
			var(--tecspa-panel-radius);

		color: var(--tecspa-accent-dark);
		background: var(--tecspa-surface);

		font: inherit;
		font-size: 0.8rem;
		font-weight: 700;

		cursor: pointer;
	}

	.entry-actions button:hover,
	.save-button:hover {
		border-color: var(--tecspa-accent);
	}

	.entry-actions .danger-button {
		color: #9b244f;
	}

	.error-message {
		margin: 1rem 0;
		padding: 0.8rem 1rem;

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
	}

	.entry-body {
		padding-top: 1rem;
	}

	.edit-form {
		display: grid;
		grid-template-columns:
			repeat(2, minmax(0, 1fr));

		gap: 1rem;

		margin-top: 1rem;
	}

	.edit-form label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.edit-form label span {
		color: var(--tecspa-text-muted);
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.edit-form input,
	.edit-form select,
	.edit-form textarea {
		width: 100%;
		box-sizing: border-box;

		padding: 0.7rem 0.8rem;

		border:
			1px solid
			var(--tecspa-border);

		border-radius:
			var(--tecspa-panel-radius);

		color: var(--tecspa-text);
		background: var(--tecspa-surface);

		font: inherit;
	}

	.body-field {
		grid-column: 1 / -1;
	}

	.body-field textarea {
		min-height: 360px;
		resize: vertical;
		line-height: 1.65;
	}

	.save-button {
		grid-column: 1 / -1;

		justify-self: start;

		color: white;
		background: var(--tecspa-accent);
		border-color: var(--tecspa-accent);
	}

	.empty-state {
		padding: 4rem 1rem;
		text-align: center;
	}

	.empty-state h1 {
		margin: 0;

		font-family: var(--tecspa-heading-font);
	}

	.empty-state p {
		color: var(--tecspa-text-muted);
	}

	.empty-symbol {
		color: var(--tecspa-accent);
		font-size: 2rem;
	}

	.secondary-button {
		display: inline-flex;

		padding:
			0.65rem
			1rem;

		border:
			1px solid
			var(--tecspa-border);

		border-radius:
			var(--tecspa-panel-radius);

		color: var(--tecspa-accent-dark);
		text-decoration: none;
	}

	@media (max-width: 680px) {
		.background {
			padding: 1rem 0.5rem 3rem;
		}

		.page {
			padding: 1.2rem;
		}

		.edit-form {
			grid-template-columns: 1fr;
		}

		.body-field {
			grid-column: auto;
		}
	}
</style>