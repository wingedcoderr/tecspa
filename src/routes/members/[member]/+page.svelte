<script lang="ts">
console.log('PROFILE FILE LOADED');
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
import Markdown from '$lib/components/Markdown.svelte';
import { isDesktop } from '$lib/platform';
	import { getDataAdapter } from '$lib/db/data-adapter';

import {
	memberImageUrl
} from '$lib/media/member-media';

	import type { Member } from '$lib/data/members';

let member = $state<Member | null>(null);

let avatarUrl = $state('');
let bannerUrl = $state('');

let loading = $state(true);
let deleting = $state(false);

let errorMessage = $state('');

	onMount(async () => {
	try {
		console.log('PROFILE: onMount started');

		const dataAdapter = getDataAdapter();
		console.log('PROFILE: data adapter created', dataAdapter);

		const memberId = page.params.member;
		console.log('PROFILE: member ID', memberId);

		if (!memberId) {
			errorMessage =
				'No member ID was provided.';
			return;
		}

		console.log('PROFILE: about to call getMemberById');

		const loadedMember =
			await dataAdapter.getMemberById(memberId);

		console.log(
			'PROFILE: getMemberById finished',
			loadedMember
		);
			if (!loadedMember) {
				errorMessage =
					'Member not found.';
				return;
			}

			member = loadedMember;

			/*
			 * Resolve TECSPA's stored local media paths into
			 * URLs that the Svelte UI can actually display.
			 */

if (loadedMember.avatar) {
	if (
		loadedMember.avatar.startsWith('data:') ||
		loadedMember.avatar.startsWith('http://') ||
		loadedMember.avatar.startsWith('https://') ||
		loadedMember.avatar.startsWith('asset:')
	) {
		avatarUrl = loadedMember.avatar;
	} else if (isDesktop()) {
		avatarUrl = await memberImageUrl(loadedMember.avatar);
	} else {
		avatarUrl = `/api/media/members/${encodeURIComponent(loadedMember.id)}/avatar`;
	}
}

if (loadedMember.banner) {
	if (
		loadedMember.banner.startsWith('data:') ||
		loadedMember.banner.startsWith('http://') ||
		loadedMember.banner.startsWith('https://') ||
		loadedMember.banner.startsWith('asset:')
	) {
		bannerUrl = loadedMember.banner;
	} else if (isDesktop()) {
		bannerUrl = await memberImageUrl(loadedMember.banner);
	} else {
		bannerUrl = `/api/media/members/${encodeURIComponent(loadedMember.id)}/banner`;
	}
}

			console.log(
				'Loaded member profile media:',
				{
					member: loadedMember.name,
					avatar: loadedMember.avatar,
					avatarUrl,
					banner: loadedMember.banner,
					bannerUrl
				}
			);
		} catch (error) {
			console.error(
				'Failed to load member profile:',
				error
			);

			errorMessage =
				error instanceof Error
					? error.message
					: 'Could not load this member profile.';
		} finally {
			loading = false;
		}
	});

	async function handleDelete() {
	if (!member || deleting) {
		return;
	}

	const confirmed = window.confirm(
		`Delete "${member.name}"?\n\nThis will permanently remove this member from TECSPA.`
	);

	if (!confirmed) {
		return;
	}

	deleting = true;
	errorMessage = '';

	try {
		const dataAdapter = getDataAdapter();

		await dataAdapter.deleteMember(
			member.id
		);

		await goto('/members');
	} catch (error) {
		console.error(
			'Failed to delete member:',
			error
		);

		errorMessage =
			error instanceof Error
				? error.message
				: 'Could not delete this member.';
	} finally {
		deleting = false;
	}
}
</script>

<svelte:head>
	<title>{member?.name ?? 'Member profile'} · TECSPA™</title>

	<meta
		name="description"
		content={member ? `Profile of ${member.name}` : 'TECSPA member profile'}
	/>
</svelte:head>

