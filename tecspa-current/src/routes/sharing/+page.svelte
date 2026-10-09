<script lang="ts">
	import { onMount } from 'svelte';

	type Permissions = {
		viewMembers: boolean;
		viewFronting: boolean;
		viewFrontHistory: boolean;
		viewChat: boolean;
		participateChat: boolean;
		viewJournal: boolean;
		viewPolls: boolean;
	};

	type Share = {
		id: string;
		systemId: string;
		systemName: string;
		recipientAccountId: string;
		recipientUsername: string;
		role: 'viewer' | 'contributor';
		status: 'pending' | 'accepted' | 'revoked';
		permissions: Permissions;
	};

	let outgoing: Share[] = [];
	let incoming: Share[] = [];
	let username = '';
	let role: 'viewer' | 'contributor' = 'viewer';
	let permissions: Permissions = {
		viewMembers: true,
		viewFronting: true,
		viewFrontHistory: false,
		viewChat: false,
		participateChat: false,
		viewJournal: false,
		viewPolls: false
	};
	let loading = true;
	let saving = false;
	let errorMessage = '';
	let successMessage = '';

	async function loadSharing() {
		loading = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/sharing');
			const data = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(
					data?.error ?? 'Sharing settings could not be loaded.'
				);
			}

			outgoing = data.outgoing ?? [];
			incoming = data.incoming ?? [];
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: 'Sharing settings could not be loaded.';
		} finally {
			loading = false;
		}
	}

	async function addShare() {
		if (!username.trim() || saving) {
			return;
		}

		saving = true;
		errorMessage = '';
		successMessage = '';

		try {
			const response = await fetch('/api/sharing', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username,
					role,
					permissions
				})
			});

			const data = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(
					data?.error ?? 'The sharing invitation could not be created.'
				);
			}

			username = '';
			successMessage = 'Invitation sent.';
			await loadSharing();
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: 'The sharing invitation could not be created.';
		} finally {
			saving = false;
		}
	}

	async function acceptShare(id: string) {
		errorMessage = '';
		successMessage = '';

		try {
			const response = await fetch(`/api/sharing/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ action: 'accept' })
			});

			const data = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(data?.error ?? 'The invitation could not be accepted.');
			}

			successMessage = 'Invitation accepted.';
			await loadSharing();
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: 'The invitation could not be accepted.';
		}
	}

	async function revokeShare(id: string) {
		errorMessage = '';
		successMessage = '';

		try {
			const response = await fetch(`/api/sharing/${id}`, {
				method: 'DELETE'
			});

			const data = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(data?.error ?? 'The share could not be revoked.');
			}

			successMessage = 'Access revoked.';
			await loadSharing();
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: 'The share could not be revoked.';
		}
	}

	async function updateShare(share: Share) {
		errorMessage = '';
		successMessage = '';

		try {
			const response = await fetch(`/api/sharing/${share.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					role: share.role,
					permissions: share.permissions
				})
			});

			const data = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(data?.error ?? 'The sharing settings could not be updated.');
			}

			successMessage = `Updated access for @${share.recipientUsername}.`;
			await loadSharing();
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: 'The sharing settings could not be updated.';
		}
	}

	function permissionLabel(key: keyof Permissions): string {
		return {
			viewMembers: 'Member profiles',
			viewFronting: 'Current fronting',
			viewFrontHistory: 'Front history',
			viewChat: 'Chat',
			participateChat: 'Send chat messages',
			viewJournal: 'Journal',
			viewPolls: 'Polls'
		}[key];
	}

	onMount(loadSharing);
</script>

<svelte:head>
	<title>Sharing — TECSPA™</title>
	<meta
		name="description"
		content="Control who can see your TECSPA system and what they can access."
	/>
</svelte:head>

