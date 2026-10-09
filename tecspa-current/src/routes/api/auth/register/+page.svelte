<script lang="ts">
	import { goto } from '$app/navigation';

	let email = '';
	let username = '';
	let password = '';
	let confirmPassword = '';

	let loading = false;
	let error = '';

	async function register() {
		error = '';

		if (!email.trim()) {
			error = 'Please enter your email address.';
			return;
		}

		if (!username.trim()) {
			error = 'Please choose a username.';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters long.';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email,
					username,
					password
				})
			});

			const data = await response.json();

			if (!response.ok) {
				error =
					typeof data.error === 'string'
						? data.error
						: 'Unable to create the account.';
				return;
			}

			await goto('/account');
		} catch {
			error = 'Unable to connect to TECSPA.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Create Account · TECSPA</title>
	<meta
		name="description"
		content="Create a TECSPA account."
	/>
</svelte:head>

<div class="auth-page">
	<div class="auth-shell">
		<div class="auth-header">
			<div class="brand-mark">T</div>

			<div>
				<p class="eyebrow">TECSPA</p>
				<h1>Create your account</h1>
				<p class="subtitle">
					Set up your account to access TECSPA.
				</p>
			</div>
		</div>

		<form class="auth-card" on:submit|preventDefault={register}>
			<div class="field">
				<label for="email">Email</label>

				<input
					id="email"
					type="email"
					bind:value={email}
					autocomplete="email"
					placeholder="you@example.com"
					disabled={loading}
					required
				/>
			</div>

			<div class="field">
				<label for="username">Username</label>

				<input
					id="username"
					type="text"
					bind:value={username}
					autocomplete="username"
					placeholder="your_username"
					maxlength="32"
					disabled={loading}
					required
				/>

				<p class="hint">
					3–32 characters · letters, numbers, and underscores
				</p>
			</div>

			<div class="field">
				<label for="password">Password</label>

				<input
					id="password"
					type="password"
					bind:value={password}
					autocomplete="new-password"
					placeholder="At least 8 characters"
					disabled={loading}
					required
				/>
			</div>

			<div class="field">
				<label for="confirm-password">Confirm password</label>

				<input
					id="confirm-password"
					type="password"
					bind:value={confirmPassword}
					autocomplete="new-password"
					placeholder="Enter your password again"
					disabled={loading}
					required
				/>
			</div>

			{#if error}
				<div class="error" role="alert">
					<span>!</span>
					{error}
				</div>
			{/if}

			<button
				class="primary-button"
				type="submit"
				disabled={loading}
			>
				{loading ? 'Creating account…' : 'Create account'}
			</button>

			<p class="switch-auth">
				Already have an account?
				<a href="/login">Sign in</a>
			</p>
		</form>

		<a class="back-link" href="/">
			← Back to TECSPA
		</a>
	</div>
</div>

<style>
	.auth-page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 32px 20px;
		background:
			radial-gradient(
				circle at 20% 20%,
				rgba(255, 255, 255, 0.08),
				transparent 32%
			),
			var(--tecspa-bg, #eef2f7);
		color: var(--tecspa-text, #17202a);
		box-sizing: border-box;
	}

	.auth-shell {
		width: min(100%, 480px);
	}

	.auth-header {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 22px;
	}

	.brand-mark {
		width: 52px;
		height: 52px;
		display: grid;
		place-items: center;
		flex: 0 0 auto;
		border: 1px solid var(--tecspa-accent, #4d8fc7);
		border-radius: 14px;
		background: var(--tecspa-panel, #ffffff);
		color: var(--tecspa-accent-dark, #075cae);
		font-size: 1.35rem;
		font-weight: 800;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
	}

	.eyebrow {
		margin: 0 0 3px;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		opacity: 0.65;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.55rem, 5vw, 2rem);
		line-height: 1.1;
	}

	.subtitle {
		margin: 7px 0 0;
		opacity: 0.7;
		font-size: 0.92rem;
		line-height: 1.45;
	}

	.auth-card {
		padding: 26px;
		border: 1px solid var(--tecspa-border, rgba(0, 0, 0, 0.14));
		border-radius: 18px;
		background: var(--tecspa-panel, #ffffff);
		box-shadow: 0 18px 50px rgba(0, 0, 0, 0.09);
	}

	.field {
		margin-bottom: 18px;
	}

	label {
		display: block;
		margin-bottom: 7px;
		font-size: 0.86rem;
		font-weight: 700;
	}

	input {
		width: 100%;
		box-sizing: border-box;
		padding: 12px 13px;
		border: 1px solid var(--tecspa-border, rgba(0, 0, 0, 0.18));
		border-radius: 10px;
		background: var(--tecspa-input-bg, var(--tecspa-panel, #ffffff));
		color: var(--tecspa-text, #17202a);
		font: inherit;
		outline: none;
		transition:
			border-color 140ms ease,
			box-shadow 140ms ease;
	}

	input:focus {
		border-color: var(--tecspa-accent, #4d8fc7);
		box-shadow:
			0 0 0 3px
			color-mix(
				in srgb,
				var(--tecspa-accent, #4d8fc7) 18%,
				transparent
			);
	}

	input:disabled {
		opacity: 0.65;
	}

	.hint {
		margin: 6px 0 0;
		font-size: 0.74rem;
		opacity: 0.58;
	}

	.error {
		display: flex;
		align-items: flex-start;
		gap: 9px;
		margin: 4px 0 16px;
		padding: 11px 12px;
		border: 1px solid rgba(180, 45, 60, 0.35);
		border-radius: 10px;
		background: rgba(180, 45, 60, 0.08);
		color: var(--tecspa-text, #17202a);
		font-size: 0.86rem;
		line-height: 1.4;
	}

	.error span {
		display: grid;
		place-items: center;
		width: 18px;
		height: 18px;
		flex: 0 0 auto;
		border-radius: 50%;
		background: #b42d3c;
		color: white;
		font-size: 0.72rem;
		font-weight: 800;
	}

	.primary-button {
		width: 100%;
		padding: 12px 16px;
		border: 1px solid var(--tecspa-accent, #4d8fc7);
		border-radius: 10px;
		background: var(--tecspa-accent, #4d8fc7);
		color: white;
		font: inherit;
		font-weight: 800;
		cursor: pointer;
		transition:
			transform 140ms ease,
			filter 140ms ease;
	}

	.primary-button:hover:not(:disabled) {
		filter: brightness(1.06);
		transform: translateY(-1px);
	}

	.primary-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.primary-button:disabled {
		cursor: wait;
		opacity: 0.65;
	}

	.switch-auth {
		margin: 18px 0 0;
		text-align: center;
		font-size: 0.86rem;
		opacity: 0.72;
	}

	a {
		color: var(--tecspa-accent-dark, #075cae);
		font-weight: 700;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	.back-link {
		display: block;
		margin-top: 18px;
		text-align: center;
		font-size: 0.84rem;
		opacity: 0.72;
	}

	@media (max-width: 520px) {
		.auth-page {
			padding: 20px 14px;
		}

		.auth-card {
			padding: 20px;
		}

		.auth-header {
			align-items: flex-start;
		}
	}
</style>