<div class="background">
	{#if loading}
		<main class="profile-page">
			<div class="loading-panel">
				<p>loading member profile...</p>
			</div>
		</main>
	{:else if errorMessage}
		<main class="profile-page">
			<div class="loading-panel">
				<p>{errorMessage}</p>
				<a href="/members">← back to members</a>
			</div>
		</main>
	{:else if member}
		<main class="profile-page">
			<nav class="profile-navigation" aria-label="Profile navigation">
				<a class="nav-button" href="/members">
					<span class="nav-symbol">୨୧</span>
					<span>back to members</span>
					<span class="nav-arrow">→</span>
				</a>

				<a
					class="nav-button edit-button"
					href={`/members/edit?id=${member.id}`}
				>
					<span class="nav-symbol">✎</span>
					<span>edit profile</span>
					<span class="nav-arrow">→</span>
				</a>

				<button
					class="nav-button delete-button"
					type="button"
					onclick={handleDelete}
					disabled={deleting}
				>
					<span class="nav-symbol">†</span>
					<span>{deleting ? 'deleting...' : 'delete profile'}</span>
					<span class="nav-arrow">→</span>
				</button>

				<a class="nav-button" href="/">
					<span class="nav-symbol">⌂</span>
					<span>back home</span>
					<span class="nav-arrow">→</span>
				</a>
			</nav>

			<div class="ornament">
				<span>༺</span>
				<span>❀</span>
				<span>༻</span>
			</div>

			<section
	class="banner"
	class:has-banner={Boolean(bannerUrl)}
>
	{#if bannerUrl}
		<img
			class="banner-image"
			src={bannerUrl}
			alt=""
			aria-hidden="true"
		/>

		<div class="banner-overlay"></div>
	{/if}

	<div class="banner-decoration left">❧</div>

	<div class="banner-content">
		<p class="banner-label">
			TECSPA™ · member profile
		</p>

		<h1>{member.name}</h1>

		<p class="banner-pronouns">
			{member.pronouns}
		</p>
	</div>

	<div class="banner-decoration right">❧</div>
</section>

			<section class="identity">
				<div class="portrait">
	{#if avatarUrl}
		<img
			src={avatarUrl}
			alt={`${member.name} profile picture`}
		/>
	{:else}
		<div class="portrait-inner">
			♡
		</div>
	{/if}
</div>
				<div class="identity-info">
					<p class="eyebrow">
						identity
					</p>

					<h2>{member.name}</h2>

					<p class="pronouns">
						{member.pronouns}
					</p>

					<div class="aliases">
						<span class="label">
							also known as
						</span>

						{#each member.aliases as alias}
							<span class="alias">
								{alias}
							</span>
						{/each}
					</div>

					<div class="status">
						<span class="status-dot"></span>
						{member.status}
					</div>
				</div>
			</section>

			<div class="divider">
				<span>୨୧</span>
				<span>──────</span>
				<span>✦</span>
				<span>──────</span>
				<span>୨୧</span>
			</div>

			<section class="content-section">
				<p class="eyebrow">
					about
				</p>

				<h2>About {member.name}</h2>

				{#if member.about}
	<Markdown
		content={member.about}
		class="member-about-markdown"
	/>
{:else}
	<p class="body-text">
		No information has been added yet.
	</p>
{/if}
			</section>

			<div class="small-divider">
				✧ · · · ✧
			</div>

			<section class="content-section">
				<p class="eyebrow">
					interests
				</p>

				<h2>Things they enjoy</h2>

				<div class="tag-list">
					{#each member.interests as interest}
						<span class="tag">
							✦ {interest}
						</span>
					{/each}
				</div>
			</section>

			<section class="special-section">
				<div class="special-header">
					<span>୨୧</span>

					<div>
						<p class="eyebrow">
							fronting
						</p>

						<h2>Front triggers</h2>
					</div>

					<span>୨୧</span>
				</div>

				<p class="body-text">
					Things that may make this member more likely to
					front.
				</p>

				<div class="trigger-list">
					{#each member.frontTriggers as trigger}
						<div class="trigger">
							<span>♡</span>
							{trigger}
						</div>
					{/each}
				</div>
			</section>

			<section class="custom-fields">
				<p class="eyebrow">custom fields</p>

				<h2>Your profile, your rules.</h2>

				{#if (member.customFields ?? []).length === 0}
					<p class="body-text">No custom information has been added yet.</p>
				{:else}
					<div class="profile-custom-fields">
						{#each (member.customFields ?? []) as field}
							<article class="profile-custom-field">
								<div class="profile-custom-field-header">
									<div>
										<p class="profile-custom-field-label">
											{field.label || 'unnamed field'}
										</p>
										{#if field.description}
	<Markdown
		content={field.description}
		class="profile-custom-field-description"
	/>
{/if}
									</div>
									<span class="profile-custom-field-type">{field.type}</span>
								</div>

								<div class="profile-custom-field-value">
									{#if field.type === 'checkbox'}
										{#if field.value === 'true'}
											<span class="custom-field-check">✦ enabled</span>
										{:else}
											<span class="profile-custom-field-empty">not enabled</span>
										{/if}
									{:else if field.type === 'tags'}
										<div class="profile-custom-field-tags">
											{#each field.value.split(',').map((tag) => tag.trim()).filter(Boolean) as tag}
												<span class="profile-custom-field-tag">✦ {tag}</span>
											{/each}
										</div>
									{:else if field.value}
	<Markdown
		content={field.value}
		class="profile-custom-field-markdown"
	/>
									{:else}
										<span class="profile-custom-field-empty">empty</span>
									{/if}
								</div>
							</article>
						{/each}
					</div>
				{/if}
			</section>
			<div class="divider">
				<span>✧</span>
				<span>· · ·</span>
				<span>✧</span>
			</div>

			<footer>
				<p>
					made with ♡ in TECSPA™
				</p>

				<p class="tiny">
					this profile belongs to its member
				</p>
			</footer>
		</main>
	{/if}
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
		color: var(--tecspa-text);
		background: var(--tecspa-background);
		font-family: var(--tecspa-body-font);
	}

	:global(a) {
		color: inherit;
	}

	.background {
		position: relative;
		min-height: 100vh;
		padding: 3rem 1.5rem;
		background:
			radial-gradient(
				circle at 15% 20%,
				color-mix(in srgb, var(--tecspa-accent) 15%, transparent),
				transparent 30%
			),
			radial-gradient(
				circle at 85% 70%,
				color-mix(in srgb, var(--tecspa-accent-dark) 12%, transparent),
				transparent 35%
			),
			var(--tecspa-background);
	}

	.profile-page {
		max-width: 820px;
		margin: 0 auto;
		padding: 2rem 3rem;
		background:
			color-mix(
				in srgb,
				var(--tecspa-surface) 94%,
				transparent
			);
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		box-shadow: var(--tecspa-panel-shadow);
	}

	.loading-panel {
		min-height: 50vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		text-align: center;
		color: var(--tecspa-text-muted);
	}

	.loading-panel a {
		color: var(--tecspa-accent-dark);
	}

	.profile-navigation {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		text-align: left;
	}

	.nav-button {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.6rem 1rem;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background:
			linear-gradient(
				135deg,
				color-mix(in srgb, var(--tecspa-surface) 90%, transparent),
				color-mix(in srgb, var(--tecspa-surface-alt) 80%, transparent)
			);
		color: var(--tecspa-text-muted);
		font-size: 0.75rem;
		font-style: italic;
		text-decoration: none;
		box-shadow: 0 2px 8px
			color-mix(in srgb, var(--tecspa-text) 6%, transparent);
		transition:
			transform 0.2s ease,
			background 0.2s ease,
			box-shadow 0.2s ease;
		cursor: pointer;
	}

	.nav-button:hover {
		transform: translateY(-2px);
		background: var(--tecspa-surface);
		box-shadow: 0 5px 14px
			color-mix(in srgb, var(--tecspa-text) 10%, transparent);
	}

	.nav-symbol {
		color: var(--tecspa-accent);
		font-size: 0.9rem;
	}

	.nav-arrow {
		font-size: 0.9rem;
		transition: transform 0.2s ease;
	}

	.nav-button:hover .nav-arrow {
		transform: translateX(3px);
	}

	.ornament {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		color: var(--tecspa-accent);
		font-size: 1.7rem;
		letter-spacing: 0.3rem;
		opacity: var(--tecspa-ornament-opacity);
	}

	.banner {
	position: relative;

	display: flex;
	align-items: center;
	justify-content: center;

	min-height: 320px;

	padding: 3rem 4rem;

	overflow: hidden;

	border: 1px solid var(--tecspa-border);
	border-radius: var(--tecspa-panel-radius);

	background:
		linear-gradient(
			135deg,
			color-mix(
				in srgb,
				var(--tecspa-accent) 28%,
				var(--tecspa-background)
			),
			var(--tecspa-surface),
			color-mix(
				in srgb,
				var(--tecspa-accent-dark) 20%,
				var(--tecspa-background)
			)
		);

	text-align: center;
}

/*
 * The imported banner becomes the actual background image.
 */
.banner-image {
	position: absolute;
	inset: 0;

	width: 100%;
	height: 100%;

	object-fit: cover;

	z-index: 0;
}

/*
 * Theme-aware colour wash over the image.
 *
 * Because these use TECSPA theme variables, the same
 * banner automatically looks different in every theme.
 */
.banner-overlay {
	position: absolute;
	inset: 0;

	z-index: 1;

	background:
		linear-gradient(
			135deg,
			color-mix(
				in srgb,
				var(--tecspa-accent) 48%,
				transparent
			),
			color-mix(
				in srgb,
				var(--tecspa-background) 28%,
				transparent
			) 48%,
			color-mix(
				in srgb,
				var(--tecspa-accent-dark) 48%,
				transparent
			)
		);

	pointer-events: none;
}

/*
 * A second, softer theme layer makes text easier to read
 * without completely washing out the artwork.
 */
.banner.has-banner::after {
	content: '';

	position: absolute;
	inset: 0;

	z-index: 2;

	background:
		linear-gradient(
			180deg,
			color-mix(
				in srgb,
				var(--tecspa-background) 12%,
				transparent
			),
			color-mix(
				in srgb,
				var(--tecspa-background) 34%,
				transparent
			)
		);

	pointer-events: none;
}

.banner.has-banner .banner-content,
.banner.has-banner .banner-decoration {
	position: relative;

	z-index: 3;
}

.banner.has-banner .banner-label,
.banner.has-banner .banner-pronouns,
.banner.has-banner h1 {
	text-shadow:
		0 2px 4px
			color-mix(
				in srgb,
				#000 55%,
				transparent
			),
		0 0 18px
			color-mix(
				in srgb,
				#000 30%,
				transparent
			);
}

.banner.has-banner h1 {
	color: var(--tecspa-surface);
}

.banner.has-banner .banner-label {
	color: var(--tecspa-surface);
}

.banner.has-banner .banner-pronouns {
	color: var(--tecspa-surface);
}

	.banner::before,
	.banner::after {
		content: '';
		position: absolute;
		top: 12px;
		bottom: 12px;
		width: 20px;
		border-top: 1px solid var(--tecspa-border);
		border-bottom: 1px solid var(--tecspa-border);
	}

	.banner::before {
		left: 12px;
	}

	.banner::after {
		right: 12px;
	}

	.banner-decoration {
		position: absolute;
		top: 50%;
		color: var(--tecspa-accent);
		font-size: 2.5rem;
		transform: translateY(-50%);
		opacity: var(--tecspa-ornament-opacity);
	}

	.banner-decoration.left {
		left: 1.5rem;
	}

	.banner-decoration.right {
		right: 1.5rem;
		transform: translateY(-50%) scaleX(-1);
	}

	.banner-label {
		margin: 0 0 0.75rem;
		color: var(--tecspa-accent);
		font-size: 0.7rem;
		letter-spacing: 0.2rem;
		text-transform: uppercase;
	}

	.banner h1 {
		margin: 0;
		color: var(--tecspa-text);
		font-family: var(--tecspa-heading-font);
		font-size: clamp(2.5rem, 7vw, 4.5rem);
		font-weight: normal;
		letter-spacing: 0.05em;
	}

	.banner-pronouns {
		margin: 0.75rem 0 0;
		color: var(--tecspa-text-muted);
		font-size: 0.85rem;
		font-style: italic;
	}

.banner-overlay {
	background:
		linear-gradient(
			180deg,
			color-mix(
				in srgb,
				var(--tecspa-background) 28%,
				transparent
			),
			color-mix(
				in srgb,
				var(--tecspa-background) 58%,
				transparent
			)
		);
}

	.identity {
		display: grid;
		grid-template-columns: 180px 1fr;
		gap: 2rem;
		align-items: center;
		margin-top: 2.5rem;
	}

	.portrait {
	position: relative;

	width: 180px;
	height: 220px;

	padding: 8px;

	border: 1px solid var(--tecspa-border);
	border-radius: var(--tecspa-panel-radius);

	background: var(--tecspa-surface-alt);

	overflow: hidden;

	transform: rotate(-2deg);
}

.portrait img {
	display: block;

	width: 100%;
	height: 100%;

	max-width: 100%;
	max-height: 100%;

	object-fit: cover;

	border-radius: calc(
		var(--tecspa-panel-radius) * 0.65
	);
}

.portrait-inner {
	display: flex;

	width: 100%;
	height: 100%;

	align-items: center;
	justify-content: center;

	background:
		radial-gradient(
			circle,
			color-mix(
				in srgb,
				var(--tecspa-surface) 90%,
				transparent
			),
			transparent
		),
		var(--tecspa-surface-alt);

	color: var(--tecspa-accent);

	font-size: 4rem;
}

	.eyebrow {
		margin: 0 0 0.4rem;
		color: var(--tecspa-accent);
		font-size: 0.7rem;
		letter-spacing: 0.22rem;
		text-transform: uppercase;
	}

	.identity-info h2,
	.content-section h2,
	.special-section h2,
	.custom-fields h2 {
		margin: 0;
		color: var(--tecspa-text);
		font-family: var(--tecspa-heading-font);
		font-size: 2rem;
		font-weight: normal;
	}

	.pronouns {
		margin: 0.35rem 0 1rem;
		color: var(--tecspa-accent);
		font-size: 0.8rem;
		font-style: italic;
	}

	.aliases {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		align-items: center;
		color: var(--tecspa-text-muted);
		font-size: 0.75rem;
	}

	.aliases .label {
		font-style: italic;
	}

	.alias {
		padding: 0.2rem 0.5rem;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background: color-mix(
			in srgb,
			var(--tecspa-surface) 55%,
			transparent
		);
	}

	.status {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 1rem;
		color: var(--tecspa-text-muted);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.12rem;
	}

	.status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--tecspa-accent);
		box-shadow: 0 0 0 3px
			color-mix(in srgb, var(--tecspa-accent) 12%, transparent);
	}

	.divider {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.8rem;
		margin: 2.5rem 0;
		color: var(--tecspa-accent);
		font-size: 0.8rem;
		letter-spacing: 0.25rem;
		opacity: var(--tecspa-ornament-opacity);
	}

	.small-divider {
		margin: 2rem 0;
		text-align: center;
		color: var(--tecspa-accent);
		font-size: 0.8rem;
		letter-spacing: 0.3rem;
		opacity: var(--tecspa-ornament-opacity);
	}

	.content-section {
		padding: 0 0.5rem;
	}

	.body-text {
		max-width: 650px;
		margin: 1rem 0 0;
		color: var(--tecspa-text-muted);
		font-size: 0.92rem;
		line-height: 1.9;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 1.25rem;
	}

	.tag {
		padding: 0.45rem 0.8rem;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background: color-mix(
			in srgb,
			var(--tecspa-surface-alt) 80%,
			transparent
		);
		color: var(--tecspa-text-muted);
		font-size: 0.78rem;
		font-style: italic;
	}

	.special-section {
		margin-top: 2.5rem;
		padding: 1.5rem;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background:
			linear-gradient(
				135deg,
				color-mix(in srgb, var(--tecspa-surface-alt) 90%, transparent),
				color-mix(in srgb, var(--tecspa-surface) 60%, transparent)
			);
	}

	.special-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		text-align: center;
		color: var(--tecspa-accent);
	}

	.special-header > div {
		flex: 1;
	}

	.trigger-list {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.6rem;
		margin-top: 1.25rem;
	}

	.trigger {
		padding: 0.75rem;
		border: 1px dotted var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background: color-mix(
			in srgb,
			var(--tecspa-surface) 50%,
			transparent
		);
		color: var(--tecspa-text-muted);
		font-size: 0.8rem;
	}

	.trigger span {
		margin-right: 0.4rem;
		color: var(--tecspa-accent);
	}

	.custom-fields {
		margin-top: 2.5rem;
		padding: 1.5rem;
		border-top: 1px solid var(--tecspa-border);
		border-bottom: 1px solid var(--tecspa-border);
		text-align: center;
	}

	footer {
		margin-top: 2rem;
		text-align: center;
		color: var(--tecspa-text-muted);
		font-size: 0.75rem;
		font-style: italic;
	}

	footer p {
		margin: 0.3rem;
	}

	footer .tiny {
		font-size: 0.65rem;
		opacity: 0.7;
	}

	.edit-button {
		background: color-mix(
			in srgb,
			var(--tecspa-accent) 8%,
			transparent
		);
	}

	.edit-button:hover {
		background: color-mix(
			in srgb,
			var(--tecspa-accent) 16%,
			transparent
		);
	}

	.delete-button {
		border-color: color-mix(
			in srgb,
			var(--tecspa-accent-dark) 28%,
			var(--tecspa-border)
		);
		color: var(--tecspa-accent-dark);
		background: color-mix(
			in srgb,
			var(--tecspa-accent-dark) 6%,
			transparent
		);
		font: inherit;
	}

	.delete-button:hover {
		background: color-mix(
			in srgb,
			var(--tecspa-accent-dark) 14%,
			transparent
		);
		box-shadow: 0 8px 20px
			color-mix(in srgb, var(--tecspa-text) 8%, transparent);
	}

	.delete-button:disabled {
		opacity: 0.55;
		cursor: wait;
	}


	.profile-custom-fields {
		display: grid;
		gap: 14px;
		margin-top: 1.5rem;
		text-align: left;
	}

	.profile-custom-field {
		padding: 1.15rem 1.25rem;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background: color-mix(in srgb, var(--tecspa-surface-alt) 65%, transparent);
		box-shadow: 0 4px 14px color-mix(in srgb, var(--tecspa-text) 5%, transparent);
	}

	.profile-custom-field-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.profile-custom-field-label {
		margin: 0;
		color: var(--tecspa-text);
		font-family: var(--tecspa-heading-font);
		font-size: 1.05rem;
	}

	.profile-custom-field-description {
		margin: 0.3rem 0 0;
		color: var(--tecspa-text-muted);
		font-size: 0.76rem;
		font-style: italic;
		line-height: 1.5;
	}

	.profile-custom-field-type {
		flex-shrink: 0;
		padding: 0.2rem 0.45rem;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		color: var(--tecspa-text-muted);
		font-size: 0.6rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.profile-custom-field-value {
		color: var(--tecspa-text-muted);
		font-size: 0.88rem;
		line-height: 1.75;
		white-space: pre-wrap;
	}

	.profile-custom-field-empty {
		color: var(--tecspa-text-muted);
		font-style: italic;
		opacity: 0.7;
	}

	.custom-field-check {
		color: var(--tecspa-accent-dark);
	}

	.profile-custom-field-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.profile-custom-field-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.65rem;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background: color-mix(in srgb, var(--tecspa-surface) 70%, transparent);
		color: var(--tecspa-text-muted);
		font-size: 0.75rem;
		font-style: italic;
	}

	@media (max-width: 650px) {
		.background {
			padding: 1rem 0.5rem;
		}

		.profile-page {
			padding: 1.25rem;
		}

		.identity {
			grid-template-columns: 1fr;
			text-align: center;
		}

		.portrait {
			margin: 0 auto;
		}

		.aliases,
		.status {
			justify-content: center;
		}

		.trigger-list {
			grid-template-columns: 1fr;
		}

		.profile-custom-field-header {
			flex-direction: column;
			gap: 0.5rem;
		}

		.banner {
			padding: 2.5rem 2rem;
		}

		.banner-decoration {
			display: none;
		}
	}

.member-about-markdown {
	max-width: 100%;
}

.member-about-markdown :global(img),
.profile-custom-field-markdown :global(img) {
	max-height: 700px;
}

.profile-custom-field-description {
	font-size: inherit;
}

.profile-custom-field-markdown {
	width: 100%;
}

</style>