<div class="page-shell">
	<nav class="top-navigation">
		<a href="/account">← account</a>
		<a href="/members">members</a>
		<a href="/customize">customize</a>
	</nav>

	<header class="page-header">
		<p class="eyebrow">TECSPA™ · PRIVACY</p>
		<h1>sharing</h1>
		<p class="subtitle">
			Choose exactly who gets access to your system. Sharing is private and
			invite-based.
		</p>
		<div class="ornament">✦　୨୧　✦</div>
	</header>

	<main>
		{#if errorMessage}
			<div class="notice error">{errorMessage}</div>
		{/if}

		{#if successMessage}
			<div class="notice success">{successMessage}</div>
		{/if}

		<section class="panel">
			<div class="panel-heading">
				<div>
					<p class="eyebrow">NEW SHARE</p>
					<h2>invite someone</h2>
					<p>They must have a TECSPA account and accept the invitation.</p>
				</div>
			</div>

			<div class="form-grid">
				<label>
					<span>TECSPA username</span>
					<input
						bind:value={username}
						placeholder="@username"
						autocomplete="off"
					/>
				</label>

				<label>
					<span>Role</span>
					<select bind:value={role}>
						<option value="viewer">Viewer</option>
						<option value="contributor">Contributor</option>
					</select>
				</label>
			</div>

			<div class="permission-grid">
				{#each Object.keys(permissions) as key}
					<label class="permission">
						<input
							type="checkbox"
							bind:checked={permissions[key as keyof Permissions]}
						/>
						<span>{permissionLabel(key as keyof Permissions)}</span>
					</label>
				{/each}
			</div>

			<div class="actions">
				<button class="primary-button" type="button" onclick={addShare} disabled={saving}>
					{saving ? 'sending…' : 'send invitation'}
				</button>
			</div>
		</section>

		<section class="panel">
			<div class="panel-heading">
				<div>
					<p class="eyebrow">YOUR SYSTEM</p>
					<h2>people with access</h2>
					<p>Revoking access immediately disables the shared view.</p>
				</div>
			</div>

			{#if loading}
				<p class="muted">loading sharing settings…</p>
			{:else if outgoing.length === 0}
				<div class="empty">
					<p>no one has access yet.</p>
				</div>
			{:else}
				<div class="share-list">
					{#each outgoing as share}
						<article class="share-card">
							<div class="share-header">
								<div>
									<strong>@{share.recipientUsername}</strong>
									<span class:accepted={share.status === 'accepted'}>
										{share.status}
									</span>
								</div>

								<select bind:value={share.role}>
									<option value="viewer">Viewer</option>
									<option value="contributor">Contributor</option>
								</select>
							</div>

							<div class="permission-grid compact">
								{#each Object.keys(share.permissions) as key}
									<label class="permission">
										<input
											type="checkbox"
											bind:checked={
												share.permissions[key as keyof Permissions]
											}
											disabled={share.status === 'revoked'}
										/>
										<span>{permissionLabel(key as keyof Permissions)}</span>
									</label>
								{/each}
							</div>

							<div class="card-actions">
								{#if share.status !== 'revoked'}
									<button
										class="secondary-button"
										type="button"
										onclick={() => updateShare(share)}
									>
										save permissions
									</button>

									<button
										class="danger-button"
										type="button"
										onclick={() => revokeShare(share.id)}
									>
										revoke
									</button>
								{/if}
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</section>

		<section class="panel">
			<div class="panel-heading">
				<div>
					<p class="eyebrow">INVITATIONS</p>
					<h2>shared with you</h2>
					<p>Accepting an invitation never changes your own system's privacy.</p>
				</div>
			</div>

			{#if incoming.length === 0}
				<div class="empty">
					<p>no pending or accepted invitations.</p>
				</div>
			{:else}
				<div class="share-list">
					{#each incoming as share}
						<article class="share-card">
							<div class="share-header">
								<div>
									<strong>{share.systemName}</strong>
									<span>from @{share.recipientUsername}</span>
								</div>
								<strong>{share.role}</strong>
							</div>

							<p class="muted">
								{share.status === 'pending'
									? 'This system is waiting for your approval.'
									: 'You currently have access.'}
							</p>

							<div class="card-actions">
								{#if share.status === 'pending'}
									<button
										class="primary-button"
										type="button"
										onclick={() => acceptShare(share.id)}
									>
										accept invitation
									</button>
								{:else}
									<a class="secondary-button" href={`/shared/${share.id}`}>
										open shared system
									</a>
								{/if}
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</section>
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

	.top-navigation {
		max-width: 920px;
		margin: 0 auto 26px;
		display: flex;
		gap: 22px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.top-navigation a {
		color: var(--tecspa-text-muted);
		text-decoration: none;
		border-bottom: 1px solid var(--tecspa-border);
		padding-bottom: 4px;
	}

	.top-navigation a:hover {
		color: var(--tecspa-accent);
		border-color: var(--tecspa-accent);
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

	.eyebrow {
		margin: 0 0 7px;
		color: var(--tecspa-accent);
		font-family: var(--tecspa-heading-font);
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	h1,
	h2,
	p {
		margin-top: 0;
	}

	h1 {
		margin-bottom: 8px;
		font-family: var(--tecspa-heading-font);
		font-size: clamp(2.5rem, 7vw, 4rem);
		font-style: italic;
		color: var(--tecspa-accent-dark);
	}

	h2 {
		margin-bottom: 6px;
		font-family: var(--tecspa-heading-font);
		color: var(--tecspa-accent-dark);
	}

	.subtitle,
	.panel-heading p,
	.muted {
		color: var(--tecspa-text-muted);
		line-height: 1.6;
	}

	.ornament {
		margin-top: 16px;
		color: var(--tecspa-accent);
		opacity: var(--tecspa-ornament-opacity);
	}

	.panel {
		padding: 22px;
	}

	.panel-heading {
		margin-bottom: 20px;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 14px;
	}

	label > span,
	.permission span {
		color: var(--tecspa-text);
	}

	label > span {
		display: block;
		margin-bottom: 7px;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	input:not([type='checkbox']),
	select {
		width: 100%;
		padding: 11px 12px;
		border: 1px solid var(--tecspa-border);
		border-radius: calc(var(--tecspa-panel-radius) * 0.55);
		background: var(--tecspa-surface-alt);
		color: var(--tecspa-text);
		font: inherit;
	}

	.permission-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 9px;
		margin-top: 18px;
	}

	.permission {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 10px;
		border: 1px solid var(--tecspa-border);
		border-radius: calc(var(--tecspa-panel-radius) * 0.5);
		background: var(--tecspa-surface-alt);
	}

	.permission input {
		accent-color: var(--tecspa-accent);
	}

	.actions,
	.card-actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		flex-wrap: wrap;
		margin-top: 18px;
	}

	button,
	.secondary-button,
	.danger-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 10px 14px;
		border-radius: calc(var(--tecspa-panel-radius) * 0.55);
		font: inherit;
		cursor: pointer;
		text-decoration: none;
	}

	.primary-button {
		border: 1px solid var(--tecspa-accent);
		background: var(--tecspa-accent);
		color: var(--tecspa-background);
	}

	.secondary-button {
		border: 1px solid var(--tecspa-border);
		background: var(--tecspa-surface-alt);
		color: var(--tecspa-text);
	}

	.danger-button {
		border: 1px solid var(--tecspa-border);
		background: transparent;
		color: var(--tecspa-accent-dark);
	}

	button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.notice {
		max-width: 920px;
		margin: 0 auto 16px;
		padding: 12px 14px;
		border: 1px solid var(--tecspa-border);
		border-radius: calc(var(--tecspa-panel-radius) * 0.6);
		background: var(--tecspa-surface);
	}

	.notice.error {
		border-color: var(--tecspa-accent);
	}

	.notice.success {
		border-color: var(--tecspa-accent);
	}

	.share-list {
		display: grid;
		gap: 12px;
	}

	.share-card {
		padding: 16px;
		border: 1px solid var(--tecspa-border);
		border-radius: calc(var(--tecspa-panel-radius) * 0.65);
		background: var(--tecspa-surface-alt);
	}

	.share-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}

	.share-header strong {
		display: inline-block;
		margin-right: 8px;
		color: var(--tecspa-accent-dark);
	}

	.share-header span {
		color: var(--tecspa-text-muted);
		font-size: 0.78rem;
	}

	.share-header span.accepted {
		color: var(--tecspa-accent);
	}

	.permission-grid.compact {
		margin-top: 12px;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.empty {
		padding: 22px;
		border: 1px dashed var(--tecspa-border);
		color: var(--tecspa-text-muted);
		text-align: center;
	}

	@media (max-width: 680px) {
		.form-grid,
		.permission-grid,
		.permission-grid.compact {
			grid-template-columns: 1fr;
		}

		.page-shell {
			padding-inline: 12px;
		}

		.panel,
		.page-header {
			padding: 18px;
		}
	}
</style>
