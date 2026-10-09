<script lang="ts">
	import { onMount } from 'svelte';
import { getDataAdapter } from '$lib/db/data-adapter';
import { memberImageUrl } from '$lib/media/member-media';
import { isDesktop } from '$lib/platform';
import type { Member } from '$lib/data/members';
import { saveMemberRecord } from '$lib/crypto/vault';
import { hasMasterKey, setMasterKey } from '$lib/crypto/session';
import { unwrapMasterKey, type EncryptedPayload } from '$lib/crypto/e2ee';

	let members: Member[] = [];
	let avatarUrls: Record<string, string> = {};
	let loading = true;
	let errorMessage = '';
	let migrationMessage = '';
	let migrating = false;
	let unlockNeeded = false;
	let unlockPassword = '';
	let unlocking = false;
	let unlockError = '';

	let frontingIds = new Set<string>();

	/**
	 * One-time, client-side migration from the legacy plaintext member API.
	 * Records are encrypted in this browser before they are written to the vault.
	 * The legacy rows are deliberately NOT deleted by this operation.
	 */
	async function unlockEncryption() {
		if (!unlockPassword || unlocking) return;
		unlocking = true;
		unlockError = '';
		try {
			const response = await fetch('/api/crypto/key', { headers: { Accept: 'application/json' } });
			const data = await response.json().catch(() => null);
			if (!response.ok || !data?.initialized || !data.key) {
				throw new Error(data?.error ?? 'Could not retrieve the encrypted account key.');
			}
			const key = await unwrapMasterKey(data.key as EncryptedPayload, unlockPassword);
			setMasterKey(key);
			unlockPassword = '';
			unlockNeeded = false;
			loading = true;
			await loadMemberDirectory();
		} catch (error) {
			console.error('Unable to unlock TECSPA encryption:', error);
			unlockError = 'Unable to unlock encryption. Check your password and try again.';
		} finally {
			unlocking = false;
		}
	}

	async function migrateExistingMembers() {
		if (isDesktop() || migrating) return;
		const confirmed = window.confirm(
			'TECSPA will read your existing member profiles and encrypt copies in the new vault. The old database records will not be deleted. Continue?'
		);
		if (!confirmed) return;

		migrating = true;
		migrationMessage = 'Reading existing member profiles…';
		errorMessage = '';
		try {
			const response = await fetch('/api/members', { headers: { Accept: 'application/json' } });
			const payload = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(payload?.message ?? payload?.error ?? `Could not read existing members (${response.status}).`);
			}
			if (!Array.isArray(payload)) {
				throw new Error('The legacy member endpoint returned an unexpected response. No records were migrated.');
			}
			const legacyMembers = payload as Member[];
			if (legacyMembers.some((member) => !member || typeof member.id !== 'string' || !member.id)) {
				throw new Error('At least one legacy member has an invalid ID. No records were migrated.');
			}
			for (let index = 0; index < legacyMembers.length; index += 1) {
				const member = legacyMembers[index];
				migrationMessage = `Encrypting member ${index + 1} of ${legacyMembers.length}…`;
				await saveMemberRecord(member);
			}
			members = await getDataAdapter().getMembers();
			migrationMessage = legacyMembers.length
				? `Encrypted ${legacyMembers.length} member profile(s). Original database rows were preserved.`
				: 'The legacy database returned no members. No records were changed.';
		} catch (error) {
			console.error('Member vault migration failed:', error);
			migrationMessage = `Migration stopped: ${String(error)}. Original database rows were preserved; any encrypted copies already written remain in the vault.`;
		} finally {
			migrating = false;
		}
	}

$: currentFronters = members.filter((member) => member.isFronting);

