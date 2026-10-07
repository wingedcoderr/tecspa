<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	type Member = {
		id: string;
		name: string | null;
		pronouns: string | null;
		aliases: string | null;
		role: string | null;
		status: string | null;
		about: string | null;
		interests: string | null;
		frontTriggers: string | null;
		isFronting: boolean;
	};

	let systemName = '';
	let ownerUsername = '';
	let members: Member[] = [];
	let errorMessage = '';
	let loading = true;

	onMount(async () => {
		try {
			const response = await fetch(`/api/shared/${page.params.shareId}`);
			const data = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(
					data?.error ?? 'This shared system could not be opened.'
				);
			}

			systemName = data.system.name;
			ownerUsername = data.system.ownerUsername;
			members = data.members ?? [];
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: 'This shared system could not be opened.';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{systemName ? `${systemName} — Shared TECSPA` : 'Shared TECSPA'}</title>
</svelte:head>

<div class="page-shell">
	<nav>
		<a href="/sharing">← sharing</a>
	</nav>

	<header class="page-header">
		<p class="eyebrow">SHARED SYSTEM</p>
		<h1>{systemName || 'shared system'}</h1>
		<p class="subtitle">shared with you by @{ownerUsername}</p>
		<div class="ornament">✦　୨୧　✦</div>
	</header>

	<main>
		{#if loading}
			<section class="panel">
				<p>opening the shared system…</p>
			</section>
		{:else if errorMessage}
			<section class="panel error">
				<h2>access unavailable</h2>
				<p>{errorMessage}</p>
			</section>
		{:else}
			<section class="panel">
				<div class="section-heading">
					<div>
						<p class="eyebrow">MEMBERS</p>
						<h2>shared directory</h2>
					</div>
					<span>{members.length}</span>
				</div>

				<div class="members">
					{#each members as member}
						<article class="member">
							<div>
								<p class="member-name">{member.name ?? 'Private member'}</p>

								{#if member.pronouns}
									<p class="muted">{member.pronouns}</p>
								{/if}

								{#if member.aliases}
									<p><strong>aliases:</strong> {member.aliases}</p>
								{/if}

								{#if member.role}
									<p><strong>role:</strong> {member.role}</p>
								{/if}

								{#if member.status}
									<p><strong>status:</strong> {member.status}</p>
								{/if}

								{#if member.about}
									<p class="detail">{member.about}</p>
								{/if}

								{#if member.interests}
									<p><strong>interests:</strong> {member.interests}</p>
								{/if}

								{#if member.frontTriggers}
									<p><strong>front triggers:</strong> {member.frontTriggers}</p>
								{/if}
							</div>

							{#if member.isFronting}
								<span class="fronting">✦ fronting now</span>
							{/if}
						</article>
					{/each}
				</div>
			</section>
		{/if}
	</main>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		background: var(--tecspa-background);
		color: var(--tecspa-text);
		font-family: var(--tecspa-body-font);
	}

	.page-shell {
		min-height: 100vh;
		padding: 28px 20px 48px;
	}

	nav {
		max-width: 920px;
		margin: 0 auto 26px;
	}

	nav a {
		color: var(--tecspa-text-muted);
		text-decoration: none;
	}

	.page-header,
	.panel {
		max-width: 920px;
		margin: 0 auto 22px;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background: var(--tecspa-surface);
		box-shadow: var(--tecspa-panel-shadow);
	}

	.page-header {
		padding: 38px 26px 32px;
		text-align: center;
	}

	.panel {
		padding: 22px;
	}

	.eyebrow {
		margin: 0 0 7px;
		color: var(--tecspa-accent);
		font-family: var(--tecspa-heading-font);
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0 0 8px;
		font-family: var(--tecspa-heading-font);
		font-size: clamp(2.4rem, 7vw, 4rem);
		font-style: italic;
		color: var(--tecspa-accent-dark);
	}

	h2 {
		margin: 0;
		font-family: var(--tecspa-heading-font);
		color: var(--tecspa-accent-dark);
	}

	.subtitle,
	.muted {
		color: var(--tecspa-text-muted);
	}

	.ornament {
		margin-top: 16px;
		color: var(--tecspa-accent);
	}

	.section-heading {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		align-items: center;
		margin-bottom: 16px;
	}

	.section-heading > span {
		padding: 5px 9px;
		border: 1px solid var(--tecspa-border);
		border-radius: 999px;
		color: var(--tecspa-text-muted);
	}

	.members {
		display: grid;
		gap: 12px;
	}

	.member {
		display: flex;
		justify-content: space-between;
		gap: 18px;
		padding: 16px;
		border: 1px solid var(--tecspa-border);
		border-radius: calc(var(--tecspa-panel-radius) * 0.65);
		background: var(--tecspa-surface-alt);
	}

	.member p {
		margin: 5px 0;
		line-height: 1.55;
	}

	.member-name {
		font-family: var(--tecspa-heading-font);
		font-size: 1.35rem;
		color: var(--tecspa-accent-dark);
	}

	.detail {
		white-space: pre-wrap;
	}

	.fronting {
		flex-shrink: 0;
		color: var(--tecspa-accent);
		font-weight: 700;
	}

	.error {
		border-color: var(--tecspa-accent);
	}

	@media (max-width: 650px) {
		.page-shell {
			padding-inline: 12px;
		}

		.page-header,
		.panel {
			padding: 18px;
		}

		.member {
			flex-direction: column;
		}
	}
</style>
