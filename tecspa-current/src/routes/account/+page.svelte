<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { clearMasterKey } from '$lib/crypto/session';

	interface Account {
		id: string;
		username: string;
	}

	let account: Account | null = null;
	let loading = true;
	let loggingOut = false;
	let error = '';

	onMount(async () => {
		try {
			const response = await fetch('/api/auth/session');

			const data = await response.json();

			if (!response.ok || !data.account) {
				await goto('/login');
				return;
			}

			account = data.account;
		} catch {
			error = 'Unable to load your account.';
		} finally {
			loading = false;
		}
	});

	async function logout() {
		loggingOut = true;
		error = '';

		try {
			const response = await fetch('/api/auth/logout', {
				method: 'POST'
			});

			if (!response.ok) {
				throw new Error('Logout failed');
			}

			clearMasterKey();
			await goto('/login');
		} catch {
			error = 'Unable to sign out.';
			loggingOut = false;
		}
	}
</script>

<svelte:head>
	<title>Account · TECSPA</title>
	<meta
		name="description"
		content="Your TECSPA account."
	/>
</svelte:head>

{#if loading}
	<div class="account-page">
		<div class="loading-card">
			<div class="spinner"></div>
			<p>Loading account…</p>
		</div>
	</div>
{:else if account}
	<div class="account-page">
		<div class="account-shell">
			<header class="account-header">
				<div>
					<p class="eyebrow">TECSPA ACCOUNT</p>
					<h1>Welcome, {account.username}</h1>
					<p class="subtitle">
						Your TECSPA account is active.
					</p>
				</div>

				<a class="home-link" href="/">
					← TECSPA
				</a>
			</header>

			<section class="account-card">
				<div class="avatar">
					{account.username.slice(0, 1).toUpperCase()}
				</div>

				<div class="identity">
					<span class="label">Username</span>
					<strong>@{account.username}</strong>
				</div>
			</section>

			{#if error}
				<div class="error" role="alert">
					{error}
				</div>
			{/if}

			<div class="actions">
				<a class="secondary-button" href="/">
					Open TECSPA
				</a>

				<button
					class="danger-button"
					type="button"
					on:click={logout}
					disabled={loggingOut}
				>
					{loggingOut ? 'Signing out…' : 'Sign out'}
				</button>
			</div>
		</div>
	</div>
{:else}
	<div class="account-page">
		<div class="loading-card">
			<p>{error || 'Redirecting to login…'}</p>
		</div>
	</div>
{/if}

<style>
	.account-page {
		min-height: 100vh;
		box-sizing: border-box;
		padding: 32px 20px;
		background:
			radial-gradient(
				circle at 80% 15%,
				rgba(255, 255, 255, 0.08),
				transparent 30%
			),
			var(--tecspa-bg, #eef2f7);
		color: var(--tecspa-text, #17202a);
	}

	.account-shell {
		width: min(100%, 760px);
		margin: 0 auto;
	}

	.account-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 20px;
		margin-bottom: 24px;
	}

	.eyebrow {
		margin: 0 0 6px;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		opacity: 0.6;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.7rem, 5vw, 2.5rem);
		line-height: 1.1;
	}

	.subtitle {
		margin: 8px 0 0;
		opacity: 0.68;
	}

	.home-link {
		flex: 0 0 auto;
		padding: 9px 12px;
		border: 1px solid var(--tecspa-border, rgba(0, 0, 0, 0.14));
		border-radius: 9px;
		background: var(--tecspa-panel, white);
		font-size: 0.84rem;
	}

	a {
		color: var(--tecspa-accent-dark, #075cae);
		text-decoration: none;
		font-weight: 700;
	}

	a:hover {
		text-decoration: underline;
	}

	.account-card {
		display: flex;
		align-items: center;
		gap: 18px;
		padding: 24px;
		border: 1px solid var(--tecspa-border, rgba(0, 0, 0, 0.14));
		border-radius: 18px;
		background: var(--tecspa-panel, white);
		box-shadow: 0 18px 50px rgba(0, 0, 0, 0.08);
	}

	.avatar {
		width: 64px;
		height: 64px;
		display: grid;
		place-items: center;
		flex: 0 0 auto;
		border-radius: 16px;
		background: var(--tecspa-accent, #4d8fc7);
		color: white;
		font-size: 1.45rem;
		font-weight: 800;
	}

	.identity {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.label {
		font-size: 0.76rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.55;
	}

	.identity strong {
		font-size: 1.15rem;
	}

	.actions {
		display: flex;
		gap: 12px;
		margin-top: 18px;
	}

	.secondary-button,
	.danger-button {
		padding: 11px 16px;
		border-radius: 10px;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.secondary-button {
		border: 1px solid var(--tecspa-accent, #4d8fc7);
		background: var(--tecspa-accent, #4d8fc7);
		color: white;
	}

	.danger-button {
		border: 1px solid rgba(180, 45, 60, 0.35);
		background: rgba(180, 45, 60, 0.08);
		color: var(--tecspa-text, #17202a);
	}

	.danger-button:hover:not(:disabled) {
		background: rgba(180, 45, 60, 0.14);
	}

	button:disabled {
		cursor: wait;
		opacity: 0.6;
	}

	.error {
		margin-top: 16px;
		padding: 11px 12px;
		border: 1px solid rgba(180, 45, 60, 0.35);
		border-radius: 10px;
		background: rgba(180, 45, 60, 0.08);
		font-size: 0.86rem;
	}

	.loading-card {
		width: min(100%, 420px);
		margin: 20vh auto 0;
		padding: 24px;
		box-sizing: border-box;
		text-align: center;
		border: 1px solid var(--tecspa-border, rgba(0, 0, 0, 0.14));
		border-radius: 16px;
		background: var(--tecspa-panel, white);
	}

	.loading-card p {
		margin: 0;
		opacity: 0.7;
	}

	.spinner {
		width: 24px;
		height: 24px;
		margin: 0 auto 12px;
		border: 3px solid
			color-mix(
				in srgb,
				var(--tecspa-accent, #4d8fc7) 20%,
				transparent
			);
		border-top-color: var(--tecspa-accent, #4d8fc7);
		border-radius: 50%;
		animation: spin 700ms linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 600px) {
		.account-page {
			padding: 20px 14px;
		}

		.account-header {
			flex-direction: column;
		}

		.actions {
			flex-direction: column;
		}

		.secondary-button,
		.danger-button {
			width: 100%;
			box-sizing: border-box;
			text-align: center;
		}
	}
</style>