<script lang="ts">
	import { browser } from '$app/environment';
	import { isDesktop } from '$lib/platform';

	import {
		parseAmpersandExport,
		type AmpersandImportData
	} from '$lib/importers/ampersand';

	import {
		parsePluralSpaceExport,
		type PluralSpaceImportData
	} from '$lib/importers/pluralspace';

	import type { AmpersandImportResult } from '$lib/repositories/ampersand-import';
	import { getDataAdapter } from '$lib/db/data-adapter';

	type ImportSource = 'ampersand' | 'pluralspace';

	let importSource: ImportSource = 'ampersand';

	let selectedFile = '';

	let importData: AmpersandImportData | null = null;
	let pluralSpaceData: PluralSpaceImportData | null = null;

	let loading = false;
	let importing = false;

	let errorMessage = '';

	let importComplete = false;
	let importResult: AmpersandImportResult | null = null;

	function resetImportState() {
		selectedFile = '';
		importData = null;
		pluralSpaceData = null;

		errorMessage = '';

		importComplete = false;
		importResult = null;
	}

	function selectSource(source: ImportSource) {
		if (loading || importing) {
			return;
		}

		importSource = source;
		resetImportState();
	}

	async function selectAmpersandExport() {
		resetImportState();

		if (isDesktop()) {
			const { open } = await import(
				'@tauri-apps/plugin-dialog'
			);

			const { readTextFile } = await import(
				'@tauri-apps/plugin-fs'
			);

			const selected = await open({
				multiple: false,
				directory: false,
				filters: [
					{
						name: 'JSON files',
						extensions: ['json']
					}
				]
			});

			if (typeof selected !== 'string') {
				return;
			}

			selectedFile = selected;
			loading = true;

			try {
				const json =
					await readTextFile(selected);

				importData =
					parseAmpersandExport(json);
			} catch (error) {
				errorMessage =
					error instanceof Error
						? error.message
						: 'The selected file could not be imported.';
			} finally {
				loading = false;
			}

			return;
		}

		if (!browser) {
			return;
		}

		const input =
			document.createElement('input');

		input.type = 'file';
		input.accept =
			'.json,application/json';

		input.onchange = async () => {
			const file =
				input.files?.[0];

			if (!file) {
				return;
			}

			selectedFile = file.name;
			loading = true;

			try {
				const json =
					await file.text();

				importData =
					parseAmpersandExport(json);
			} catch (error) {
				errorMessage =
					error instanceof Error
						? error.message
						: 'The selected file could not be imported.';
			} finally {
				loading = false;
			}
		};

		input.click();
	}

	async function selectPluralSpaceExport() {
		resetImportState();

		if (isDesktop()) {
			const { open } = await import(
				'@tauri-apps/plugin-dialog'
			);

			const { readFile } = await import(
				'@tauri-apps/plugin-fs'
			);

			const selected = await open({
				multiple: false,
				directory: false,
				filters: [
					{
						name: 'PluralSpace exports',
						extensions: [
							'zip',
							'json'
						]
					}
				]
			});

			if (typeof selected !== 'string') {
				return;
			}

			selectedFile = selected;
			loading = true;

			try {
				const bytes =
					await readFile(selected);

				pluralSpaceData =
					parsePluralSpaceExport(bytes);
			} catch (error) {
				errorMessage =
					error instanceof Error
						? error.message
						: 'The selected PluralSpace export could not be read.';
			} finally {
				loading = false;
			}

			return;
		}

		if (!browser) {
			return;
		}

		const input =
			document.createElement('input');

		input.type = 'file';
		input.accept =
			'.zip,.json,application/zip,application/json';

		input.onchange = async () => {
			const file =
				input.files?.[0];

			if (!file) {
				return;
			}

			selectedFile = file.name;
			loading = true;

			try {
				const bytes =
					new Uint8Array(
						await file.arrayBuffer()
					);

				pluralSpaceData =
					parsePluralSpaceExport(bytes);
			} catch (error) {
				errorMessage =
					error instanceof Error
						? error.message
						: 'The selected PluralSpace export could not be read.';
			} finally {
				loading = false;
			}
		};

		input.click();
	}

	async function confirmImport() {
		if (
			importSource === 'pluralspace'
		) {
			errorMessage =
				'PluralSpace preview is ready. The database import step is next.';
			return;
		}

		if (
			!importData ||
			importing ||
			importComplete
		) {
			return;
		}

		errorMessage = '';
		importing = true;

		try {
			const dataAdapter =
				getDataAdapter();

			importResult =
				await dataAdapter.importAmpersandData(
					importData
				);

			importComplete = true;
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: 'The system could not be imported.';
		} finally {
			importing = false;
		}
	}

	function clearImport() {
		resetImportState();
	}

	function fileName(path: string): string {
		return (
			path.split(/[\\/]/).pop() ??
			path
		);
	}