async function toggleFronting(member: Member) {
	try {
		const nextValue = !member.isFronting;

		await getDataAdapter().setMemberFronting(member.id, nextValue);

		members = members.map((item) =>
			item.id === member.id
				? { ...item, isFronting: nextValue }
				: item
		);

		frontingIds = new Set(
			members
				.filter((item) => item.isFronting)
				.map((item) => item.id)
		);
	} catch (error) {
		console.error('Failed to update fronting status:', error);
		errorMessage = `Fronting error: ${String(error)}`;
	}
}

	async function loadMemberDirectory() {
	if (!isDesktop() && !hasMasterKey()) {
		unlockNeeded = true;
		loading = false;
		return;
	}
	try {
		members = await getDataAdapter().getMembers();

		const entries = await Promise.all(
			members
				.filter((member) => member.avatar)
				.map(async (member) => {
					const avatar = member.avatar;

					// Web browsers can use normal web/data/asset URLs
					// directly. Desktop-only local media needs Tauri.
					if (
						avatar.startsWith('data:') ||
						avatar.startsWith('http://') ||
						avatar.startsWith('https://') ||
						avatar.startsWith('asset:')
					) {
						return [member.id, avatar] as const;
					}

					if (isDesktop()) {
						return [
							member.id,
							await memberImageUrl(avatar)
						] as const;
					}

					// Web member records store an S3 object key, not a browser URL.
					// Resolve it through the authenticated media endpoint; the legacy
					// row is intentionally retained until media migration is complete.
					return [
						member.id,
						`/api/media/members/${encodeURIComponent(member.id)}/avatar`
					] as const;
				})
		);

		avatarUrls = Object.fromEntries(
			entries.filter(([, url]) => url)
		);
	} catch (error) {
		console.error('Failed to load members:', error);
		errorMessage = `Database error: ${String(error)}`;
	} finally {
		loading = false;
	}
}

	onMount(() => {
		void loadMemberDirectory();
	});
</script>

<svelte:head>
	<title>Members — TECSPA™</title>
	<meta name="description" content="The TECSPA™ member directory." />
</svelte:head>

