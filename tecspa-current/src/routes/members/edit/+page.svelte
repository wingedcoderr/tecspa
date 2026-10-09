<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { getDataAdapter } from '$lib/db/data-adapter';
	import { isDesktop } from '$lib/platform';

	import type { Member } from '$lib/data/members';
	import { saveEncryptedMemberMediaDataUrl, resolveEncryptedMemberMedia } from '$lib/media/encrypted-member-media';

	let member: Member | null = null;

	let name = '';
	let pronouns = '';
	let aliases = '';
	let role = 'member';
	let status = 'active';
	let about = '';
	let interests = '';
	let frontTriggers = '';

	let avatar = '';
	let banner = '';
	let avatarPreview = '';
	let bannerPreview = '';

	let loading = true;
	let saving = false;
	let errorMessage = '';

	let customFields: Member['customFields'] = [];

	const memberId = page.url.searchParams.get('id');

	onMount(async () => {
		try {
			const adapter = getDataAdapter();

			if (!memberId) {
				errorMessage = 'No member ID was provided.';
				return;
			}

			member = await adapter.getMemberById(memberId);

			if (!member) {
				errorMessage = 'Member not found.';
				return;
			}

			name = member.name;
			pronouns = member.pronouns;
			aliases = member.aliases.join(', ');
			role = member.role;
			status = member.status;
			about = member.about;
			interests = member.interests.join(', ');
			frontTriggers = member.frontTriggers.join(', ');

			avatar = member.avatar ?? '';
			banner = member.banner ?? '';
			customFields = member.customFields ?? [];

			if (isDesktop()) {
				const { memberImageUrl } =
					await import('$lib/media/member-media');

				if (avatar) {
					avatarPreview = await memberImageUrl(avatar);
				}

				if (banner) {
					bannerPreview = await memberImageUrl(banner);
				}
			} else {
				avatarPreview = avatar.startsWith('e2ee-media:')
					? await resolveEncryptedMemberMedia(avatar)
					: (avatar.startsWith('data:') || avatar.startsWith('http') ? avatar : '');
				bannerPreview = banner.startsWith('e2ee-media:')
					? await resolveEncryptedMemberMedia(banner)
					: (banner.startsWith('data:') || banner.startsWith('http') ? banner : '');
			}
		} catch (error) {
			console.error('Failed to load member:', error);

			errorMessage =
				error instanceof Error
					? error.message
					: 'Could not load this member.';
		} finally {
			loading = false;
		}
	});

	function addCustomField() {
		if (!member) {
			return;
		}

		customFields = [
			...customFields,
			{
				id: crypto.randomUUID(),
				memberId: member.id,
				label: '',
				type: 'text',
				value: '',
				description: '',
				sortOrder: customFields.length
			}
		];
	}

	function removeCustomField(id: string) {
		customFields = customFields
			.filter((field) => field.id !== id)
			.map((field, index) => ({
				...field,
				sortOrder: index
			}));
	}

	function updateCustomField(
		id: string,
		changes: Partial<Member['customFields'][number]>
	) {
		customFields = customFields.map((field) =>
			field.id === id ? { ...field, ...changes } : field
		);
	}

	function selectImageFile(kind: 'avatar' | 'banner'): Promise<string | null> {
		return new Promise((resolve) => {
			const input = document.createElement('input');

			input.type = 'file';
			input.accept =
				'image/png,image/jpeg,image/gif,image/webp,image/bmp';

			input.onchange = () => {
				const file = input.files?.[0];

				if (!file) {
					resolve(null);
					return;
				}

				if (!file.type.startsWith('image/')) {
					errorMessage = 'Please choose an image file.';
					resolve(null);
					return;
				}

				if (file.size > 10 * 1024 * 1024) {
					errorMessage = 'Image must be smaller than 10 MB.';
					resolve(null);
					return;
				}

				const reader = new FileReader();

				reader.onload = () => {
					const result = reader.result;

					if (typeof result !== 'string') {
						errorMessage = 'Could not read the selected image.';
						resolve(null);
						return;
					}

					resolve(result);
				};

				reader.onerror = () => {
					errorMessage = 'Could not read the selected image.';
					resolve(null);
				};

				reader.readAsDataURL(file);
			};

			input.click();
		});
	}

	async function chooseImage(kind: 'avatar' | 'banner') {
		if (!member) {
			return;
		}

		errorMessage = '';

		if (!isDesktop()) {
			const dataUrl = await selectImageFile(kind);

			if (!dataUrl) {
				return;
			}

			const encryptedRef = await saveEncryptedMemberMediaDataUrl(member.id, kind, dataUrl);
			const preview = await resolveEncryptedMemberMedia(encryptedRef);
			if (kind === 'avatar') {
				avatar = encryptedRef;
				avatarPreview = preview;
			} else {
				banner = encryptedRef;
				bannerPreview = preview;
			}

			return;
		}

		try {
			const { selectAndStoreMemberImage } =
				await import('$lib/media/member-media');

			const storedImage = await selectAndStoreMemberImage(
				member.id,
				kind,
				kind === 'avatar' ? avatar : banner
			);

			if (!storedImage) {
				return;
			}

			if (kind === 'avatar') {
				avatar = storedImage.path;
				avatarPreview = storedImage.url;
			} else {
				banner = storedImage.path;
				bannerPreview = storedImage.url;
			}
		} catch (error) {
			console.error(`Failed to choose ${kind} image:`, error);

			errorMessage =
				error instanceof Error
					? error.message
					: `Could not choose the ${kind} image.`;
		}
	}

	async function saveMember() {
		if (!member) {
			return;
		}

		const memberId = member.id;

		saving = true;
		errorMessage = '';

		try {
			const adapter = getDataAdapter();

			const updatedMember: Member = {
				...member,
				name: name.trim(),
				pronouns: pronouns.trim(),
				aliases: aliases
					.split(',')
					.map((value) => value.trim())
					.filter(Boolean),
				role,
				status,
				about: about.trim(),
				interests: interests
					.split(',')
					.map((value) => value.trim())
					.filter(Boolean),
				frontTriggers: frontTriggers
					.split(',')
					.map((value) => value.trim())
					.filter(Boolean),
				avatar,
				banner,
				customFields: customFields.map((field, index) => ({
					...field,
					memberId,
					sortOrder: index
				}))
			};

			const savedMember = await adapter.updateMember(
				memberId,
				updatedMember
			);

			member = savedMember;

			goto(`/members/${memberId}`);
		} catch (error) {
			console.error('Failed to save member:', error);

			errorMessage =
				error instanceof Error
					? error.message
					: 'Could not save this member.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Edit {member?.name ?? 'Member'} — TECSPA™</title>

	<meta
		name="description"
		content={
			member
				? `Edit the TECSPA profile for ${member.name}.`
				: 'Edit a TECSPA member profile.'
		}
	/>
</svelte:head>

<div class="page-shell">
	<div class="lace lace-top"></div>

	<header class="page-header">
		<div class="header-ornament">୨୧</div>

		<p class="eyebrow">TECSPA™ / members / edit</p>

		<h1>edit a member</h1>

		<p class="subtitle">
			update this profile whenever something changes
		</p>

		<div class="ornament-line">
			<span>✦</span>
			<span>────────</span>
			<span>✦</span>
		</div>
	</header>

	<main class="content">
		{#if loading}
			<div class="loading-panel">
				<p>loading member profile...</p>
			</div>
		{:else if errorMessage && !member}
			<div class="loading-panel">
				<p>{errorMessage}</p>
				<a href="/members">← back to members</a>
			</div>
		{:else if member}
			<form
				class="member-form"
				onsubmit={(event) => {
					event.preventDefault();
					saveMember();
				}}
			>
				<section class="form-section">
					<div class="section-heading">
						<span class="section-symbol">❦</span>

						<div>
							<p class="section-label">identity</p>
							<h2>basic information</h2>
						</div>
					</div>

					<div class="field">
						<label for="name">name</label>

						<input
							id="name"
							type="text"
							bind:value={name}
							placeholder="What should they be called?"
							required
						/>
					</div>

					<div class="field">
						<label for="pronouns">pronouns</label>

						<input
							id="pronouns"
							type="text"
							bind:value={pronouns}
							placeholder="they / them"
						/>
					</div>

					<div class="field">
						<label for="aliases">aliases</label>

						<input
							id="aliases"
							type="text"
							bind:value={aliases}
							placeholder="Nickname, old name, other name..."
						/>

						<p class="field-help">
							Separate multiple aliases with commas.
						</p>
					</div>
				</section>

				<section class="form-section">
					<div class="section-heading">
						<span class="section-symbol">✧</span>

						<div>
							<p class="section-label">system information</p>
							<h2>their place in the system</h2>
						</div>
					</div>

					<div class="field-row">
						<div class="field">
							<label for="role">role</label>

							<select id="role" bind:value={role}>
								<option value="member">member</option>
								<option value="host">host</option>
								<option value="co-host">co-host</option>
								<option value="caretaker">caretaker</option>
								<option value="protector">protector</option>
								<option value="persecutor">persecutor</option>
								<option value="little">little</option>
								<option value="unknown">unknown</option>
							</select>
						</div>

						<div class="field">
							<label for="status">status</label>

							<select id="status" bind:value={status}>
								<option value="active">active</option>
								<option value="inactive">inactive</option>
								<option value="unknown">unknown</option>
							</select>
						</div>
					</div>
				</section>

				<section class="form-section">
					<div class="section-heading">
						<span class="section-symbol">☙</span>

						<div>
							<p class="section-label">about</p>
							<h2>tell us about them</h2>
						</div>
					</div>

					<div class="field">
						<label for="about">description</label>

						<textarea
							id="about"
							bind:value={about}
							rows="7"
							placeholder="Write anything you'd like to remember about this member..."
						></textarea>
					</div>
				</section>

				<section class="form-section">
					<div class="section-heading">
						<span class="section-symbol">✿</span>

						<div>
							<p class="section-label">details</p>
							<h2>interests & triggers</h2>
						</div>
					</div>

					<div class="field">
						<label for="interests">interests</label>

						<input
							id="interests"
							type="text"
							bind:value={interests}
							placeholder="art, music, reading..."
						/>

						<p class="field-help">
							Separate multiple interests with commas.
						</p>
					</div>

					<div class="field">
						<label for="front-triggers">front triggers</label>

						<input
							id="front-triggers"
							type="text"
							bind:value={frontTriggers}
							placeholder="songs, places, people..."
						/>

						<p class="field-help">
							Separate multiple triggers with commas.
						</p>
					</div>
				</section>

				<section class="form-section media-section">
				<div class="section-heading">
					<span class="section-symbol">❀</span>

					<div>
						<p class="section-label">appearance</p>
						<h2>profile imagery</h2>
					</div>
				</div>

				<div class="media-grid">
					<div class="media-picker">
						<p class="media-label">profile picture</p>

						<div class="image-preview avatar-preview">
							{#if avatarPreview}
								<img
									src={avatarPreview}
									alt={`${name || 'Member'} profile preview`}
								/>
							{:else}
								<span>♡</span>
							{/if}
						</div>

						<button
							class="media-button"
							type="button"
							onclick={() => chooseImage('avatar')}
						>
							{avatarPreview ? 'change picture' : 'choose picture'}
						</button>

						<p class="field-help">
							PNG, JPG, GIF, WEBP or BMP.
						</p>
					</div>

					<div class="media-picker">
						<p class="media-label">profile banner</p>

						<div class="image-preview banner-preview">
							{#if bannerPreview}
								<img
									src={bannerPreview}
									alt={`${name || 'Member'} banner preview`}
								/>
							{:else}
								<span>❦</span>
							{/if}
						</div>

						<button
							class="media-button"
							type="button"
							onclick={() => chooseImage('banner')}
						>
							{bannerPreview ? 'change banner' : 'choose banner'}
						</button>

						<p class="field-help">
							Wide images work especially well here.
						</p>
					</div>
				</div>
			</section>

<section class="custom-fields-section">
	<div class="section-heading">
		<div>
			<p class="section-kicker">✧ extra information</p>
			<h2>custom fields</h2>
			<p class="section-description">
				Add any extra information you want to keep on this member's profile.
			</p>
		</div>

		<button type="button" class="add-field-button" onclick={addCustomField}>
			＋ add field
		</button>
	</div>

	{#if customFields.length === 0}
		<div class="custom-fields-empty">
			<span class="empty-symbol">✧</span>
			<strong>no custom fields yet</strong>
			<p>
				Add things like favorite colors, source, age, comfort items,
				important dates, identity notes, or anything else you want.
			</p>

			<button type="button" class="empty-add-button" onclick={addCustomField}>
				＋ create your first field
			</button>
		</div>
	{:else}
		<div class="custom-fields-list">
			{#each customFields as field, index}
				<article class="custom-field-card">
					<div class="custom-field-header">
						<div>
							<span class="field-number">field {index + 1}</span>
							<h3>{field.label || 'unnamed field'}</h3>
						</div>

						<button
							type="button"
							class="remove-field-button"
							onclick={() => removeCustomField(field.id)}
						>
							× remove
						</button>
					</div>

					<div class="custom-field-grid">
						<label>
							<span>field name</span>
							<input
								type="text"
								value={field.label}
								placeholder="e.g. favorite color"
								oninput={(event) =>
									updateCustomField(field.id, {
										label: event.currentTarget.value
									})}
							/>
						</label>

						<label>
							<span>field type</span>
							<select
								value={field.type}
								onchange={(event) =>
									updateCustomField(field.id, {
										type: event.currentTarget.value as
											| 'text'
											| 'long-text'
											| 'number'
											| 'checkbox'
											| 'date'
											| 'tags'
									})}
							>
								<option value="text">text</option>
								<option value="long-text">long text</option>
								<option value="number">number</option>
								<option value="checkbox">checkbox</option>
								<option value="date">date</option>
								<option value="tags">tags</option>
							</select>
						</label>
					</div>

					<label class="custom-field-description">
						<span>description <small>(optional)</small></span>
						<input
							type="text"
							value={field.description}
							placeholder="A little explanation of what this field means..."
							oninput={(event) =>
								updateCustomField(field.id, {
									description: event.currentTarget.value
								})}
						/>
					</label>

					<label class="custom-field-value">
						<span>value</span>

						{#if field.type === 'long-text'}
							<textarea
								rows="5"
								value={field.value}
								placeholder="Enter information..."
								oninput={(event) =>
									updateCustomField(field.id, {
										value: event.currentTarget.value
									})}
							></textarea>

						{:else if field.type === 'checkbox'}
							<div class="checkbox-field">
								<input
									type="checkbox"
									checked={field.value === 'true'}
									onchange={(event) =>
										updateCustomField(field.id, {
											value: event.currentTarget.checked ? 'true' : 'false'
										})}
								/>

								<span>
									{field.value === 'true' ? 'yes' : 'no'}
								</span>
							</div>

						{:else if field.type === 'number'}
							<input
								type="number"
								value={field.value}
								placeholder="0"
								oninput={(event) =>
									updateCustomField(field.id, {
										value: event.currentTarget.value
									})}
							/>

						{:else if field.type === 'date'}
							<input
								type="date"
								value={field.value}
								oninput={(event) =>
									updateCustomField(field.id, {
										value: event.currentTarget.value
									})}
							/>

						{:else}
							<input
								type="text"
								value={field.value}
								placeholder={
									field.type === 'tags'
										? 'tag one, tag two, tag three'
										: 'Enter information...'
								}
								oninput={(event) =>
									updateCustomField(field.id, {
										value: event.currentTarget.value
									})}
							/>
						{/if}
					</label>
				</article>
			{/each}
		</div>
	{/if}
</section>

				{#if errorMessage}
					<div class="form-error">
						{errorMessage}
					</div>
				{/if}

				<div class="form-actions">
					<a
						class="cancel-button"
						href={`/members/${member.id}`}
					>
						cancel
					</a>

					<button
						class="save-button"
						type="submit"
						disabled={saving}
					>
						{saving ? 'saving...' : 'save changes'}
					</button>
				</div>
			</form>
		{/if}
	</main>

	<footer class="page-footer">
		<span>❦</span>
		<p>another little piece of your system</p>
		<span>❦</span>
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
		color: var(--tecspa-text);
		background: var(--tecspa-background);
		font-family: var(--tecspa-body-font);
	}

	:global(a) {
		color: inherit;
	}

	.page-shell {
		position: relative;
		min-height: 100vh;
		padding: 70px 24px;
		overflow: hidden;
		background:
			radial-gradient(
				circle at 20% 15%,
				color-mix(in srgb, var(--tecspa-accent) 18%, transparent),
				transparent 28%
			),
			radial-gradient(
				circle at 85% 75%,
				color-mix(in srgb, var(--tecspa-accent-dark) 14%, transparent),
				transparent 30%
			),
			var(--tecspa-background);
	}

	.page-header {
		max-width: 900px;
		margin: 0 auto 55px;
		text-align: center;
	}

	.header-ornament {
		margin-bottom: 18px;
		color: var(--tecspa-accent);
		font-size: 2rem;
		opacity: var(--tecspa-ornament-opacity);
	}

	.eyebrow {
		margin: 0 0 12px;
		color: var(--tecspa-accent);
		font-size: 0.72rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		color: var(--tecspa-text);
		font-family: var(--tecspa-heading-font);
		font-size: clamp(2.8rem, 7vw, 5.2rem);
		font-weight: 400;
		line-height: 0.95;
	}

	.subtitle {
		max-width: 520px;
		margin: 22px auto 0;
		color: var(--tecspa-text-muted);
		font-size: 1rem;
		font-style: italic;
		line-height: 1.7;
	}

	.ornament-line {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-top: 30px;
		color: var(--tecspa-accent);
		font-size: 0.8rem;
		letter-spacing: 0.15em;
		opacity: var(--tecspa-ornament-opacity);
	}

	.content {
		width: min(820px, 100%);
		margin: 0 auto;
	}

	.loading-panel {
		min-height: 40vh;
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

	.member-form {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.form-section {
		position: relative;
		padding: 34px;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background:
			color-mix(
				in srgb,
				var(--tecspa-surface) 72%,
				transparent
			);
		box-shadow:
			var(--tecspa-panel-shadow),
			inset 0 0 0 6px
				color-mix(in srgb, var(--tecspa-surface) 28%, transparent);
	}

	.form-section::before,
	.form-section::after {
		position: absolute;
		color: var(--tecspa-accent);
		font-size: 1.1rem;
		opacity: var(--tecspa-ornament-opacity);
	}

	.form-section::before {
		top: 12px;
		left: 15px;
		content: '✦';
	}

	.form-section::after {
		right: 15px;
		bottom: 12px;
		content: '✦';
	}

	.section-heading {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 28px;
	}

	.section-symbol {
		color: var(--tecspa-accent);
		font-size: 1.8rem;
	}

	.section-label {
		margin: 0 0 3px;
		color: var(--tecspa-accent);
		font-size: 0.68rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0;
		color: var(--tecspa-text);
		font-family: var(--tecspa-heading-font);
		font-size: 1.45rem;
		font-weight: 400;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 22px;
	}

	.field:last-child {
		margin-bottom: 0;
	}

	.field-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 20px;
	}

	label {
		color: var(--tecspa-text);
		font-size: 0.82rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	input,
	textarea,
	select {
		width: 100%;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		outline: none;
		color: var(--tecspa-text);
		background:
			color-mix(
				in srgb,
				var(--tecspa-surface) 64%,
				transparent
			);
		font: inherit;
		font-size: 1rem;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease,
			background 0.2s ease;
	}

	input,
	select {
		min-height: 48px;
		padding: 12px 15px;
	}

	textarea {
		min-height: 150px;
		padding: 14px 15px;
		resize: vertical;
		line-height: 1.65;
	}

	input::placeholder,
	textarea::placeholder {
		color: var(--tecspa-text-muted);
		opacity: 0.75;
		font-style: italic;
	}

	input:focus,
	textarea:focus,
	select:focus {
		border-color: var(--tecspa-accent);
		background: var(--tecspa-surface);
		box-shadow:
			0 0 0 3px
				color-mix(in srgb, var(--tecspa-accent) 12%, transparent);
	}

	.media-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 24px;
	}

	.media-picker {
		padding: 18px;
		border: 1px solid var(--tecspa-border);
		background: color-mix(in srgb, var(--tecspa-surface-alt) 48%, transparent);
	}

	.media-label {
		margin: 0 0 12px;
		color: var(--tecspa-text);
		font-size: 0.82rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.image-preview {
		overflow: hidden;
		border: 1px solid var(--tecspa-border);
		background: var(--tecspa-surface-alt);
		display: grid;
		place-items: center;
		color: var(--tecspa-accent);
		margin-bottom: 12px;
	}

	.image-preview span {
		font-size: 2.5rem;
	}

	.image-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.avatar-preview {
		width: 150px;
		height: 170px;
		margin-inline: auto;
	}

	.banner-preview {
		width: 100%;
		height: 170px;
	}

	.media-button {
		width: 100%;
		min-height: 44px;
		padding: 10px 14px;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background: var(--tecspa-surface);
		color: var(--tecspa-accent-dark);
		font: inherit;
		cursor: pointer;
		transition: transform 0.2s ease, border-color 0.2s ease;
	}

	.media-button:hover {
		transform: translateY(-1px);
		border-color: var(--tecspa-accent);
	}

	.field-help {
		margin: 0;
		color: var(--tecspa-text-muted);
		font-size: 0.78rem;
		font-style: italic;
	}

	.form-error {
		padding: 1rem 1.2rem;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background:
			color-mix(in srgb, var(--tecspa-accent-dark) 8%, transparent);
		color: var(--tecspa-accent-dark);
		line-height: 1.6;
	}

	.form-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding-top: 10px;
	}

	.cancel-button,
	.save-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		min-height: 48px;
		padding: 12px 22px;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		text-decoration: none;
		font: inherit;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			background 0.2s ease,
			box-shadow 0.2s ease;
	}

	.cancel-button {
		color: var(--tecspa-text-muted);
		background:
			color-mix(
				in srgb,
				var(--tecspa-surface) 50%,
				transparent
			);
	}

	.save-button {
		color: var(--tecspa-surface);
		background: var(--tecspa-accent-dark);
		border-color: var(--tecspa-accent-dark);
	}

	.cancel-button:hover,
	.save-button:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.cancel-button:hover {
		background: var(--tecspa-surface);
		box-shadow:
			0 8px 20px
				color-mix(in srgb, var(--tecspa-text) 8%, transparent);
	}

	.save-button:hover:not(:disabled) {
		background: var(--tecspa-accent);
		box-shadow:
			0 8px 22px
				color-mix(in srgb, var(--tecspa-text) 16%, transparent);
	}

	.save-button:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.page-footer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 15px;
		margin-top: 55px;
		color: var(--tecspa-text-muted);
		font-size: 0.8rem;
		font-style: italic;
	}

	.lace {
		position: absolute;
		left: 0;
		width: 100%;
		height: 18px;
		opacity: var(--tecspa-ornament-opacity);
		pointer-events: none;
		background-image:
			radial-gradient(
				circle at 9px 9px,
				transparent 5px,
				var(--tecspa-accent) 5.5px,
				var(--tecspa-accent) 6px,
				transparent 6.5px
			);
		background-size: 18px 18px;
	}

	.lace-top {
		top: 0;
	}

	.lace-bottom {
		bottom: 0;
		transform: rotate(180deg);
	}

	@media (max-width: 650px) {
		.page-shell {
			padding: 55px 15px;
		}

		.form-section {
			padding: 26px 20px;
		}

		.field-row {
			grid-template-columns: 1fr;
			gap: 0;
		}

		.form-actions {
			flex-direction: column-reverse;
			align-items: stretch;
		}

		.cancel-button,
		.save-button {
			width: 100%;
		}
	}

/* ─────────────────────────────────────
   CUSTOM FIELDS
   ───────────────────────────────────── */

.custom-fields-section {
	margin-top: 2.5rem;
	padding-top: 2rem;
	border-top: 1px solid var(--tecspa-border);
}

.section-heading {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1.25rem;
}

.section-kicker {
	margin: 0 0 0.25rem;
	font-size: 0.75rem;
	letter-spacing: 0.14em;
	text-transform: uppercase;
	color: var(--tecspa-accent);
}

.section-heading h2 {
	margin: 0;
	font-family: var(--tecspa-heading-font);
	color: var(--tecspa-text);
}

.section-description {
	margin: 0.4rem 0 0;
	color: var(--tecspa-text-muted);
	font-size: 0.9rem;
}

.add-field-button,
.empty-add-button {
	border: 1px solid var(--tecspa-border);
	border-radius: var(--tecspa-panel-radius);
	background: var(--tecspa-surface-alt);
	color: var(--tecspa-text);
	padding: 0.7rem 1rem;
	font: inherit;
	cursor: pointer;
	transition:
		transform 0.15s ease,
		background 0.15s ease,
		border-color 0.15s ease;
}

.add-field-button:hover,
.empty-add-button:hover {
	transform: translateY(-1px);
	background: var(--tecspa-surface);
	border-color: var(--tecspa-accent);
}

.custom-fields-empty {
	padding: 2rem;
	border: 1px dashed var(--tecspa-border);
	border-radius: var(--tecspa-panel-radius);
	background: color-mix(
		in srgb,
		var(--tecspa-surface-alt) 70%,
		transparent
	);
	text-align: center;
}

.empty-symbol {
	display: block;
	margin-bottom: 0.5rem;
	font-size: 1.5rem;
	color: var(--tecspa-accent);
}

.custom-fields-empty strong {
	display: block;
	margin-bottom: 0.4rem;
	font-family: var(--tecspa-heading-font);
	font-size: 1.05rem;
}

.custom-fields-empty p {
	max-width: 520px;
	margin: 0 auto 1.25rem;
	color: var(--tecspa-text-muted);
	font-size: 0.9rem;
	line-height: 1.6;
}

.custom-fields-list {
	display: grid;
	gap: 1rem;
}

.custom-field-card {
	padding: 1.25rem;
	border: 1px solid var(--tecspa-border);
	border-radius: var(--tecspa-panel-radius);
	background: var(--tecspa-surface);
	box-shadow: var(--tecspa-panel-shadow);
}

.custom-field-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1rem;
}

.field-number {
	display: block;
	margin-bottom: 0.2rem;
	font-size: 0.7rem;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: var(--tecspa-accent);
}

.custom-field-header h3 {
	margin: 0;
	font-family: var(--tecspa-heading-font);
	font-size: 1.05rem;
}

.remove-field-button {
	border: 0;
	background: transparent;
	color: var(--tecspa-text-muted);
	font: inherit;
	font-size: 0.8rem;
	cursor: pointer;
}

.remove-field-button:hover {
	color: var(--tecspa-accent);
}

.custom-field-grid {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(180px, 0.45fr);
	gap: 1rem;
}

.custom-field-card label {
	display: grid;
	gap: 0.4rem;
}

.custom-field-card label > span {
	font-size: 0.75rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--tecspa-text-muted);
}

.custom-field-card small {
	font-size: 0.7rem;
	letter-spacing: normal;
	text-transform: none;
}

.custom-field-card input,
.custom-field-card textarea,
.custom-field-card select {
	width: 100%;
	box-sizing: border-box;
	border: 1px solid var(--tecspa-border);
	border-radius: calc(var(--tecspa-panel-radius) * 0.7);
	background: var(--tecspa-surface-alt);
	color: var(--tecspa-text);
	padding: 0.7rem 0.8rem;
	font: inherit;
}

.custom-field-card textarea {
	resize: vertical;
	min-height: 100px;
	line-height: 1.5;
}

.custom-field-card input:focus,
.custom-field-card textarea:focus,
.custom-field-card select:focus {
	outline: none;
	border-color: var(--tecspa-accent);
}

.custom-field-description,
.custom-field-value {
	margin-top: 1rem;
}

.checkbox-field {
	display: flex;
	align-items: center;
	gap: 0.65rem;
	min-height: 42px;
	padding: 0.5rem 0.75rem;
	border: 1px solid var(--tecspa-border);
	border-radius: calc(var(--tecspa-panel-radius) * 0.7);
	background: var(--tecspa-surface-alt);
}

.checkbox-field input {
	width: auto;
	margin: 0;
}

.checkbox-field span {
	font-size: 0.9rem;
	color: var(--tecspa-text);
}

@media (max-width: 700px) {
	.section-heading {
		flex-direction: column;
	}

	.custom-field-grid {
		grid-template-columns: 1fr;
	}

	.custom-field-header {
		flex-direction: column;
	}
}

</style>