</script>

<svelte:head>
	<title>Import — TECSPA</title>
</svelte:head>

<div class="import-page">

	<nav class="top-navigation" aria-label="Main navigation">
		<a href="/" class="top-nav-link">
			<span>⌂</span>
			home
		</a>

		<a href="/members" class="top-nav-link">
			<span>୨୧</span>
			members
		</a>

		<a href="/customize" class="top-nav-link">
			<span>✦</span>
			customize
		</a>

		<a href="/import" class="top-nav-link active">
			<span>⇩</span>
			import
		</a>
	</nav>

	<div class="ornamental-header" aria-hidden="true">
		<span>༺</span>
		<div class="ornamental-line"></div>
		<span class="ornamental-center">❦</span>
		<div class="ornamental-line"></div>
		<span>༻</span>
	</div>

	<header class="page-header">
		<p class="eyebrow">TECSPA™ · DATA IMPORT</p>

		<h1>Import System</h1>

		<p class="subtitle">
			Bring an existing system into TECSPA from a supported system export..
		</p>

		<div class="header-ornament" aria-hidden="true">
			✦　୨୧　✦
		</div>
	</header>

<section class="source-selector">
	<div class="source-selector-heading">
		<div>
			<p class="eyebrow">IMPORT SOURCE</p>

			<h2>Choose an exporter</h2>

			<p>
				Select the format of the system export you want
				to bring into TECSPA.
			</p>
		</div>
	</div>

	<div class="source-selector-grid">
		<button
			type="button"
			class:active={importSource === 'ampersand'}
			class="source-card"
			onclick={() => selectSource('ampersand')}
			disabled={loading || importing}
		>
			<span class="source-symbol">A</span>

			<span class="source-card-content">
				<strong>Ampersand</strong>

				<span>
					Import an Ampersand JSON system export.
				</span>
			</span>

			{#if importSource === 'ampersand'}
				<span class="source-active">selected</span>
			{/if}
		</button>

		<button
			type="button"
			class:active={importSource === 'pluralspace'}
			class="source-card"
			onclick={() => selectSource('pluralspace')}
			disabled={loading || importing}
		>
			<span class="source-symbol">P</span>

			<span class="source-card-content">
				<strong>PluralSpace</strong>

				<span>
					Import a PluralSpace / OpenPlural JSON or ZIP export.
				</span>
			</span>

			{#if importSource === 'pluralspace'}
				<span class="source-active">selected</span>
			{/if}
		</button>
	</div>
</section>

	<section class="import-panel">
	<div class="panel-header">
		<div>
			{#if importSource === 'ampersand'}
				<h2>Ampersand Export</h2>

				<p>
					Choose an Ampersand JSON export to preview
					what will be imported into TECSPA.
				</p>
			{:else}
				<h2>PluralSpace Export</h2>

				<p>
					Choose a PluralSpace JSON or ZIP export to preview
					what can be imported into TECSPA.
				</p>
			{/if}
		</div>

			<div class="panel-symbol">↳</div>
		</div>

		<div class="file-picker">
	<div class="file-picker-info">
		{#if selectedFile}
			<div class="file-name">
				{fileName(selectedFile)}
			</div>

			<div class="file-path">
				{selectedFile}
			</div>
		{:else}
			<div class="file-name">
				No export selected
			</div>

			<div class="file-path">
				{#if importSource === 'ampersand'}
					Choose your Ampersand JSON export to begin.
				{:else}
					Choose your PluralSpace JSON or ZIP export to begin.
				{/if}
			</div>
		{/if}
	</div>

	<button
		class="secondary-button"
		type="button"
		onclick={
			importSource === 'ampersand'
				? selectAmpersandExport
				: selectPluralSpaceExport
		}
		disabled={loading}
	>
		{#if loading}
			Reading…
		{:else if importSource === 'ampersand'}
			Choose JSON
		{:else}
			Choose JSON / ZIP
		{/if}
	</button>
</div>

			<button
				class="secondary-button"
				type="button"
				onclick={selectAmpersandExport}
				disabled={loading}
			>
				{loading ? 'Reading…' : 'Choose JSON'}
			</button>
		</div>

		{#if errorMessage}
			<div class="error-box">
				<div class="error-title">
					Import could not be read
				</div>

				<div class="error-message">
					{errorMessage}
				</div>
			</div>
		{/if}

	{#if importData}
		<section class="preview-panel">
			<div class="preview-heading">
				<div>
					<p class="eyebrow">IMPORT PREVIEW</p>

					<h2>
						{importData.system.name}
					</h2>

					{#if importData.system.description}
						<p class="system-description">
							{importData.system.description}
						</p>
					{/if}
				</div>

				<div class="ready-badge">
					READY TO REVIEW
				</div>
			</div>

			<div class="summary-grid">
				<div class="summary-card">
					<span class="summary-value">
						{importData.summary.memberCount}
					</span>

					<span class="summary-label">
						Members
					</span>
				</div>

				<div class="summary-card">
					<span class="summary-value">
						{importData.summary.frontHistoryCount}
					</span>

					<span class="summary-label">
						Fronting Entries
					</span>
				</div>

				<div class="summary-card">
					<span class="summary-value">
						{importData.summary.customFieldCount}
					</span>

					<span class="summary-label">
						Custom Fields
					</span>
				</div>

				<div class="summary-card">
					<span class="summary-value">
						{importData.summary.memberImages}
					</span>

					<span class="summary-label">
						Member Images
					</span>
				</div>

				<div class="summary-card">
					<span class="summary-value">
						{importData.summary.memberBanners}
					</span>

					<span class="summary-label">
						Member Banners
					</span>
				</div>

				<div class="summary-card">
					<span class="summary-value">
						{importData.summary.systemImage ? 'YES' : 'NO'}
					</span>

					<span class="summary-label">
						System Image
					</span>
				</div>
			</div>

			<div class="preview-section">
				<div class="section-heading">
					<h3>Members</h3>

					<span>
						{importData.members.length}
					</span>
				</div>

				<div class="member-preview-list">
					{#each importData.members as item}
						<div class="member-preview">
							<div class="member-preview-main">
								<div class="member-name">
									{item.member.name}
								</div>

								<div class="member-meta">
									{#if item.member.pronouns}
										<span>
											{item.member.pronouns}
										</span>
									{/if}

									{#if item.member.role}
										<span>
											{item.member.role}
										</span>
									{/if}

									<span
										class:archived={
											item.member.status === 'archived'
										}
										class="status"
									>
										{item.member.status}
									</span>

									{#if item.member.isFronting}
										<span class="fronting">
											fronting
										</span>
									{/if}
								</div>
							</div>

							<div class="member-preview-counts">
								{#if item.member.avatar}
									<span>avatar</span>
								{/if}

								{#if item.member.banner}
									<span>banner</span>
								{/if}

								{#if item.member.customFields.length > 0}
									<span>
										{item.member.customFields.length}
										fields
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			{#if importData.warnings.length > 0}
				<div class="preview-section warnings-section">
					<div class="section-heading warning-heading">
						<div>
							<h3>Warnings</h3>

							<p>
								These items will not be silently converted
								into unrelated TECSPA data.
							</p>
						</div>

						<span>
							{importData.warnings.length}
						</span>
					</div>

					<div class="warning-list">
						{#each importData.warnings as warning}
							<div class="warning-item">
								<span class="warning-icon">!</span>

								<span>{warning}</span>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="success-box">
					<div class="success-icon">✓</div>

					<div>
						<strong>No import warnings.</strong>

						<p>
							Everything in this export currently has a
							clear TECSPA mapping.
						</p>
					</div>
				</div>
			{/if}

			{#if importComplete && importResult}
	<div class="success-box import-complete-box">
		<div class="success-icon">✓</div>

		<div>
			<strong>
				{importResult.memberCount}
				{importResult.memberCount === 1
					? ' member'
					: ' members'}
				imported successfully.
			</strong>

			<p>
				{importResult.frontHistoryCount}
				fronting history entries and
				{importResult.imageCount}
				avatars /
				{importResult.bannerCount}
				banners were imported into TECSPA.
			</p>

			<p>
				Your imported members are now stored in the
				TECSPA SQLite database.
			</p>
		</div>
	</div>
{:else}
	<div class="import-note">
		<strong>Ready to import.</strong>

		<p>
			Click Import System to add this system's
			members, custom fields, fronting history,
			and embedded member imagery to TECSPA.
		</p>
	</div>
{/if}

<div class="actions">
	<button
		class="secondary-button"
		type="button"
		onclick={clearImport}
		disabled={importing}
	>
		Cancel
	</button>

	<button
		class="primary-button"
		type="button"
		onclick={confirmImport}
		disabled={importing || importComplete}
	>
		{#if importing}
			Importing…
		{:else if importComplete}
			Imported ✓
		{:else}
			Import System
		{/if}
	</button>
</div>
		</section>
	{/if}

{#if pluralSpaceData}
	<section class="preview-panel pluralspace-preview">
		<div class="preview-heading">
			<div>
				<p class="eyebrow">
					PLURALSPACE / OPENPLURAL PREVIEW
				</p>

				<h2>
					{pluralSpaceData.system.name}
				</h2>

				{#if pluralSpaceData.system.description}
					<p class="system-description">
						{pluralSpaceData.system.description}
					</p>
				{/if}
			</div>

			<div class="ready-badge">
				READY TO REVIEW
			</div>
		</div>

		<div class="summary-grid">
			<div class="summary-card">
				<span class="summary-value">
					{pluralSpaceData.members.length}
				</span>

				<span class="summary-label">
					Members
				</span>
			</div>

			<div class="summary-card">
				<span class="summary-value">
					{pluralSpaceData.frontHistory.length}
				</span>

				<span class="summary-label">
					Fronting Entries
				</span>
			</div>

			<div class="summary-card">
				<span class="summary-value">
					{pluralSpaceData.customFields.length}
				</span>

				<span class="summary-label">
					Custom Fields
				</span>
			</div>

			<div class="summary-card">
				<span class="summary-value">
					{pluralSpaceData.journalEntries.length}
				</span>

				<span class="summary-label">
					Journal Entries
				</span>
			</div>

			<div class="summary-card">
				<span class="summary-value">
					{pluralSpaceData.media.length}
				</span>

				<span class="summary-label">
					Bundled Media
				</span>
			</div>

			<div class="summary-card">
				<span class="summary-value">
					{pluralSpaceData.sourceVersion || '—'}
				</span>

				<span class="summary-label">
					OpenPlural Version
				</span>
			</div>
		</div>

		<div class="preview-section">
			<div class="section-heading">
				<div>
					<h3>Members</h3>

					<p>
						These members were parsed from the PluralSpace export.
					</p>
				</div>

				<span>
					{pluralSpaceData.members.length}
				</span>
			</div>

			<div class="member-preview-list">
				{#each pluralSpaceData.members as member}
					<div class="member-preview">
						<div class="member-preview-main">
							<div class="member-name">
								{member.name}
							</div>

							<div class="member-meta">
								{#if member.pronouns}
									<span>
										{member.pronouns}
									</span>
								{/if}

								{#if member.role}
									<span>
										{member.role}
									</span>
								{/if}

								<span
									class:archived={
										member.status === 'archived'
									}
									class="status"
								>
									{member.status}
								</span>

								{#if member.isFronting}
									<span class="fronting">
										fronting
									</span>
								{/if}
							</div>
						</div>

						<div class="member-preview-counts">
							{#if member.avatar}
								<span>avatar</span>
							{/if}

							{#if member.banner}
								<span>banner</span>
							{/if}

							{#if member.customFields.length > 0}
								<span>
									{member.customFields.length}
									fields
								</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>

		{#if pluralSpaceData.warnings.length > 0}
			<div class="preview-section warnings-section">
				<div class="section-heading warning-heading">
					<div>
						<h3>Warnings</h3>

						<p>
							These parts of the PluralSpace export have
							not been silently converted into unrelated
							TECSPA data.
						</p>
					</div>

					<span>
						{pluralSpaceData.warnings.length}
					</span>
				</div>

				<div class="warning-list">
					{#each pluralSpaceData.warnings as warning}
						<div class="warning-item">
							<span class="warning-icon">!</span>

							<span>{warning}</span>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="success-box">
				<div class="success-icon">✓</div>

				<div>
					<strong>
						No mapping warnings.
					</strong>

					<p>
						Everything currently represented by this
						parser has a TECSPA mapping.
					</p>
				</div>
			</div>
		{/if}

		<div class="import-note">
			<strong>
				PluralSpace export parsed successfully.
			</strong>

			<p>
				The file is safe to review. The next step is connecting
				this normalized data to TECSPA's database import pipeline.
			</p>
		</div>

		<div class="actions">
			<button
				class="secondary-button"
				type="button"
				onclick={clearImport}
				disabled={importing}
			>
				Cancel
			</button>

			<button
				class="primary-button"
				type="button"
				onclick={confirmImport}
				disabled={importing}
			>
				Database Import — Next Step
			</button>
		</div>
	</section>
{/if}

<style>
	/* =========================================================
	   PAGE
	   ========================================================= */

	.import-page {
		position: relative;

		width: min(1120px, 100%);
		margin: 0 auto;
		padding: 1.5rem 2rem 3rem;

		box-sizing: border-box;

		color: var(--tecspa-text);
		font-family: var(--tecspa-body-font);
	}


	/* =========================================================
	   TOP NAVIGATION
	   ========================================================= */

	.top-navigation {
		position: relative;
		z-index: 2;

		display: flex;
		align-items: center;
		justify-content: center;

		flex-wrap: wrap;

		gap: 4px;

		margin: 0 auto 20px;
		padding: 6px;

		border-top: 1px solid var(--tecspa-border);
		border-bottom: 1px solid var(--tecspa-border);

		background:
			color-mix(
				in srgb,
				var(--tecspa-surface) 72%,
				transparent
			);

		box-shadow:
			0 1px 0
			color-mix(
				in srgb,
				var(--tecspa-text) 6%,
				transparent
			)
			inset;
	}

	.top-nav-link {
		position: relative;

		display: inline-flex;
		align-items: center;

		gap: 7px;

		padding: 7px 16px;

		color: var(--tecspa-text-muted);

		text-decoration: none;

		font-family: var(--tecspa-heading-font);
		font-size: 1.02rem;
		font-weight: 600;

		transition:
			color 160ms ease,
			background 160ms ease,
			transform 160ms ease;
	}

	.top-nav-link span {
		color: var(--tecspa-accent);

		font-family: Georgia, serif;
		font-size: 0.9rem;
	}

	.top-nav-link:hover {
		color: var(--tecspa-accent-dark);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 8%,
				transparent
			);

		transform: translateY(-1px);
	}

	.top-nav-link.active {
		color: var(--tecspa-accent-dark);
	}

	.top-nav-link.active::after {
		content: '';

		position: absolute;

		left: 15px;
		right: 15px;
		bottom: 2px;

		height: 1px;

		background: var(--tecspa-accent);
	}


	/* =========================================================
	   ORNAMENTAL HEADER
	   ========================================================= */

	.ornamental-header {
		display: flex;
		align-items: center;

		gap: 12px;

		margin: 4px 0 12px;

		color: var(--tecspa-accent);

		font-family: Georgia, serif;
		font-size: 0.9rem;

		opacity: var(--tecspa-ornament-opacity);
	}

	.ornamental-header > span:first-child {
		margin-left: 2%;
	}

	.ornamental-header > span:last-child {
		margin-right: 2%;
	}

	.ornamental-line {
		flex: 1;

		height: 1px;

		background:
			linear-gradient(
				90deg,
				transparent,
				var(--tecspa-border),
				transparent
			);
	}

	.ornamental-center {
		font-size: 1.05rem;
	}


	/* =========================================================
	   PAGE HEADER
	   ========================================================= */

	.page-header {
		position: relative;

		margin-bottom: 2rem;

		padding: 1.5rem 1rem 1.25rem;

		text-align: center;
	}

	.eyebrow {
		margin: 0 0 0.55rem;

		color: var(--tecspa-accent);

		font-family: var(--tecspa-heading-font);
		font-size: 0.72rem;
		font-weight: 800;

		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	h1,
	h2,
	h3,
	p {
		margin-top: 0;
	}

	h1 {
		margin-bottom: 0.55rem;

		color: var(--tecspa-text);

		font-family: var(--tecspa-heading-font);
		font-size: clamp(2.4rem, 6vw, 4rem);
		font-weight: 700;

		letter-spacing: 0.025em;
	}

	.subtitle {
		max-width: 680px;
		margin: 0 auto;

		color: var(--tecspa-text-muted);

		font-size: 0.95rem;
		line-height: 1.7;
	}

	.header-ornament {
		margin-top: 1rem;

		color: var(--tecspa-accent);

		font-family: Georgia, serif;
		font-size: 1rem;

		letter-spacing: 0.3rem;

		opacity: var(--tecspa-ornament-opacity);
	}


	/* =========================================================
	   PANELS
	   ========================================================= */

	.import-panel,
	.preview-panel {
		position: relative;

		padding: 1.5rem;

		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);

		background:
			color-mix(
				in srgb,
				var(--tecspa-surface) 96%,
				var(--tecspa-background)
			);

		box-shadow: var(--tecspa-panel-shadow);

		overflow: hidden;
	}

	.import-panel::before,
	.preview-panel::before {
		content: '';

		position: absolute;

		top: 0;
		left: 12%;
		right: 12%;

		height: 1px;

		background:
			linear-gradient(
				90deg,
				transparent,
				var(--tecspa-accent),
				transparent
			);

		opacity: 0.5;
	}

	.preview-panel {
		margin-top: 1.5rem;
	}


	/* =========================================================
	   PANEL HEADER
	   ========================================================= */

	.panel-header,
	.preview-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;

		gap: 1.5rem;
	}

	.panel-header h2,
	.preview-heading h2 {
		margin-bottom: 0.5rem;

		color: var(--tecspa-text);

		font-family: var(--tecspa-heading-font);
		font-size: 1.8rem;
	}

	.panel-header p,
	.system-description {
		margin-bottom: 0;

		color: var(--tecspa-text-muted);

		line-height: 1.65;
	}

	.panel-symbol {
		flex-shrink: 0;

		color: var(--tecspa-accent);

		font-family: Georgia, serif;
		font-size: 2.2rem;

		opacity: var(--tecspa-ornament-opacity);
	}

	.ready-badge {
		flex-shrink: 0;

		padding: 0.45rem 0.75rem;

		border: 1px solid var(--tecspa-accent);
		border-radius: 999px;

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 7%,
				transparent
			);

		color: var(--tecspa-accent-dark);

		font-size: 0.65rem;
		font-weight: 800;

		letter-spacing: 0.1em;
		white-space: nowrap;
	}


	/* =========================================================
	   FILE PICKER
	   ========================================================= */

	.file-picker {
		display: flex;
		align-items: center;
		justify-content: space-between;

		gap: 1.25rem;

		margin-top: 1.5rem;
		padding: 1.15rem;

		border: 1px dashed var(--tecspa-border);
		border-radius: calc(var(--tecspa-panel-radius) * 0.7);

		background:
			color-mix(
				in srgb,
				var(--tecspa-surface-alt) 80%,
				transparent
			);

		transition:
			border-color 160ms ease,
			background 160ms ease;
	}

	.file-picker:hover {
		border-color: var(--tecspa-accent);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 4%,
				var(--tecspa-surface-alt)
			);
	}

	.file-picker-info {
		min-width: 0;
	}

	.file-name {
		color: var(--tecspa-text);

		font-family: var(--tecspa-heading-font);
		font-size: 1rem;
		font-weight: 700;

		overflow-wrap: anywhere;
	}

	.file-path {
		margin-top: 0.3rem;

		color: var(--tecspa-text-muted);

		font-size: 0.75rem;

		overflow-wrap: anywhere;
	}


	/* =========================================================
	   BUTTONS
	   ========================================================= */

	button {
		font: inherit;
	}

	.secondary-button,
	.primary-button {
		position: relative;

		display: inline-flex;
		align-items: center;
		justify-content: center;

		flex-shrink: 0;

		min-height: 42px;

		padding: 0.65rem 1.1rem;

		border-radius: calc(var(--tecspa-panel-radius) * 0.65);

		font-family: var(--tecspa-heading-font);
		font-size: 0.9rem;
		font-weight: 700;

		cursor: pointer;

		transition:
			transform 140ms ease,
			background 140ms ease,
			border-color 140ms ease,
			box-shadow 140ms ease,
			opacity 140ms ease;
	}

	.secondary-button {
		border: 1px solid var(--tecspa-accent);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 8%,
				var(--tecspa-surface)
			);

		color: var(--tecspa-accent-dark);

		box-shadow:
			0 2px 0
			color-mix(
				in srgb,
				var(--tecspa-accent-dark) 10%,
				transparent
			);
	}

	.secondary-button:hover:not(:disabled) {
		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 14%,
				var(--tecspa-surface)
			);

		box-shadow:
			0 5px 14px
			color-mix(
				in srgb,
				var(--tecspa-accent-dark) 12%,
				transparent
			);

		transform: translateY(-1px);
	}

	.primary-button {
		border: 1px solid var(--tecspa-accent);

		background: var(--tecspa-accent);

		color: var(--tecspa-background);

		box-shadow:
			0 3px 12px
			color-mix(
				in srgb,
				var(--tecspa-accent-dark) 15%,
				transparent
			);
	}

	.primary-button:hover:not(:disabled) {
		background: var(--tecspa-accent-dark);

		transform: translateY(-1px);
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.48;
	}


	/* =========================================================
	   ERROR
	   ========================================================= */

	.error-box {
		margin-top: 1rem;
		padding: 1rem;

		border: 1px solid
			color-mix(
				in srgb,
				var(--tecspa-accent-dark) 40%,
				var(--tecspa-border)
			);

		border-radius: calc(var(--tecspa-panel-radius) * 0.65);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 7%,
				var(--tecspa-surface)
			);
	}

	.error-title {
		margin-bottom: 0.35rem;

		color: var(--tecspa-accent-dark);

		font-weight: 800;
	}

	.error-message {
		color: var(--tecspa-text);

		white-space: pre-line;

		line-height: 1.5;
	}


	/* =========================================================
	   SUMMARY CARDS
	   ========================================================= */

	.summary-grid {
		display: grid;

		grid-template-columns: repeat(
			3,
			minmax(0, 1fr)
		);

		gap: 0.75rem;

		margin-top: 1.5rem;
	}

	.summary-card {
		position: relative;

		padding: 1rem;

		border: 1px solid var(--tecspa-border);
		border-radius: calc(var(--tecspa-panel-radius) * 0.7);

		background:
			color-mix(
				in srgb,
				var(--tecspa-surface-alt) 80%,
				transparent
			);

		text-align: center;

		transition:
			transform 140ms ease,
			border-color 140ms ease;
	}

	.summary-card:hover {
		border-color: var(--tecspa-accent);

		transform: translateY(-2px);
	}

	.summary-value {
		display: block;

		color: var(--tecspa-accent);

		font-family: var(--tecspa-heading-font);
		font-size: 1.65rem;
		font-weight: 800;
	}

	.summary-label {
		display: block;

		margin-top: 0.25rem;

		color: var(--tecspa-text-muted);

		font-size: 0.7rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}


	/* =========================================================
	   PREVIEW SECTIONS
	   ========================================================= */

	.preview-section {
		margin-top: 2rem;
	}

	.section-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;

		gap: 1rem;

		margin-bottom: 0.75rem;
	}

	.section-heading h3 {
		margin: 0;

		color: var(--tecspa-text);

		font-family: var(--tecspa-heading-font);
		font-size: 1.25rem;
	}

	.section-heading > span {
		min-width: 2rem;

		padding: 0.25rem 0.55rem;

		border: 1px solid var(--tecspa-border);
		border-radius: 999px;

		background: var(--tecspa-surface-alt);

		color: var(--tecspa-text-muted);

		font-size: 0.7rem;
		font-weight: 800;

		text-align: center;
	}

	.warning-heading {
		align-items: flex-start;
	}

	.warning-heading p {
		margin: 0.25rem 0 0;

		color: var(--tecspa-text-muted);

		font-size: 0.8rem;
		line-height: 1.5;
	}


	/* =========================================================
	   MEMBER PREVIEW
	   ========================================================= */

	.member-preview-list {
		display: flex;
		flex-direction: column;

		border: 1px solid var(--tecspa-border);
		border-radius: calc(var(--tecspa-panel-radius) * 0.7);

		overflow: hidden;
	}

	.member-preview {
		display: flex;
		align-items: center;
		justify-content: space-between;

		gap: 1rem;

		padding: 0.9rem 1rem;

		background: var(--tecspa-surface);

		transition:
			background 140ms ease;
	}

	.member-preview:nth-child(even) {
		background:
			color-mix(
				in srgb,
				var(--tecspa-surface-alt) 35%,
				var(--tecspa-surface)
			);
	}

	.member-preview:hover {
		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 4%,
				var(--tecspa-surface)
			);
	}

	.member-preview + .member-preview {
		border-top: 1px solid var(--tecspa-border);
	}

	.member-preview-main {
		min-width: 0;
	}

	.member-name {
		color: var(--tecspa-text);

		font-family: var(--tecspa-heading-font);
		font-weight: 700;

		overflow-wrap: anywhere;
	}

	.member-meta,
	.member-preview-counts {
		display: flex;
		flex-wrap: wrap;

		gap: 0.35rem;

		margin-top: 0.4rem;
	}

	.member-meta span,
	.member-preview-counts span {
		padding: 0.2rem 0.5rem;

		border: 1px solid var(--tecspa-border);
		border-radius: 999px;

		background: var(--tecspa-surface-alt);

		color: var(--tecspa-text-muted);

		font-size: 0.65rem;
	}

	.member-meta .status.archived {
		color: var(--tecspa-accent-dark);
	}

	.member-meta .fronting {
		border-color: var(--tecspa-accent);

		color: var(--tecspa-accent-dark);

		font-weight: 800;
	}

	.member-preview-counts {
		flex-shrink: 0;

		justify-content: flex-end;
	}


	/* =========================================================
	   WARNINGS
	   ========================================================= */

	.warnings-section {
		padding: 1rem;

		border: 1px solid var(--tecspa-border);
		border-radius: calc(var(--tecspa-panel-radius) * 0.7);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 4%,
				var(--tecspa-surface)
			);
	}

	.warning-list {
		display: flex;
		flex-direction: column;

		gap: 0.45rem;
	}

	.warning-item {
		display: flex;
		align-items: flex-start;

		gap: 0.65rem;

		padding: 0.6rem 0;

		color: var(--tecspa-text);

		font-size: 0.82rem;
		line-height: 1.55;
	}

	.warning-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		flex-shrink: 0;

		width: 1.35rem;
		height: 1.35rem;

		border-radius: 50%;

		background: var(--tecspa-accent);

		color: var(--tecspa-background);

		font-size: 0.7rem;
		font-weight: 900;
	}


	/* =========================================================
	   SUCCESS
	   ========================================================= */

	.success-box {
		display: flex;
		align-items: flex-start;

		gap: 0.75rem;

		margin-top: 2rem;
		padding: 1rem;

		border: 1px solid var(--tecspa-border);
		border-radius: calc(var(--tecspa-panel-radius) * 0.7);

		background: var(--tecspa-surface-alt);

		color: var(--tecspa-text);
	}

	.success-icon {
		color: var(--tecspa-accent);

		font-size: 1.2rem;
		font-weight: 900;
	}

	.success-box strong {
		color: var(--tecspa-text);
	}

	.success-box p {
		margin: 0.25rem 0 0;

		color: var(--tecspa-text-muted);

		font-size: 0.82rem;
		line-height: 1.5;
	}


	/* =========================================================
	   IMPORT NOTE
	   ========================================================= */

	.import-note {
		margin-top: 1.5rem;
		padding: 1rem 1.1rem;

		border-left: 3px solid var(--tecspa-accent);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 5%,
				var(--tecspa-surface-alt)
			);

		color: var(--tecspa-text);
	}

	.import-note strong {
		font-family: var(--tecspa-heading-font);
	}

	.import-note p {
		margin: 0.35rem 0 0;

		color: var(--tecspa-text-muted);

		font-size: 0.82rem;
		line-height: 1.55;
	}


	/* =========================================================
	   ACTIONS
	   ========================================================= */

	.actions {
		display: flex;
		justify-content: flex-end;

		gap: 0.75rem;

		margin-top: 1.5rem;

		padding-top: 1rem;

		border-top: 1px solid var(--tecspa-border);
	}


	/* =========================================================
	   RESPONSIVE
	   ========================================================= */

	@media (max-width: 800px) {
		.import-page {
			padding: 1rem 1rem 2rem;
		}

		.summary-grid {
			grid-template-columns: repeat(
				2,
				minmax(0, 1fr)
			);
		}
	}

	@media (max-width: 650px) {
		.top-navigation {
			justify-content: stretch;
		}

		.top-nav-link {
			flex: 1 1 auto;
			justify-content: center;
		}

		.panel-header,
		.preview-heading,
		.file-picker,
		.member-preview {
			align-items: stretch;
			flex-direction: column;
		}

		.panel-symbol {
			display: none;
		}

		.ready-badge {
			align-self: flex-start;
		}

		.file-picker .secondary-button {
			width: 100%;
		}

		.member-preview-counts {
			justify-content: flex-start;
		}

		.actions {
			flex-direction: column-reverse;
		}

		.actions button {
			width: 100%;
		}
	}

	@media (max-width: 450px) {
		.summary-grid {
			grid-template-columns: 1fr;
		}

		.page-header {
			padding-inline: 0;
		}

		h1 {
			font-size: 2.2rem;
		}
	}

.import-complete-box {
	margin-top: 1.5rem;
}

.source-selector {
	margin-bottom: 1.5rem;
	padding: 1.5rem;
	border: 1px solid var(--tecspa-border);
	background: var(--tecspa-surface);
}

.source-selector-heading {
	margin-bottom: 1rem;
}

.source-selector-heading h2 {
	margin: 0.2rem 0 0.4rem;
}

.source-selector-heading p:last-child {
	margin: 0;
	opacity: 0.75;
}

.source-selector-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1rem;
}

.source-card {
	position: relative;
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1.1rem;
	border: 1px solid var(--tecspa-border);
	background: var(--tecspa-background);
	color: inherit;
	text-align: left;
	cursor: pointer;
	transition:
		border-color 0.2s ease,
		background 0.2s ease,
		transform 0.2s ease;
}

.source-card:hover:not(:disabled) {
	transform: translateY(-1px);
	border-color: var(--tecspa-accent);
}

.source-card.active {
	border-color: var(--tecspa-accent);
	background: var(--tecspa-surface-alt);
}

.source-card:disabled {
	opacity: 0.6;
	cursor: default;
}

.source-symbol {
	display: grid;
	place-items: center;
	width: 2.5rem;
	height: 2.5rem;
	flex: 0 0 2.5rem;
	border: 1px solid var(--tecspa-border);
	font-weight: 700;
	color: var(--tecspa-accent);
}

.source-card-content {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	min-width: 0;
}

.source-card-content strong {
	font-size: 1rem;
}

.source-card-content span {
	font-size: 0.85rem;
	opacity: 0.7;
}

.source-active {
	margin-left: auto;
	font-size: 0.7rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--tecspa-accent);
	white-space: nowrap;
}

.pluralspace-preview {
	margin-top: 1.5rem;
}

@media (max-width: 700px) {
	.source-selector-grid {
		grid-template-columns: 1fr;
	}

	.source-card {
		align-items: flex-start;
	}

	.source-active {
		display: none;
	}
}

</style>