<div class="page-shell">
	<header class="page-header">
		<div class="ornament top-ornament">✦ ❦ ✦</div>

		<p class="eyebrow">THE SYSTEM DIRECTORY</p>

		<h1>members</h1>

		<p class="subtitle">
			a collection of the people who make up this system
		</p>

		<div class="ornament">୨୧</div>
	</header>

	<nav class="page-navigation">
		<a href="/">← back home</a>
		<a href="/members/new">✦ add member</a>
	</nav>

	<main>
		{#if loading}
			<section class="message-panel">
				<p class="message-symbol">✦</p>
				<h2>opening the directory...</h2>
				<p>
					TECSPA is retrieving the member records from its local
					database.
				</p>
			</section>
		{:else if unlockNeeded}
			<section class="message-panel unlock-panel">
				<p class="message-symbol">🔐</p>
				<h2>unlock your encrypted data</h2>
				<p>Your login session is still active, but a page reload clears the encryption key from memory. Enter your account password to unlock your existing key on this device.</p>
				<form on:submit|preventDefault={unlockEncryption}>
					<label for="encryption-password">Account password</label>
					<input id="encryption-password" type="password" bind:value={unlockPassword} autocomplete="current-password" required disabled={unlocking} />
					<button type="submit" disabled={unlocking}>{unlocking ? 'unlocking…' : 'unlock encryption'}</button>
				</form>
				{#if unlockError}<p role="alert">{unlockError}</p>{/if}
			</section>
		{:else if errorMessage}
			<section class="message-panel error-panel">
				<p class="message-symbol">♡</p>
				<h2>something went wrong</h2>
				<p>{errorMessage}</p>
			</section>
		{:else}
			<section class="directory-intro">
				<p class="section-label">✦ directory ✦</p>

				<p>
					<span class="count">{members.length}</span>
					{members.length === 1 ? 'member' : 'members'}
					in the system
				</p>
			</section>

			{#if currentFronters.length > 0}
	<section class="fronting-panel">
		<div class="fronting-heading">
			<div>
				<p class="section-label">✦ currently fronting ✦</p>
				<h2>who is here right now?</h2>
			</div>

			<span class="fronting-count">
				{currentFronters.length}
				{currentFronters.length === 1 ? 'fronter' : 'fronters'}
			</span>
		</div>

		<div class="fronter-list">
			{#each currentFronters as member}
				<a class="fronter" href={`/members/${member.id}`}>
					<div class="fronter-avatar">
						{#if avatarUrls[member.id]}
							<img
								src={avatarUrls[member.id]}
								alt={`${member.name} profile picture`}
							/>
						{:else}
							<span>✦</span>
						{/if}
					</div>

					<div class="fronter-info">
						<strong>{member.name}</strong>
						<span>{member.pronouns}</span>
					</div>

					<span class="fronter-mark">✦</span>
				</a>
			{/each}
		</div>
	</section>
{/if}

			<div class="divider">
				<span>❦</span>
			</div>

<section class="member-list">
	{#if members.length === 0}
		<div class="empty-state">
			<p>no encrypted members yet.</p>
			{#if !isDesktop()}
				<p>If this system already had member profiles before encrypted storage was enabled, migrate copies into the vault first.</p>
				<button type="button" on:click={migrateExistingMembers} disabled={migrating}>
					{migrating ? 'encrypting profiles…' : 'migrate existing member profiles'}
				</button>
				{#if migrationMessage}<p role="status">{migrationMessage}</p>{/if}
			{/if}
			<a href="/members/new">create a new member →</a>
		</div>
	{:else}
		{#each members as member, index}
			<article class="member-card">
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

				<div class="member-info">
					<p class="member-number">
						{String(index + 1).padStart(2, '0')}
					</p>

					<h2>{member.name}</h2>

					<p class="pronouns">{member.pronouns}</p>


					<div class="member-actions">
						<a
							class="view-profile"
							href={`/members/${member.id}`}
						>
							view profile
							<span>→</span>
						</a>

						<button
							class:fronting-active={member.isFronting}
							class="fronting-button"
							type="button"
							on:click={() => toggleFronting(member)}
							aria-pressed={member.isFronting}
						>
							<span>
								{member.isFronting
									? '✦ fronting now'
									: '♡ set fronting'}
							</span>
						</button>
					</div>
				</div>
			</article>
		{/each}
	{/if}
</section>
		{/if}
	</main>

	<footer>
		<div class="ornament">✦ ❦ ✦</div>
		<p>TECSPA™ · the extremely customizable plural app™</p>
	</footer>
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

	:global(a) {
		color: inherit;
	}

	.page-shell {
		min-height: 100vh;
		padding: 48px 24px 32px;
		background:
			radial-gradient(
				circle at top left,
				color-mix(in srgb, var(--tecspa-accent) 12%, transparent),
				transparent 32%
			),
			radial-gradient(
				circle at bottom right,
				color-mix(in srgb, var(--tecspa-accent) 10%, transparent),
				transparent 35%
			);
	}

	.page-header {
		max-width: 920px;
		margin: 0 auto;
		text-align: center;
		padding: 36px 24px 28px;
		border: 1px solid var(--tecspa-border);
		background: var(--tecspa-surface);
		border-radius: var(--tecspa-panel-radius);
		box-shadow: var(--tecspa-panel-shadow);
		position: relative;
	}

	.page-header::before,
	.page-header::after {
		content: '';
		position: absolute;
		left: 18px;
		right: 18px;
		height: 1px;
		background: var(--tecspa-border);
		opacity: 0.7;
	}

	.page-header::before { top: 14px; }
	.page-header::after { bottom: 14px; }

	.ornament {
		color: var(--tecspa-accent);
		letter-spacing: 0.5em;
		font-size: 0.9rem;
	}

	.top-ornament { margin-bottom: 20px; }

	.eyebrow,
	.section-label,
	.member-number {
		font-size: 0.72rem;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: var(--tecspa-accent);
	}

	h1 {
		margin: 10px 0 8px;
		font-family: var(--tecspa-heading-font);
		font-size: clamp(3rem, 8vw, 5.8rem);
		font-weight: 400;
		font-style: italic;
		line-height: 0.95;
		color: var(--tecspa-accent-dark);
	}

	.subtitle {
		margin: 0 auto 24px;
		max-width: 520px;
		font-size: 0.95rem;
		line-height: 1.7;
		color: var(--tecspa-text-muted);
	}

	.page-navigation {
		max-width: 920px;
		margin: 18px auto 0;
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}

	.page-navigation a,
	.view-profile,
	.empty-link {
		color: var(--tecspa-accent-dark);
		text-decoration: none;
	}

	.page-navigation a {
		padding: 8px 12px;
		border-bottom: 1px solid var(--tecspa-border);
		font-size: 0.85rem;
		letter-spacing: 0.06em;
		transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
	}

	.page-navigation a:hover {
		background: color-mix(in srgb, var(--tecspa-accent) 10%, transparent);
		border-bottom-color: var(--tecspa-accent);
		color: var(--tecspa-accent-dark);
	}

	main {
		max-width: 920px;
		margin: 34px auto 0;
	}

	.message-panel,
	.empty-state button {
		border: 1px solid var(--tecspa-accent, currentColor);
		border-radius: 0.5rem;
		padding: 0.7rem 1rem;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}
	.empty-state button:disabled { opacity: 0.6; cursor: wait; }

	.empty-state {
		padding: 52px 28px;
		text-align: center;
		border: 1px solid var(--tecspa-border);
		background: var(--tecspa-surface);
		border-radius: var(--tecspa-panel-radius);
		box-shadow: var(--tecspa-panel-shadow);
	}

	.message-symbol,
	.empty-symbol {
		margin: 0 0 12px;
		font-size: 1.8rem;
		color: var(--tecspa-accent);
	}

	.message-panel h2,
	.empty-state h2 {
		margin: 0 0 10px;
		font-family: var(--tecspa-heading-font);
		font-size: 1.6rem;
		font-weight: 400;
		font-style: italic;
		color: var(--tecspa-accent-dark);
	}

	.message-panel p:last-child,
	.empty-state p {
		color: var(--tecspa-text-muted);
		line-height: 1.7;
	}

	.directory-intro {
		text-align: center;
		padding: 10px 0 20px;
	}

	.directory-intro p:last-child {
		margin: 4px 0;
		color: var(--tecspa-text-muted);
	}

	.count {
		font-size: 1.5rem;
		font-style: italic;
		color: var(--tecspa-accent-dark);
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 16px;
		margin: 4px 0 30px;
		color: var(--tecspa-accent);
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--tecspa-border);
		opacity: 0.8;
	}

	.member-list {
		display: grid;
		gap: 22px;
	}

	.member-card {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 24px;
		padding: 24px;
		background: var(--tecspa-surface);
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		box-shadow: var(--tecspa-panel-shadow);
		position: relative;
		overflow: hidden;
		transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
	}

	.member-card::before {
		content: '❦';
		position: absolute;
		top: 12px;
		right: 16px;
		color: var(--tecspa-accent);
		opacity: 0.45;
		font-size: 1.2rem;
	}

	.member-card:hover {
		transform: translateY(-2px);
		border-color: var(--tecspa-accent);
	}

	.avatar {
		width: 120px;
		height: 150px;
		display: grid;
		place-items: center;
		overflow: hidden;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background:
			radial-gradient(
				circle,
				color-mix(in srgb, var(--tecspa-accent) 18%, transparent),
				transparent 65%
			),
			var(--tecspa-surface-alt);
		color: var(--tecspa-accent);
		font-size: 2rem;
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.member-info {
		padding: 4px 28px 4px 0;
	}

	.member-number { margin: 0 0 6px; }

	.member-info h2 {
		margin: 0;
		font-family: var(--tecspa-heading-font);
		font-size: 2rem;
		font-weight: 400;
		font-style: italic;
		color: var(--tecspa-accent-dark);
	}

	.pronouns {
		margin: 7px 0 14px;
		font-size: 0.82rem;
		color: var(--tecspa-accent);
		letter-spacing: 0.08em;
	}


	.view-profile {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding-bottom: 4px;
		border-bottom: 1px solid var(--tecspa-border);
		font-size: 0.84rem;
		letter-spacing: 0.08em;
		transition: gap 0.2s ease, border-color 0.2s ease;
	}

	.view-profile:hover {
		gap: 18px;
		border-bottom-color: var(--tecspa-accent);
	}

	.view-profile span { font-size: 1rem; }

	.empty-link {
		display: inline-block;
		margin-top: 12px;
		padding-bottom: 5px;
		border-bottom: 1px solid var(--tecspa-border);
	}

	.fronting-panel {
		margin: 0 0 30px;
		padding: 24px;
		border: 1px solid var(--tecspa-accent);
		background:
			radial-gradient(
				circle at top right,
				color-mix(in srgb, var(--tecspa-accent) 13%, transparent),
				transparent 45%
			),
			var(--tecspa-surface);
		border-radius: var(--tecspa-panel-radius);
		box-shadow: var(--tecspa-panel-shadow);
		position: relative;
		overflow: hidden;
	}

	.fronting-panel::before {
		content: '୨୧';
		position: absolute;
		top: 12px;
		right: 18px;
		font-size: 1.4rem;
		color: var(--tecspa-accent);
		opacity: 0.5;
	}

	.fronting-heading {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 20px;
		margin-bottom: 20px;
	}

	.fronting-heading .section-label {
		margin: 0 0 6px;
	}

	.fronting-heading h2 {
		margin: 0;
		font-family: var(--tecspa-heading-font);
		font-size: 1.8rem;
		font-weight: 400;
		font-style: italic;
		color: var(--tecspa-accent-dark);
	}

	.fronting-count {
		padding: 6px 10px;
		border: 1px solid var(--tecspa-border);
		border-radius: 999px;
		color: var(--tecspa-accent);
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.fronter-list {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.fronter {
		min-width: 180px;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 14px 10px 10px;
		border: 1px solid var(--tecspa-border);
		background: color-mix(
			in srgb,
			var(--tecspa-surface-alt) 70%,
			transparent
		);
		border-radius: var(--tecspa-panel-radius);
		text-decoration: none;
		transition:
			transform 0.2s ease,
			border-color 0.2s ease,
			background 0.2s ease;
	}

	.fronter:hover {
		transform: translateY(-2px);
		border-color: var(--tecspa-accent);
		background: color-mix(
			in srgb,
			var(--tecspa-accent) 8%,
			var(--tecspa-surface)
		);
	}

	.fronter-avatar {
		width: 46px;
		height: 46px;
		flex: 0 0 46px;
		display: grid;
		place-items: center;
		overflow: hidden;
		border: 1px solid var(--tecspa-border);
		border-radius: 50%;
		background: var(--tecspa-surface);
		color: var(--tecspa-accent);
	}

	.fronter-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.fronter-info {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.fronter-info strong {
		color: var(--tecspa-accent-dark);
		font-family: var(--tecspa-heading-font);
		font-size: 1rem;
		font-weight: 400;
		font-style: italic;
	}

	.fronter-info span {
		color: var(--tecspa-text-muted);
		font-size: 0.72rem;
	}

	.fronter-mark {
		margin-left: auto;
		color: var(--tecspa-accent);
		font-size: 0.85rem;
	}

	.member-actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
	}

	.fronting-button {
		padding: 5px 10px;
		border: 1px solid var(--tecspa-border);
		border-radius: 999px;
		background: transparent;
		color: var(--tecspa-text-muted);
		font: inherit;
		font-size: 0.72rem;
		letter-spacing: 0.06em;
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease,
			transform 0.2s ease;
	}

	.fronting-button:hover {
		transform: translateY(-1px);
		border-color: var(--tecspa-accent);
		color: var(--tecspa-accent-dark);
		background: color-mix(
			in srgb,
			var(--tecspa-accent) 8%,
			transparent
		);
	}

	.fronting-button.fronting-active {
		border-color: var(--tecspa-accent);
		background: color-mix(
			in srgb,
			var(--tecspa-accent) 13%,
			transparent
		);
		color: var(--tecspa-accent-dark);
	}

	footer {
		max-width: 920px;
		margin: 50px auto 0;
		padding: 24px;
		text-align: center;
		border-top: 1px solid var(--tecspa-border);
		color: var(--tecspa-text-muted);
		font-size: 0.75rem;
		letter-spacing: 0.08em;
	}

	footer p { margin: 12px 0 0; }

	@media (max-width: 680px) {
        		.fronting-heading {
			align-items: flex-start;
			flex-direction: column;
		}

		.fronter {
			width: 100%;
		}

		.member-actions {
			align-items: flex-start;
			flex-direction: column;
		}

		.page-shell { padding: 24px 14px; }

		.page-navigation { flex-direction: column; }

		.page-navigation a { text-align: center; }

		.member-card { grid-template-columns: 1fr; }

		.avatar {
			width: 100%;
			height: 180px;
		}

		.member-info { padding-right: 0; }
	}

	.unlock-panel form {
		display: grid;
		gap: 0.8rem;
		max-width: 420px;
		margin: 1.25rem auto 0;
		text-align: left;
	}
	.unlock-panel label { font-weight: 600; }
	.unlock-panel input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.8rem 0.9rem;
		border: 1px solid var(--tecspa-border, #cbbce5);
		border-radius: 0.6rem;
		background: var(--tecspa-panel, #fff);
		color: inherit;
	}
	.unlock-panel button {
		padding: 0.8rem 1rem;
		border: 1px solid var(--tecspa-accent, #8056b8);
		border-radius: 0.6rem;
		background: var(--tecspa-accent, #8056b8);
		color: white;
		cursor: pointer;
	}
	.unlock-panel button:disabled { opacity: 0.65; cursor: wait; }
</style>
