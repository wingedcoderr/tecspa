<script lang="ts">
	import { onMount } from 'svelte';

	import type { Member } from '$lib/data/members';

	import { getDataAdapter } from '$lib/db/data-adapter';

	let members: Member[] = [];

	let entryType: 'journal' | 'note' = 'journal';
	let title = '';
	let body = '';
	let authorMemberId = '';
	let tagsText = '';

	let saving = false;
	let errorMessage = '';

	onMount(() => {
		void loadMembers();
	});

	async function loadMembers() {
	try {
		const dataAdapter = getDataAdapter();

		members = await dataAdapter.getMembers();
	} catch (error) {
		console.error(
			'Failed to load members:',
			error
		);

		errorMessage =
			error instanceof Error
				? error.message
				: 'Could not load members.';
	}
}

		async function saveEntry() {
		if (!body.trim()) {
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

			const entry =
				await dataAdapter.createJournalEntry({
					authorMemberId:
						authorMemberId || null,

					entryType,

					title: title.trim(),

					body: body.trim(),

					tags,

					isPinned: false
				});

			window.location.href =
				`/journal/${entry.id}`;
		} catch (error) {
			console.error(
				'Failed to create journal entry:',
				error
			);

			errorMessage =
				error instanceof Error
					? error.message
					: 'Could not create the entry.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>New Entry · TECSPA™</title>
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

		<header class="page-header">
			<p class="eyebrow">
				TECSPA™ · journal
			</p>

			<h1>write something</h1>

			<p class="subtitle">
				Keep a journal entry or a general note.
			</p>
		</header>

		<div class="divider">
			<span>♡</span>
			<span>─────</span>
			<span>✦</span>
			<span>─────</span>
			<span>♡</span>
		</div>

		{#if errorMessage}
			<div class="error-message">
				{errorMessage}
			</div>
		{/if}

		<form
			class="entry-form"
			onsubmit={(event) => {
				event.preventDefault();
				void saveEntry();
			}}
		>
			<section class="form-section">
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

					<select bind:value={authorMemberId}>
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
						placeholder="Give this entry a title..."
					/>
				</label>

				<label>
					<span>tags</span>

					<input
						type="text"
						bind:value={tagsText}
						placeholder="comma, separated, tags"
					/>
				</label>
			</section>

			<section class="body-section">
				<div class="body-heading">
					<div>
						<p class="eyebrow">
							✧ content
						</p>

						<h2>what's on your mind?</h2>
					</div>

					<span>Markdown supported</span>
				</div>

				<textarea
					bind:value={body}
					rows="18"
					placeholder="Write your entry here...

Markdown works too:
**bold**
*italic*
[links](https://example.com)
![images](https://example.com/image.png)"
				></textarea>

				<p class="markdown-hint">
					Markdown is supported, including remote
					images.
				</p>
			</section>

			<div class="form-actions">
				<a
					class="secondary-button"
					href="/journal"
				>
					cancel
				</a>

				<button
					class="primary-button"
					type="submit"
					disabled={
						saving ||
						!body.trim()
					}
				>
					{saving
						? 'saving...'
						: 'save entry'}
				</button>
			</div>
		</form>
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
		flex-wrap: wrap;
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

	.page-header {
		text-align: center;
	}

	.eyebrow {
		margin: 0 0 0.4rem;

		color: var(--tecspa-accent);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;

		color: var(--tecspa-text);
		font-family: var(--tecspa-heading-font);
	}

	.subtitle {
		margin: 0.65rem auto 0;

		color: var(--tecspa-text-muted);
	}

	.divider {
		display: flex;
		justify-content: center;
		gap: 0.7rem;
		margin: 1.8rem 0;

		color: var(--tecspa-accent);
	}

	.error-message {
		margin-bottom: 1rem;
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

	.entry-form {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}

	.form-section {
		display: grid;
		grid-template-columns:
			repeat(2, minmax(0, 1fr));

		gap: 1rem;

		padding: 1.2rem;

		border:
			1px solid
			var(--tecspa-border);

		border-radius:
			var(--tecspa-panel-radius);
	}

	.form-section label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.form-section label span {
		color: var(--tecspa-text-muted);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	input,
	select,
	textarea {
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

	textarea {
		min-height: 320px;
		resize: vertical;
		line-height: 1.65;
	}

	input:focus,
	select:focus,
	textarea:focus {
		outline: 2px solid
			color-mix(
				in srgb,
				var(--tecspa-accent) 30%,
				transparent
			);

		outline-offset: 1px;
	}

	.body-section {
		padding: 1.2rem;

		border:
			1px solid
			var(--tecspa-border);

		border-radius:
			var(--tecspa-panel-radius);
	}

	.body-heading {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.body-heading h2 {
		margin: 0;
		font-family: var(--tecspa-heading-font);
	}

	.body-heading > span {
		color: var(--tecspa-text-muted);
		font-size: 0.72rem;
	}

	.markdown-hint {
		margin: 0.55rem 0 0;

		color: var(--tecspa-text-muted);
		font-size: 0.75rem;
	}

	.form-actions {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.primary-button,
	.secondary-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		padding:
			0.7rem
			1rem;

		border:
			1px solid
			var(--tecspa-border);

		border-radius:
			var(--tecspa-panel-radius);

		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
	}

	.primary-button {
		color: white;
		background: var(--tecspa-accent);
		border-color: var(--tecspa-accent);
	}

	.secondary-button {
		color: var(--tecspa-accent-dark);
		background: var(--tecspa-surface);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 680px) {
		.background {
			padding: 1rem 0.5rem 3rem;
		}

		.page {
			padding: 1.2rem;
		}

		.form-section {
			grid-template-columns: 1fr;
		}

		.body-heading,
		.form-actions {
			align-items: stretch;
			flex-direction: column;
		}
	}
</style>