<script lang="ts">
	import { goto } from '$app/navigation';

	import { isDesktop } from '$lib/platform';
	import {
		selectAndStoreMemberImage
	} from '$lib/media/member-media';
	import type { Member } from '$lib/data/members';
	import { saveEncryptedMemberMediaDataUrl, resolveEncryptedMemberMedia } from '$lib/media/encrypted-member-media';

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
	const memberId = crypto.randomUUID();
	let customFields: Member['customFields'] = [];

	function addCustomField() {
	customFields = [
		...customFields,
		{
			id: crypto.randomUUID(),
			memberId,
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

	let saving = false;
	let errorMessage = '';

	async function chooseImage(kind: 'avatar' | 'banner') {
		errorMessage = '';

		try {
			if (!isDesktop()) {
				const selectedFile = await new Promise<File | null>((resolve) => {
					const input = document.createElement('input');
					input.type = 'file';
					input.accept = 'image/png,image/jpeg,image/gif,image/webp,image/bmp';
					input.onchange = () => resolve(input.files?.[0] ?? null);
					input.click();
				});

				if (!selectedFile) return;

				const dataUrl = await new Promise<string>((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = () => resolve(String(reader.result));
					reader.onerror = () => reject(new Error('Could not read the selected image.'));
					reader.readAsDataURL(selectedFile);
				});

				const encryptedRef = await saveEncryptedMemberMediaDataUrl(memberId, kind, dataUrl);
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

			const result = await selectAndStoreMemberImage(
				memberId,
				kind,
				kind === 'avatar' ? avatar : banner
			);

			if (!result) return;

			if (kind === 'avatar') {
				avatar = result.path;
				avatarPreview = result.url;
			} else {
				banner = result.path;
				bannerPreview = result.url;
			}
		} catch (error) {
	console.error('Failed to save image:', error);

	errorMessage =
		error instanceof Error
			? `Could not save the ${kind} image: ${error.message}`
			: `Could not save the ${kind} image: ${String(error)}`;
}
	}

	async function saveMember() {
		errorMessage = '';

		if (!name.trim()) {
			errorMessage = 'Please give this member a name.';
			return;
		}

		saving = true;

		try {
			const newMember: Member = {
	id: memberId,
	name: name.trim(),
	pronouns: pronouns.trim(),
	aliases: aliases
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean),
	role: role.trim() || 'member',
	status: status.trim() || 'active',
	about: about.trim(),
	interests: interests
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean),
	frontTriggers: frontTriggers
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean),
	avatar,
	banner,
	isFronting: false,
	customFields
};

			if (isDesktop()) {
				const { initializeDatabase } = await import('$lib/db/database');
				const { createMember } = await import('$lib/repositories/members');

				await initializeDatabase();
				await createMember(newMember);
			} else {
				const { saveMemberRecord } = await import('$lib/crypto/vault');
				await saveMemberRecord(newMember);
			}

			await goto('/members');
		} catch (error) {
			console.error('Failed to create member:', error);

			errorMessage =
				error instanceof Error
					? error.message
					: 'Could not create this member.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Add Member — TECSPA™</title>

	<meta
		name="description"
		content="Add a new member to your TECSPA system."
	/>
</svelte:head>

<div class="page-shell">
	<div class="lace lace-top"></div>

	<header class="page-header">
		<div class="header-ornament">୨୧</div>

		<p class="eyebrow">TECSPA™ / members / new</p>

		<h1>add a member</h1>

		<p class="subtitle">
			create a new profile for someone in your system
		</p>

		<div class="ornament-line">
			<span>✦</span>
			<span>────────</span>
			<span>✦</span>
		</div>
	</header>

	<main class="content">
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

			{#if errorMessage}
				<div class="form-error">
					{errorMessage}
				</div>
			{/if}

			<section class="form-section custom-fields-section">
	<div class="section-heading">
		<span class="section-symbol">✧</span>

		<div>
			<p class="section-label">details</p>
			<h2>custom fields</h2>
		</div>
	</div>

	<div class="custom-fields-intro">
		<p>
			add any extra information you want to keep about this headmate.
		</p>

		<button
			type="button"
			class="add-custom-field-button"
			onclick={addCustomField}
		>
			<span>＋</span>
			<span>add field</span>
		</button>
	</div>

	{#if customFields.length === 0}
		<div class="custom-fields-empty">
			<span>୨୧</span>
			<p>no custom fields yet</p>
			<small>
				add something specific to this headmate whenever you need it.
			</small>
		</div>
	{:else}
		<div class="custom-fields-list">
			{#each customFields as field, index (field.id)}
				<article class="custom-field-card">
					<div class="custom-field-card-header">
						<div>
							<span class="custom-field-number">
								field {String(index + 1).padStart(2, '0')}
							</span>

							<h3>
								{field.label || 'unnamed field'}
							</h3>
						</div>

						<button
							type="button"
							class="custom-field-remove"
							onclick={() => removeCustomField(field.id)}
						>
							remove
						</button>
					</div>

					<div class="custom-field-grid">
						<div class="field">
							<label for={`new-field-label-${field.id}`}>
								field name
							</label>

							<input
								id={`new-field-label-${field.id}`}
								type="text"
								value={field.label}
								oninput={(event) =>
									updateCustomField(field.id, {
										label: event.currentTarget.value
									})}
								placeholder="favorite color, species, source, etc."
							/>
						</div>

						<div class="field">
							<label for={`new-field-type-${field.id}`}>
								field type
							</label>

							<select
								id={`new-field-type-${field.id}`}
								value={field.type}
								onchange={(event) =>
									updateCustomField(field.id, {
										type: event.currentTarget.value as Member['customFields'][number]['type']
									})}
							>
								<option value="text">text</option>
								<option value="long-text">long text</option>
								<option value="number">number</option>
								<option value="checkbox">checkbox</option>
								<option value="date">date</option>
								<option value="tags">tags</option>
							</select>
						</div>
					</div>

					<div class="field">
						<label for={`new-field-description-${field.id}`}>
							description
						</label>

						<input
							id={`new-field-description-${field.id}`}
							type="text"
							value={field.description}
							oninput={(event) =>
								updateCustomField(field.id, {
									description: event.currentTarget.value
								})}
							placeholder="optional little note about this field"
						/>
					</div>

					<div class="field">
						<label for={`new-field-value-${field.id}`}>
							value
						</label>

						{#if field.type === 'long-text'}
							<textarea
								id={`new-field-value-${field.id}`}
								rows="4"
								value={field.value}
								oninput={(event) =>
									updateCustomField(field.id, {
										value: event.currentTarget.value
									})}
								placeholder="write anything..."
							></textarea>
						{:else if field.type === 'checkbox'}
							<label class="custom-checkbox">
								<input
									type="checkbox"
									checked={field.value === 'true'}
									onchange={(event) =>
										updateCustomField(field.id, {
											value: event.currentTarget.checked
												? 'true'
												: 'false'
										})}
								/>

								<span>enabled</span>
							</label>
						{:else}
							<input
								id={`new-field-value-${field.id}`}
								type={field.type === 'number'
									? 'number'
									: field.type === 'date'
										? 'date'
										: 'text'}
								value={field.value}
								oninput={(event) =>
									updateCustomField(field.id, {
										value: event.currentTarget.value
									})}
								placeholder={
									field.type === 'tags'
										? 'tag one, tag two, tag three'
										: 'enter a value...'
								}
							/>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>

			<div class="form-actions">
				<a class="cancel-button" href="/members">
					cancel
				</a>

				<button
					class="submit-button"
					type="submit"
					disabled={saving}
				>
					{saving ? 'creating...' : 'create member'}
				</button>
			</div>
		</form>
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
	.submit-button {
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

	.submit-button {
		color: var(--tecspa-surface);
		background: var(--tecspa-accent-dark);
		border-color: var(--tecspa-accent-dark);
	}

	.cancel-button:hover,
	.submit-button:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.cancel-button:hover {
		background: var(--tecspa-surface);
		box-shadow:
			0 8px 20px
				color-mix(in srgb, var(--tecspa-text) 8%, transparent);
	}

	.submit-button:hover:not(:disabled) {
		background: var(--tecspa-accent);
		box-shadow:
			0 8px 22px
				color-mix(in srgb, var(--tecspa-text) 16%, transparent);
	}

	.submit-button:disabled {
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
		.submit-button {
			width: 100%;
		}
	}

	.add-custom-field-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		padding: 0.7rem 1rem;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background: var(--tecspa-surface);
		color: var(--tecspa-text);
		font: inherit;
		font-size: 0.78rem;
		letter-spacing: 0.05em;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			background 0.2s ease,
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.add-custom-field-button:hover {
		transform: translateY(-2px);
		background: var(--tecspa-surface-alt);
		border-color: var(--tecspa-accent);
		box-shadow:
			0 6px 16px
			color-mix(in srgb, var(--tecspa-text) 8%, transparent);
	}

</style>