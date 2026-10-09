<script lang="ts">
	import { onMount } from 'svelte';
	import { loadTheme, type ThemeSettings } from '$lib/theme/theme';

	let systemName = 'TECSPA';
	let tagline = 'the extremely customizable plural app™';

	let theme: ThemeSettings = loadTheme();

	onMount(() => {
		const handleThemeChange = (event: Event) => {
			const customEvent = event as CustomEvent<ThemeSettings>;
			theme = customEvent.detail;
		};

		window.addEventListener('tecspa-theme-change', handleThemeChange);

		return () => {
			window.removeEventListener('tecspa-theme-change', handleThemeChange);
		};
	});

	$: symbols = theme.symbols ?? ['✦', '♡', '୨୧', '❧'];
	$: primarySymbol = symbols[0] ?? '✦';
	$: secondarySymbol = symbols[1] ?? '♡';
	$: tertiarySymbol = symbols[2] ?? '୨୧';
</script>

<svelte:head>
	<title>{systemName}™</title>

	<meta
		name="description"
		content="The Extremely Customizable Plural App™"
	/>
</svelte:head>

<div class="background">
	<!-- =====================================================
	     FLOATING DECORATIONS
	     ===================================================== -->

	<div class="floating-decoration decoration-one" aria-hidden="true">
		{primarySymbol}
	</div>

	<div class="floating-decoration decoration-two" aria-hidden="true">
		{tertiarySymbol}
	</div>

	<div class="floating-decoration decoration-three" aria-hidden="true">
		{secondarySymbol}
	</div>

	<div class="floating-decoration decoration-four" aria-hidden="true">
		✧
	</div>

	<!-- =====================================================
	     MAIN PAGE
	     ===================================================== -->

	<main class="page">
		<!-- =================================================
		     TOP NAVIGATION
		     ================================================= -->
<nav class="top-navigation" aria-label="Main navigation">
	<a href="/" class="top-nav-link active">
		<span>⌂</span>
		home
	</a>

	<a href="/members" class="top-nav-link">
		<span>୨୧</span>
		members
	</a>

<a href="/communities" class="top-nav-link">
    <span>✦</span>
    communities
</a>

	<a href="/chat" class="top-nav-link">
		<span>❧</span>
		chat
	</a>

	<a href="/customize" class="top-nav-link">
		<span>✦</span>
		customize
	</a>

	<a href="/import" class="top-nav-link">
		<span>⇩</span>
		import
	</a>

<a href="/sharing" class="top-nav-link">
    <span>♢</span>
    sharing
</a>
</nav>
		<!-- =================================================
		     ORNAMENTAL HEADER
		     ================================================= -->

		<div class="ornamental-header" aria-hidden="true">
			<span>{secondarySymbol}</span>
			<span class="ornamental-line"></span>
			<span class="ornamental-center">{primarySymbol}</span>
			<span class="ornamental-line"></span>
			<span>{secondarySymbol}</span>
		</div>

		<!-- =================================================
		     HERO / BANNER
		     ================================================= -->

		<section class="hero">
			<div class="hero-corner hero-corner-left" aria-hidden="true">
				༺
			</div>

			<div class="hero-corner hero-corner-right" aria-hidden="true">
				༻
			</div>

			<div class="hero-inner">
				<p class="hero-kicker">
					{secondarySymbol} welcome to your space {secondarySymbol}
				</p>

				<h1>
					{systemName}<sup>™</sup>
				</h1>

				<div class="hero-divider" aria-hidden="true">
					<span>{primarySymbol}</span>
					<span>────────</span>
					<span>{primarySymbol}</span>
				</div>

				<p class="tagline">{tagline}</p>

				<p class="hero-note">
					a personal little corner of the internet
					<br />
					for your system, your people, and everything in between.
				</p>
			</div>
		</section>

<!-- =========================================================
     THEME ART STRIP
     ========================================================= -->

<section class="theme-art-strip" aria-hidden="true">

	<!-- Digital Cobalt -->
	<div class="theme-art-world digital-cobalt-art">
		<img
			src="/theme-art/digital-cobalt/blue-webcore-collage.jpg"
			alt=""
		/>

		<img
			src="/theme-art/digital-cobalt/windows-xp-error.png"
			alt=""
		/>

		<img
			src="/theme-art/digital-cobalt/windows-media-player.png"
			alt=""
		/>
	</div>


	<!-- Ashen Gothic -->
	<div class="theme-art-world ashen-gothic-art">
		<img
			src="/theme-art/ashen-gothic/mourning-ribbon.webp"
			alt=""
		/>

		<img
			src="/theme-art/ashen-gothic/lace-heart.png"
			alt=""
		/>

		<img
			src="/theme-art/ashen-gothic/angelic-veil.jpg"
			alt=""
		/>
	</div>


	<!-- Crimson Clinical -->
<div class="theme-art-world crimson-clinical-art">
	<img
		class="crimson-lace-top"
		src="/theme-art/crimson-clinical/lace-divider-top.png"
		alt=""
	/>

	<img
		class="crimson-lace-bottom"
		src="/theme-art/crimson-clinical/lace-divider-bottom.png"
		alt=""
	/>
</div>


	<!-- Ivory Unicorn -->
	<div class="theme-art-world ivory-unicorn-art">
		<img class="ivory-swans" src="/theme-art/ivory-unicorn/swans.jpg" alt="" />
		<img class="ivory-porcelain" src="/theme-art/ivory-unicorn/porcelain.jpg" alt="" />
		<img class="ivory-horse" src="/theme-art/ivory-unicorn/horse.jpg" alt="" />
		<img class="ivory-tea-set" src="/theme-art/ivory-unicorn/tea-set.jpg" alt="" />
		<img class="ivory-teacup" src="/theme-art/ivory-unicorn/teacup.jpg" alt="" />
		<img class="ivory-floral" src="/theme-art/ivory-unicorn/floral-silhouette.png" alt="" />
		<img class="ivory-scroll" src="/theme-art/ivory-unicorn/white-scroll.png" alt="" />
		<img class="ivory-bow" src="/theme-art/ivory-unicorn/silver-bow-divider.png" alt="" />
		<img class="ivory-key" src="/theme-art/ivory-unicorn/silver-key.png" alt="" />
	</div>

</section>

		<!-- =================================================
		     LITTLE STATUS STRIP
		     ================================================= -->

		<section class="status-strip" aria-label="TECSPA">
			<div>
				<span class="status-symbol">{primarySymbol}</span>
				<span>personal</span>
			</div>

			<span class="status-divider">·</span>

			<div>
				<span class="status-symbol">{secondarySymbol}</span>
				<span>private</span>
			</div>

			<span class="status-divider">·</span>

			<div>
				<span class="status-symbol">{tertiarySymbol}</span>
				<span>customizable</span>
			</div>
		</section>

		<!-- =================================================
		     SYSTEM INTRODUCTION
		     ================================================= -->

		<section class="intro">
			<div class="intro-decoration" aria-hidden="true">
				<div class="portrait-frame">
					<div class="portrait">
						<span>{secondarySymbol}</span>
					</div>
				</div>

				<p>{primarySymbol} {primarySymbol} {primarySymbol}</p>
			</div>

			<div class="intro-text">
				<p class="eyebrow">
					{primarySymbol} system profile
				</p>

				<h2>Welcome home.</h2>

				<p class="intro-copy">
					This is your personal space for keeping track of your
					system, your members, your connections, and everything
					else that makes your experience uniquely yours.
				</p>

				<p class="intro-whisper">
					𓂃˖ ࣪⊹ make it strange. make it soft. make it yours. 𓂃˖ ࣪⊹
				</p>

				<div class="identity">
					<span>{primarySymbol} plural system</span>
					<span>{secondarySymbol} customizable</span>
					<span>{tertiarySymbol} yours</span>
				</div>
			</div>
		</section>

		<!-- =================================================
		     DIVIDER
		     ================================================= -->

		<div class="major-divider" aria-hidden="true">
			<span></span>
			<strong>{theme.divider}</strong>
			<span></span>
		</div>

		<!-- =================================================
		     QUICK LINKS
		     ================================================= -->

		<section class="links-section">
			<div class="section-heading">
				<p class="eyebrow">
					{tertiarySymbol} explore
				</p>

				<h2>your space</h2>

				<p class="section-description">
					little doors into the different corners of TECSPA
				</p>
			</div>

			<div class="link-grid">
				<a class="link-card" href="/members">
					<div class="card-top">
						<span class="card-symbol">{secondarySymbol}</span>
						<span class="card-number">01</span>
					</div>

					<div class="card-content">
						<strong>members</strong>

						<small>
							your headmates & profiles
						</small>
					</div>

					<span class="card-arrow">↗</span>
				</a>

<a class="link-card" href="/journal">
	<div class="card-top">
		<span class="card-symbol">✦</span>
		<span class="card-number">04</span>
	</div>

	<div class="card-content">
		<strong>journal</strong>

		<small>
			write, remember, reflect
		</small>
	</div>

	<span class="card-arrow">↗</span>
</a>

<a class="link-card" href="/communities">
	<div class="card-top">
		<span class="card-symbol">✦</span>
		<span class="card-number">05</span>
	</div>

	<div class="card-content">
		<strong>communities</strong>

		<small>
			connect, share, and find your people
		</small>
	</div>

	<span class="card-arrow">↗</span>
</a>

				<a class="link-card" href="/front">
					<div class="card-top">
						<span class="card-symbol">{primarySymbol}</span>
						<span class="card-number">02</span>
					</div>

					<div class="card-content">
						<strong>front</strong>

						<small>
							who is currently fronting
						</small>
					</div>

					<span class="card-arrow">↗</span>
				</a>

				<a class="link-card" href="/customize">
					<div class="card-top">
						<span class="card-symbol">✦</span>
						<span class="card-number">03</span>
					</div>

					<div class="card-content">
						<strong>customize</strong>

						<small>
							make TECSPA completely yours
						</small>
					</div>

					<span class="card-arrow">↗</span>
				</a>
			</div>
		</section>

		<!-- =================================================
		     DECORATIVE QUOTE / PERSONAL WEBPAGE MOMENT
		     ================================================= -->

		<section class="quote-section">
			<div class="quote-mark" aria-hidden="true">
				“
			</div>

			<p>
				this space belongs to you.
				<br />
				it doesn't have to look like anyone else's.
			</p>

			<span>{theme.divider}</span>
		</section>

		<!-- =================================================
		     FOOTER
		     ================================================= -->

		<footer>
			<div class="footer-ornament" aria-hidden="true">
				<span>{secondarySymbol}</span>
				<span>────────</span>
				<span>{primarySymbol}</span>
				<span>────────</span>
				<span>{secondarySymbol}</span>
			</div>

			<p>made with ♡ for systems</p>

			<p class="tiny">
				TECSPA™ · the extremely customizable plural app™
			</p>
		</footer>
	</main>
</div>

<style>
	/* =========================================================
	   TECSPA HOMEPAGE — RIDICULOUSLY PRETTY EDITION
	   ========================================================= */

	:global(*) {
		box-sizing: border-box;
	}

	:global(html) {
		background: var(--tecspa-background);
	}

	:global(body) {
		margin: 0;
		min-width: 320px;

		background: var(--tecspa-background);
		color: var(--tecspa-text);

		font-family: var(--tecspa-body-font);

		transition:
			background 300ms ease,
			color 300ms ease;
	}

	:global(a) {
		color: inherit;
	}

	:global(::selection) {
		background: var(--tecspa-accent);
		color: var(--tecspa-surface);
	}

	/* =========================================================
	   BACKGROUND
	   ========================================================= */

	.background {
		position: relative;

		min-height: 100vh;

		padding: 24px 18px 60px;

		overflow: hidden;

		background:
			radial-gradient(
				circle at 10% 10%,
				color-mix(
					in srgb,
					var(--tecspa-accent) 11%,
					transparent
				),
				transparent 28%
			),
			radial-gradient(
				circle at 90% 80%,
				color-mix(
					in srgb,
					var(--tecspa-accent-dark) 9%,
					transparent
				),
				transparent 30%
			),
			var(--tecspa-background);
	}

	/* Soft paper grain */

	.background::before {
		content: '';

		position: fixed;
		inset: 0;

		pointer-events: none;

		opacity: var(--tecspa-texture-opacity);

		background-image:
			radial-gradient(
				rgba(80, 60, 70, 0.13) 0.7px,
				transparent 0.7px
			);

		background-size: 7px 7px;

		mix-blend-mode: multiply;

		z-index: 0;
	}

	/* Very subtle decorative edge */

	.background::after {
		content: '';

		position: fixed;
		inset: 12px;

		pointer-events: none;

		border: 1px solid
			color-mix(
				in srgb,
				var(--tecspa-accent) 16%,
				transparent
			);

		z-index: 0;
	}

	/* =========================================================
	   MAIN PANEL
	   ========================================================= */

	.page {
		position: relative;
		z-index: 1;

		width: min(
			calc(100% - 20px),
			var(--tecspa-panel-width)
		);

		margin: 18px auto 0;

		padding: 22px 42px 46px;

		background:
			linear-gradient(
				135deg,
				color-mix(
					in srgb,
					var(--tecspa-surface) 97%,
					transparent
				),
				color-mix(
					in srgb,
					var(--tecspa-surface-alt) 96%,
					transparent
				)
			);

		border: 1px solid var(--tecspa-border);

		border-radius: var(--tecspa-panel-radius);

		box-shadow:
			0 0 0 6px
				color-mix(
					in srgb,
					var(--tecspa-surface) 50%,
					transparent
				),
			var(--tecspa-panel-shadow);

		transition:
			background 300ms ease,
			border-color 300ms ease,
			box-shadow 300ms ease;
	}

	/* Inner frame */

	.page::before {
		content: '';

		position: absolute;
		inset: 9px;

		pointer-events: none;

		border: 1px solid
			color-mix(
				in srgb,
				var(--tecspa-border) 55%,
				transparent
			);

		border-radius: max(
			0px,
			calc(var(--tecspa-panel-radius) - 2px)
		);
	}

	/* Tiny corner decorations */

	.page::after {
		content: '✦';

		position: absolute;

		top: 14px;
		right: 18px;

		color: var(--tecspa-accent);

		font-size: 0.8rem;

		opacity: 0.7;
	}

	/* =========================================================
	   TOP NAV
	   ========================================================= */

	.top-navigation {
		position: relative;
		z-index: 2;

		display: flex;
		align-items: center;
		justify-content: center;

		gap: 4px;

		margin: 0 auto 24px;

		padding: 6px;

		border-top: 1px solid var(--tecspa-border);
		border-bottom: 1px solid var(--tecspa-border);

		background:
			color-mix(
				in srgb,
				var(--tecspa-surface) 72%,
				transparent
			);
	}

.top-nav-link {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	text-decoration: none;
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
}

.top-nav-link:hover {
	opacity: 0.75;
	transform: translateY(-1px);
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
		font-size: 1.05rem;

		transition:
			color 160ms ease,
			background 160ms ease,
			transform 160ms ease;
	}

	.top-nav-link span {
		color: var(--tecspa-accent);

		font-family: Georgia, serif;
	}

	.top-nav-link:hover {
		color: var(--tecspa-accent-dark);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 7%,
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

		margin: 4px 0 10px;

		color: var(--tecspa-accent);

		font-size: 0.85rem;

		opacity: var(--tecspa-ornament-opacity);
	}

	.ornamental-header > span:first-child {
		margin-left: 3%;
	}

	.ornamental-header > span:last-child {
		margin-right: 3%;
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
		font-size: 1rem;
	}

	/* =========================================================
	   HERO
	   ========================================================= */

	.hero {
		position: relative;

		margin: 16px 0 20px;

		padding: 48px 32px 42px;

		border: 1px solid var(--tecspa-border);

		background:
			linear-gradient(
				135deg,
				color-mix(
					in srgb,
					var(--tecspa-surface-alt) 75%,
					var(--tecspa-surface)
				),
				var(--tecspa-surface)
			);

		text-align: center;

		overflow: hidden;

		border-radius: var(--tecspa-panel-radius);

		box-shadow:
			inset 0 0 50px
				color-mix(
					in srgb,
					var(--tecspa-accent) 4%,
					transparent
				);
	}

	.hero::before,
	.hero::after {
		content: '';

		position: absolute;

		width: 130px;
		height: 130px;

		border: 1px solid
			color-mix(
				in srgb,
				var(--tecspa-accent) 35%,
				transparent
			);

		transform: rotate(45deg);
	}

	.hero::before {
		left: -85px;
		top: -85px;
	}

	.hero::after {
		right: -85px;
		bottom: -85px;
	}

	.hero-inner {
		position: relative;
		z-index: 1;
	}

	.hero-corner {
		position: absolute;

		color: var(--tecspa-accent);

		font-family: Georgia, serif;

		font-size: 3rem;

		opacity: 0.55;
	}

	.hero-corner-left {
		top: 15px;
		left: 20px;
	}

	.hero-corner-right {
		right: 20px;
		bottom: 15px;
	}

	.hero-kicker {
		margin: 0 0 10px;

		color: var(--tecspa-accent);

		font-size: 0.7rem;

		letter-spacing: 0.25em;

		text-transform: uppercase;
	}

	h1 {
		margin: 0;

		color: var(--tecspa-accent-dark);

		font-family: var(--tecspa-heading-font);

		font-size: clamp(3.5rem, 9vw, 6.5rem);

		font-weight: 500;

		letter-spacing: 0.07em;

		line-height: 0.9;
	}

	h1 sup {
		font-size: 0.18em;

		vertical-align: top;

		margin-left: 3px;
	}

	.hero-divider {
		display: flex;

		align-items: center;
		justify-content: center;

		gap: 10px;

		margin: 20px auto 14px;

		max-width: 380px;

		color: var(--tecspa-accent);

		font-size: 0.72rem;

		letter-spacing: 0.12em;

		opacity: 0.8;
	}

	.hero-divider span:nth-child(2) {
		flex: 1;

		overflow: hidden;

		white-space: nowrap;
	}

	.tagline {
		margin: 0;

		color: var(--tecspa-text-muted);

		font-family: var(--tecspa-body-font);

		font-size: 0.9rem;

		font-style: italic;

		letter-spacing: 0.06em;
	}

	.hero-note {
		margin: 20px 0 0;

		color: var(--tecspa-text-muted);

		font-size: 0.75rem;

		line-height: 1.8;
	}

	/* =========================================================
	   STATUS STRIP
	   ========================================================= */

	.status-strip {
		display: flex;
		align-items: center;
		justify-content: center;

		flex-wrap: wrap;

		gap: 10px;

		margin: 18px auto 28px;

		color: var(--tecspa-text-muted);

		font-size: 0.7rem;

		letter-spacing: 0.12em;

		text-transform: lowercase;
	}

	.status-strip > div {
		display: inline-flex;
		align-items: center;

		gap: 6px;
	}

	.status-symbol {
		color: var(--tecspa-accent);
	}

	.status-divider {
		color: var(--tecspa-border);
	}

	/* =========================================================
	   INTRO
	   ========================================================= */

	.intro {
		display: grid;

		grid-template-columns: 180px minmax(0, 1fr);

		gap: 38px;

		align-items: center;

		max-width: 820px;

		margin: 0 auto;
	}

	.intro-decoration {
		text-align: center;}

	.portrait-frame {
		position: relative;

		width: 150px;
		height: 170px;

		margin: 0 auto 10px;

		padding: 8px;

		border: 1px solid var(--tecspa-border);

		background: var(--tecspa-surface);

		transform: rotate(-2deg);

		box-shadow:
			5px 5px 0
				color-mix(
					in srgb,
					var(--tecspa-accent) 9%,
					transparent
				);
	}

	.portrait-frame::before,
	.portrait-frame::after {
		content: '✦';

		position: absolute;

		color: var(--tecspa-accent);

		font-size: 0.7rem;
	}

	.portrait-frame::before {
		top: -7px;
		left: -7px;
	}

	.portrait-frame::after {
		right: -7px;
		bottom: -7px;
	}

	.portrait {
		display: flex;

		width: 100%;
		height: 100%;

		align-items: center;
		justify-content: center;

		background:
			radial-gradient(
				circle at center,
				color-mix(
					in srgb,
					var(--tecspa-accent) 11%,
					transparent
				),
				transparent 65%
			),
			var(--tecspa-surface-alt);

		color: var(--tecspa-accent);

		font-size: 3rem;
	}

	.intro-decoration p {
		margin: 0;

		color: var(--tecspa-accent);

		font-size: 0.6rem;

		letter-spacing: 0.3em;
	}

	.eyebrow {
		margin: 0 0 8px;

		color: var(--tecspa-accent);

		font-size: 0.68rem;

		letter-spacing: 0.22em;

		text-transform: uppercase;
	}

	h2 {
		margin: 0 0 12px;

		color: var(--tecspa-accent-dark);

		font-family: var(--tecspa-heading-font);

		font-size: 2rem;

		font-weight: 500;
	}

	.intro-copy {
		max-width: 600px;

		margin: 0;

		color: var(--tecspa-text-muted);

		font-size: 0.9rem;

		line-height: 1.9;
	}

	.intro-whisper {
		margin: 14px 0 16px;

		color: var(--tecspa-accent);

		font-family: var(--tecspa-heading-font);

		font-size: 0.82rem;

		font-style: italic;
	}

	.identity {
		display: flex;

		flex-wrap: wrap;

		gap: 8px 18px;

		color: var(--tecspa-text-muted);

		font-size: 0.72rem;

		font-style: italic;
	}

	/* =========================================================
	   MAJOR DIVIDER
	   ========================================================= */

	.major-divider {
		display: flex;

		align-items: center;

		gap: 14px;

		margin: 42px 0 34px;

		color: var(--tecspa-accent);

		font-family: var(--tecspa-heading-font);

		font-size: 0.85rem;

		opacity: var(--tecspa-ornament-opacity);
	}

	.major-divider span {
		flex: 1;

		height: 1px;

		background:
			linear-gradient(
				90deg,
				transparent,
				var(--tecspa-border)
			);
	}

	.major-divider span:last-child {
		background:
			linear-gradient(
				90deg,
				var(--tecspa-border),
				transparent
			);
	}

	.major-divider strong {
		max-width: 45%;

		overflow: hidden;

		white-space: nowrap;

		font-weight: normal;
	}

	/* =========================================================
	   QUICK LINKS
	   ========================================================= */

	.links-section {
		max-width: 900px;

		margin: 0 auto;
	}

	.section-heading {
		text-align: center;
	}

	.section-heading h2 {
		margin-bottom: 4px;
	}

	.section-description {
		margin: 0;

		color: var(--tecspa-text-muted);

		font-size: 0.72rem;

		font-style: italic;
	}

	.link-grid {
		display: grid;

		grid-template-columns: repeat(3, 1fr);

		gap: 14px;

		margin-top: 22px;
	}

	.link-card {
		position: relative;

		display: flex;

		min-height: 170px;

		flex-direction: column;

		justify-content: space-between;

		padding: 17px;

		border: 1px solid var(--tecspa-border);

		background:
			linear-gradient(
				135deg,
				color-mix(
					in srgb,
					var(--tecspa-surface-alt) 80%,
					transparent
				),
				var(--tecspa-surface)
			);

		color: var(--tecspa-text);

		text-decoration: none;

		border-radius: var(--tecspa-panel-radius);

		overflow: hidden;

		transition:
			transform 180ms ease,
			border-color 180ms ease,
			box-shadow 180ms ease,
			background 180ms ease;
	}

	.link-card::before {
		content: '';

		position: absolute;

		inset: 5px;

		border: 1px solid
			color-mix(
				in srgb,
				var(--tecspa-border) 55%,
				transparent
			);

		pointer-events: none;
	}

	.link-card:hover {
		transform: translateY(-5px) rotate(-0.5deg);

		border-color: var(--tecspa-accent);

		background: var(--tecspa-surface);

		box-shadow:
			0 12px 28px
				color-mix(
					in srgb,
					var(--tecspa-accent-dark) 13%,
					transparent
				);
	}

	.card-top {
		display: flex;

		align-items: center;
		justify-content: space-between;
	}

	.card-symbol {
		color: var(--tecspa-accent);

		font-size: 1.6rem;
	}

	.card-number {
		color: var(--tecspa-border);

		font-family: var(--tecspa-body-font);

		font-size: 0.6rem;

		letter-spacing: 0.12em;
	}

	.card-content {
		padding: 10px 2px;
	}

	.card-content strong {
		display: block;

		color: var(--tecspa-accent-dark);

		font-family: var(--tecspa-heading-font);

		font-size: 1.45rem;

		font-weight: 500;
	}

	.card-content small {
		display: block;

		margin-top: 5px;

		color: var(--tecspa-text-muted);

		font-size: 0.68rem;

		line-height: 1.5;
	}

	.card-arrow {
		align-self: flex-end;

		color: var(--tecspa-accent);

		font-size: 0.9rem;

		transition: transform 180ms ease;
	}

	.link-card:hover .card-arrow {
		transform: translate(3px, -3px);
	}

	/* =========================================================
	   QUOTE
	   ========================================================= */

	.quote-section {
		position: relative;

		max-width: 650px;

		margin: 46px auto 18px;

		padding: 30px 30px 24px;

		border-top: 1px solid var(--tecspa-border);
		border-bottom: 1px solid var(--tecspa-border);

		text-align: center;
	}

	.quote-mark {
		position: absolute;

		left: 50%;

		top: -23px;

		width: 45px;
		height: 45px;

		transform: translateX(-50%);

		display: flex;

		align-items: center;
		justify-content: center;

		background: var(--tecspa-surface);

		color: var(--tecspa-accent);

		font-family: Georgia, serif;

		font-size: 2rem;
	}

	.quote-section p {
		margin: 0 0 15px;

		color: var(--tecspa-text-muted);

		font-family: var(--tecspa-heading-font);

		font-size: 1.05rem;

		font-style: italic;

		line-height: 1.8;
	}

	.quote-section > span {
		color: var(--tecspa-accent);

		font-size: 0.7rem;

		opacity: 0.8;
	}

	/* =========================================================
	   FOOTER
	   ========================================================= */

	footer {
		margin-top: 38px;

		text-align: center;

		color: var(--tecspa-text-muted);

		font-size: 0.72rem;

		font-style: italic;
	}

	.footer-ornament {
		display: flex;

		align-items: center;
		justify-content: center;

		gap: 10px;

		margin-bottom: 14px;

		color: var(--tecspa-accent);

		font-size: 0.65rem;

		letter-spacing: 0.12em;

		opacity: var(--tecspa-ornament-opacity);
	}

	.footer-ornament span:nth-child(2),
	.footer-ornament span:nth-child(4) {
		color: var(--tecspa-border);
	}

	footer p {
		margin: 4px;
	}

	footer .tiny {
		font-size: 0.6rem;

		opacity: 0.7;
	}

	/* =========================================================
	   FLOATING DECORATIONS
	   ========================================================= */

	.floating-decoration {
		position: fixed;

		z-index: 0;

		color: var(--tecspa-accent);

		font-family: var(--tecspa-heading-font);

		pointer-events: none;

		opacity: calc(
			var(--tecspa-ornament-opacity) * 0.7
		);

		animation: gentle-float 7s ease-in-out infinite;
	}

	.decoration-one {
		top: 11%;
		left: 2.5%;

		font-size: 2rem;
	}

	.decoration-two {
		top: 36%;
		right: 2.5%;

		font-size: 1.6rem;

		animation-delay: -2s;
	}

	.decoration-three {
		left: 4%;
		bottom: 28%;

		font-size: 1.2rem;

		animation-delay: -4s;
	}

	.decoration-four {
		right: 5%;
		bottom: 12%;

		font-size: 1rem;

		animation-delay: -1s;
	}

	@keyframes gentle-float {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}

		50% {
			transform: translateY(-6px) rotate(3deg);
		}
	}

	/* =========================================================
	   THEME-SPECIFIC VISUAL PERSONALITIES
	   ========================================================= */

	:global(
		html[data-tecspa-theme='digital-cobalt']
	)
		.background {
		background:
			linear-gradient(
				rgba(23, 60, 255, 0.055) 1px,
				transparent 1px
			),
			linear-gradient(
				90deg,
				rgba(23, 60, 255, 0.055) 1px,
				transparent 1px
			),
			var(--tecspa-background);

		background-size: 24px 24px;
	}

	:global(
		html[data-tecspa-theme='digital-cobalt']
	)
		.page {
		border-width: 2px;

		box-shadow:
			8px 8px 0
				color-mix(
					in srgb,
					var(--tecspa-accent) 18%,
					transparent
				),
			var(--tecspa-panel-shadow);
	}

	:global(
		html[data-tecspa-theme='digital-cobalt']
	)
		.link-card:hover {
		transform: translate(-3px, -3px);
	}

	:global(
		html[data-tecspa-theme='digital-cobalt']
	)
		h1,
	:global(
		html[data-tecspa-theme='digital-cobalt']
	)
		h2,
	:global(
		html[data-tecspa-theme='digital-cobalt']
	)
		strong {
		letter-spacing: 0.03em;
	}

	:global(
		html[data-tecspa-theme='crimson-clinical']
	)
		.background {
		background:
			linear-gradient(
				rgba(142, 38, 52, 0.025) 1px,
				transparent 1px
			),
			var(--tecspa-background);
	}

	:global(
		html[data-tecspa-theme='crimson-clinical']
	)
		.hero::before,
	:global(
		html[data-tecspa-theme='crimson-clinical']
	)
		.hero::after {
		border-radius: 50%;
	}

	:global(
		html[data-tecspa-theme='crimson-clinical']
	)
		.link-card {
		font-family: 'IBM Plex Mono', 'Courier New', monospace;
	}

	:global(
		html[data-tecspa-theme='ashen-gothic']
	)
		.background {
		background:
			radial-gradient(
				ellipse at center,
				rgba(255, 255, 255, 0.22),
				transparent 55%
			),
			linear-gradient(
				90deg,
				rgba(40, 35, 42, 0.035) 1px,
				transparent 1px
			),
			var(--tecspa-background);

		background-size:
			auto,
			38px 38px,
			auto;
	}

	:global(
		html[data-tecspa-theme='ashen-gothic']
	)
		.hero {
		background:
			linear-gradient(
				135deg,
				rgba(255, 255, 255, 0.55),
				rgba(210, 207, 211, 0.45)
			);
	}

	:global(
		html[data-tecspa-theme='ashen-gothic']
	)
		.link-card::before {
		border-style: double;
	}

	:global(
		html[data-tecspa-theme='pastel-parfait']
	)
		.link-card {
		border-radius: 16px;
	}

	:global(
		html[data-tecspa-theme='pastel-parfait']
	)
		.hero {
		border-radius: 22px;
	}

	:global(
		html[data-tecspa-theme='pastel-parfait']
	)
		.portrait-frame {
		border-radius: 20px;
	}

	:global(
		html[data-tecspa-theme='candy-gore']
	)
		.background {
		background:
			radial-gradient(
				circle at 10% 20%,
				rgba(239, 24, 167, 0.16),
				transparent 18%
			),
			radial-gradient(
				circle at 85% 70%,
				rgba(116, 19, 161, 0.13),
				transparent 20%
			),
			var(--tecspa-background);
	}

	:global(
		html[data-tecspa-theme='candy-gore']
	)
		.link-card:hover {
		transform: translateY(-7px) rotate(1deg);
	}

	:global(
		html[data-tecspa-theme='candy-gore']
	)
		.hero {
		box-shadow:
			8px 8px 0
				color-mix(
					in srgb,
					var(--tecspa-accent) 20%,
					transparent
				);
	}

	:global(
		html[data-tecspa-theme='lavender-clinic']
	)
		.page {
		box-shadow:
			0 0 0 7px
				color-mix(
					in srgb,
					var(--tecspa-accent) 7%,
					transparent
				),
			var(--tecspa-panel-shadow);
	}

	:global(
		html[data-tecspa-theme='lavender-clinic']
	)
		.hero {
		background:
			linear-gradient(
				135deg,
				rgba(235, 220, 247, 0.65),
				rgba(255, 250, 255, 0.95)
			);
	}

	:global(
		html[data-tecspa-theme='black-rose']
	)
		.background {
		background:
			radial-gradient(
				circle at 50% 0%,
				rgba(163, 107, 120, 0.12),
				transparent 35%
			),
			var(--tecspa-background);
	}

	:global(
		html[data-tecspa-theme='black-rose']
	)
		.page {
		background:
			linear-gradient(
				135deg,
				rgba(39, 34, 41, 0.98),
				rgba(29, 26, 31, 0.98)
			);
	}

	:global(
		html[data-tecspa-theme='black-rose']
	)
		.page::before {
		border-color: rgba(210, 161, 170, 0.24);
	}

	:global(
		html[data-tecspa-theme='black-rose']
	)
		.hero {
		background:
			linear-gradient(
				135deg,
				rgba(55, 46, 52, 0.8),
				rgba(31, 28, 33, 0.95)
			);
	}

	:global(
		html[data-tecspa-theme='black-rose']
	)
		.link-card {
		background:
			linear-gradient(
				135deg,
				rgba(53, 45, 52, 0.85),
				rgba(35, 31, 37, 0.96)
			);
	}

	:global(
		html[data-tecspa-theme='black-rose']
	)
		.quote-mark {
		background: var(--tecspa-surface);
	}

	/* =========================================================
	   MOBILE
	   ========================================================= */

	@media (max-width: 650px) {
	.top-navigation {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 4px;

		width: 100%;
		box-sizing: border-box;
        
		margin-bottom: 16px;
		padding: 5px;
	}

	.top-navigation {
		-webkit-tap-highlight-color: transparent;
	}

	.top-nav-link:active {
		transform: translateY(0);
		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 12%,
				transparent
			);
	}

	.top-nav-link {
		min-width: 0;
		min-height: 44px;

		display: flex;
		align-items: center;
		justify-content: center;

		box-sizing: border-box;

		padding: 8px 6px;

		gap: 6px;

width: 100%;
max-width: 100%;

		font-size: 0.92rem;
		line-height: 1.1;

		border-radius: 2px;
	}

	.top-nav-link span {
		flex: 0 0 auto;

		font-size: 0.85rem;
	}

	.top-nav-link.active::after {
		left: 12px;
		right: 12px;
		bottom: 3px;
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
}

@media (max-width: 380px) {
	.top-navigation {
		gap: 3px;
		padding: 4px;
	}

	.top-nav-link {
		min-height: 46px;

		padding: 8px 4px;

		font-size: 0.84rem;
	}

	.top-nav-link span {
		font-size: 0.8rem;
	}

	.top-nav-link.active::after {
		left: 10px;
		right: 10px;
	}
}

	@media (max-width: 480px) {
		.top-navigation {
			flex-wrap: wrap;
		}

		.top-nav-link {
			font-size: 0.85rem;
		}

		h1 {
			font-size: 3.1rem;
		}

		.hero-note {
			font-size: 0.7rem;
		}

		.major-divider strong {
			max-width: 70%;
		}
	}

/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

@media (max-width: 650px) {
	.top-navigation {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 4px;
		width: 100%;
		box-sizing: border-box;
		margin-bottom: 16px;
		padding: 5px;

		-webkit-tap-highlight-color: transparent;
	}

	.top-nav-link {
		min-width: 0;
		min-height: 44px;

		display: flex;
		align-items: center;
		justify-content: center;

		box-sizing: border-box;

		padding: 8px 6px;
		gap: 6px;

		border-radius: 2px;

		font-size: 0.92rem;
		line-height: 1.1;
	}

	.top-nav-link span {
		flex: 0 0 auto;
		font-size: 0.85rem;
	}

	.top-nav-link.active::after {
		left: 12px;
		right: 12px;
		bottom: 3px;
	}

	.top-nav-link:active {
		transform: translateY(0);
		background: color-mix(in srgb, var(--tecspa-accent) 12%, transparent);
	}
}

@media (max-width: 380px) {
	.top-navigation {
		gap: 3px;
		padding: 4px;
	}

	.top-nav-link {
		min-height: 46px;
		padding: 8px 4px;
		font-size: 0.84rem;
	}

	.top-nav-link span {
		font-size: 0.8rem;
	}

	.top-nav-link.active::after {
		left: 10px;
		right: 10px;
	}
}

/* =========================================================
   LAYER 3B — THEME WORLD UI
   Homepage components become part of the active world.
   ========================================================= */


/* =========================================================
   💿 DIGITAL COBALT
   2000s personal web / MySpace-era internet
   glossy blue • beveled UI • profile-page nostalgia
   ========================================================= */

:global(html[data-tecspa-theme='digital-cobalt']) .panel {
	border:
		1px solid #78a9d0;
	border-radius: 3px;
	background:
		linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.98),
			rgba(232, 243, 252, 0.98)
		);
	box-shadow:
		0 2px 8px rgba(25, 80, 130, 0.12),
		inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

:global(html[data-tecspa-theme='digital-cobalt']) .quote-section {
	border:
		1px solid #78a9d0;
	border-radius: 3px;
	background:
		linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.98),
			rgba(232, 243, 252, 0.98)
		);
	box-shadow:
		0 2px 8px rgba(25, 80, 130, 0.12),
		inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* =========================================================
   BUTTONS
   ========================================================= */

:global(html[data-tecspa-theme='digital-cobalt']) button {
	border:
		1px solid #4d8fc7;

	border-radius: 3px;

	background:
		linear-gradient(
			180deg,
			#ffffff 0%,
			#eaf7ff 43%,
			#c6e4f9 52%,
			#add5f0 100%
		);

	color: #075cae;

	font-family:
		'Verdana',
		Arial,
		Helvetica,
		sans-serif;

	font-weight: 700;

	text-shadow:
		0 1px 0 white;

	box-shadow:
		2px 3px 0 rgba(0, 65, 135, 0.14),
		inset 0 1px 0 white;transition:
		transform 100ms ease,
		box-shadow 100ms ease;
}


:global(html[data-tecspa-theme='digital-cobalt']) button:hover {
	transform: translate(-1px, -1px);

	box-shadow:
		3px 4px 0 rgba(0, 65, 135, 0.18),
		inset 0 1px 0 white;
}


:global(html[data-tecspa-theme='digital-cobalt']) button:active {
	transform: translate(1px, 1px);

	box-shadow:
		1px 1px 0 rgba(0, 65, 135, 0.16),
		inset 0 1px 2px rgba(0, 65, 135, 0.12);
}


/* =========================================================
   DIGITAL COBALT — PROFILE-WEB DETAILS
   ========================================================= */

:global(html[data-tecspa-theme='digital-cobalt']) .identity {
	text-shadow:
		0 1px 0 white;
}


:global(html[data-tecspa-theme='digital-cobalt']) .identity strong {
	color: #075cae;
}


:global(html[data-tecspa-theme='digital-cobalt']) .major-divider {
	color: #126bb8;
}


:global(html[data-tecspa-theme='digital-cobalt']) .major-divider::before {
	background:
		linear-gradient(
			90deg,
			transparent,
			#72acd4,
			transparent
		);
}
:global(html[data-tecspa-theme='digital-cobalt']) .major-divider::after {
	background:
		linear-gradient(
			90deg,
			transparent,
			#72acd4,
			transparent
		);
}


:global(html[data-tecspa-theme='digital-cobalt']) .floating-decoration {
	color: #1472c4;

	text-shadow:
		0 1px 0 white,
		0 0 8px rgba(40, 145, 235, 0.45);
}


/* =========================================================
   DIGITAL COBALT — RETRO WEB FOOTER
   ========================================================= */

:global(html[data-tecspa-theme='digital-cobalt']) footer {
	color: #587791;

	font-size: 0.7rem;

	text-shadow:
		0 1px 0 white;
}

/* =========================================================
   CRIMSON CLINICAL
   lace / clinical paper / mourning medical romance
   ========================================================= */

:global(html[data-tecspa-theme='crimson-clinical'])
	.crimson-clinical-art {
	display: block;
}


/* top lace */

:global(html[data-tecspa-theme='crimson-clinical'])
	.crimson-lace-top {
	position: absolute;

	top: 8px;
	left: 3%;

	width: 94%;
	height: auto;

	max-width: none;
	max-height: none;

	object-fit: contain;

	border: 0;

	background: transparent;

	opacity: 0.82;

	box-shadow: none;

	filter:
		drop-shadow(0 2px 3px rgba(70, 20, 28, 0.10));
}


/* bottom lace */

:global(html[data-tecspa-theme='crimson-clinical'])
	.crimson-lace-bottom {
	position: absolute;

	bottom: 2px;
	left: 3%;

	width: 94%;
	height: auto;

	max-width: none;
	max-height: none;

	object-fit: contain;

	border: 0;

	background: transparent;

	opacity: 0.68;

	box-shadow: none;

	filter:
		drop-shadow(0 2px 3px rgba(70, 20, 28, 0.08));
}

/* Clinical cards */

:global(html[data-tecspa-theme='crimson-clinical']) .quick-link-card {
	border:
		1px solid rgba(110, 30, 40, 0.30);

	border-radius: 3px;

	background:
		linear-gradient(
			135deg,
			rgba(255, 251, 250, 0.97),
			rgba(239, 225, 227, 0.92)
		);

	box-shadow:
		0 8px 20px rgba(75, 20, 30, 0.10);

	position: relative;
}

:global(html[data-tecspa-theme='crimson-clinical']) .quick-link-card::after {
	content: '✚';

	position: absolute;
	right: 14px;
	top: 10px;

	font-size: 0.75rem;

	color: rgba(143, 29, 44, 0.34);
}


/* Clinical panels */

:global(html[data-tecspa-theme='crimson-clinical']) .panel {
	border-color: rgba(110, 30, 40, 0.28);

	background:
		linear-gradient(
			135deg,
			rgba(252, 247, 247, 0.97),
			rgba(237, 224, 226, 0.94)
		);

	box-shadow:
		0 9px 22px rgba(80, 20, 30, 0.09);
}
:global(html[data-tecspa-theme='crimson-clinical']) .status-strip {
	border-color: rgba(110, 30, 40, 0.28);

	background:
		linear-gradient(
			135deg,
			rgba(252, 247, 247, 0.97),
			rgba(237, 224, 226, 0.94)
		);

	box-shadow:
		0 9px 22px rgba(80, 20, 30, 0.09);
}
:global(html[data-tecspa-theme='crimson-clinical']) .quote-section {
	border-color: rgba(110, 30, 40, 0.28);

	background:
		linear-gradient(
			135deg,
			rgba(252, 247, 247, 0.97),
			rgba(237, 224, 226, 0.94)
		);

	box-shadow:
		0 9px 22px rgba(80, 20, 30, 0.09);
}


/* Clinical buttons */

:global(html[data-tecspa-theme='crimson-clinical']) button {
	border:
		1px solid rgba(100, 20, 32, 0.36);

	border-radius: 2px;

	background:
		linear-gradient(
			180deg,
			#fffafa,
			#eadbde
		);

	color: #731622;

	font-family:
		"Courier New",
		monospace;

	box-shadow:
		0 3px 8px rgba(75, 20, 30, 0.10);
}

:global(html[data-tecspa-theme='crimson-clinical']) button:hover {
	background:
		linear-gradient(
			180deg,
			#fffafa,
			#e5d0d4
		);

	color: #8f1d2c;
}


/* =========================================================
   🖤 ASHEN GOTHIC
   Mourning scrapbook / antique / distressed monochrome
   ========================================================= */

:global(html[data-tecspa-theme='ashen-gothic']) .top-navigation {
	border:
		1px solid #514c4b;

	background:
		linear-gradient(
			180deg,
			#2b2929,
			#201e1f
		);

	border-radius: 1px;

	box-shadow:
		0 12px 28px rgba(0, 0, 0, 0.45),
		inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

:global(html[data-tecspa-theme='ashen-gothic']) .top-nav-link {
	color: #c7c0bd;

	border-radius: 0;

	font-family:
		Georgia,
		"Times New Roman",
		serif;

	text-shadow:
		0 1px 2px black;
}

:global(html[data-tecspa-theme='ashen-gothic']) .top-nav-link:hover {
	background: rgba(255, 255, 255, 0.045);
	color: #ebe6e2;
}

:global(html[data-tecspa-theme='ashen-gothic']) .top-nav-link.active {
	background: rgba(255, 255, 255, 0.06);

	box-shadow:
		inset 0 -1px 0 #c7c0bd;
}


/* Ashen cards */

:global(html[data-tecspa-theme='ashen-gothic']) .quick-link-card {
	border:
		1px solid #514c4b;

	border-radius: 1px;

	background:
		linear-gradient(
			145deg,
			#2b2929,
			#211f20
		);

	box-shadow:
		0 14px 32px rgba(0, 0, 0, 0.42),
		inset 0 1px 0 rgba(255, 255, 255, 0.035);

	position: relative;
}

:global(html[data-tecspa-theme='ashen-gothic']) .quick-link-card::before {
	content: '❦';

	position: absolute;

	top: 8px;
	right: 12px;

	color: rgba(199, 192, 189, 0.25);

	font-family: Georgia, serif;
}


/* Ashen panels */

:global(html[data-tecspa-theme='ashen-gothic']) .panel {
	border-color: #514c4b;

	background:
		linear-gradient(
			145deg,
			#292727,
			#201e1f
		);

	box-shadow:
		0 18px 42px rgba(0, 0, 0, 0.48),
		inset 0 1px 0 rgba(255, 255, 255, 0.035);
}
:global(html[data-tecspa-theme='ashen-gothic']) .status-strip {
	border-color: #514c4b;

	background:
		linear-gradient(
			145deg,
			#292727,
			#201e1f
		);

	box-shadow:
		0 18px 42px rgba(0, 0, 0, 0.48),
		inset 0 1px 0 rgba(255, 255, 255, 0.035);
}
:global(html[data-tecspa-theme='ashen-gothic']) .quote-section {
	border-color: #514c4b;

	background:
		linear-gradient(
			145deg,
			#292727,
			#201e1f
		);

	box-shadow:
		0 18px 42px rgba(0, 0, 0, 0.48),
		inset 0 1px 0 rgba(255, 255, 255, 0.035);
}


/* Ashen buttons */

:global(html[data-tecspa-theme='ashen-gothic']) button {
	border:
		1px solid #68615f;

	border-radius: 1px;

	background:
		linear-gradient(
			180deg,
			#363232,
			#252223
		);

	color: #d6d0cc;

	font-family:
		Georgia,
		"Times New Roman",
		serif;

	box-shadow:
		0 5px 14px rgba(0, 0, 0, 0.35),
		inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

:global(html[data-tecspa-theme='ashen-gothic']) button:hover {
	background:
		linear-gradient(
			180deg,
			#403b3b,
			#292627
		);

	color: #f0ebe7;
}


/* =========================================================
   SMALL SHARED DETAILS
   ========================================================= */

/*
 * Give interactive homepage cards a tiny tactile movement
 * in all three major theme worlds.
 */

:global(html[data-tecspa-theme='digital-cobalt']) .quick-link-card {
	transition:
		transform 160ms ease,
		box-shadow 160ms ease,
		border-color 160ms ease;
}
:global(html[data-tecspa-theme='crimson-clinical']) .quick-link-card {
	transition:
		transform 160ms ease,
		box-shadow 160ms ease,
		border-color 160ms ease;
}
:global(html[data-tecspa-theme='ashen-gothic']) .quick-link-card {
	transition:
		transform 160ms ease,
		box-shadow 160ms ease,
		border-color 160ms ease;
}


/*
 * Keep the effects restrained on touch devices.
 */

@media (max-width: 700px) {
:global(html[data-tecspa-theme='digital-cobalt']) .quick-link-card:hover {
                transform: none;
        }
:global(html[data-tecspa-theme='crimson-clinical']) .quick-link-card:hover {
                transform: none;
        }
:global(html[data-tecspa-theme='ashen-gothic']) .quick-link-card:hover {
                transform: none;
        }
}

/* =========================================================
   ASHEN GOTHIC — DARK MOURNING BANNER
   ========================================================= */

:global(html[data-tecspa-theme='ashen-gothic'] .banner) {
	background:
		linear-gradient(
			180deg,
			#292627 0%,
			#211f20 55%,
			#181718 100%
		) !important;

	border: 1px solid #514c4b !important;

	border-radius: 1px !important;

	box-shadow:
		0 18px 40px rgba(0, 0, 0, 0.60),
		inset 0 1px 0 rgba(255, 255, 255, 0.05),
		inset 0 0 50px rgba(0, 0, 0, 0.35) !important;

	opacity: 1 !important;

	color: #ebe6e2 !important;
}


/* Left/right antique ornaments */

:global(html[data-tecspa-theme='ashen-gothic'] .banner::before) {
	color: #c7c0bd !important;

	opacity: 0.42 !important;

	text-shadow:
		0 2px 5px rgba(0, 0, 0, 0.95);
}
:global(html[data-tecspa-theme='ashen-gothic'] .banner::after) {
	color: #c7c0bd !important;

	opacity: 0.42 !important;

	text-shadow:
		0 2px 5px rgba(0, 0, 0, 0.95);
}


/* Welcome label */

:global(html[data-tecspa-theme='ashen-gothic'] .banner .small-label) {
	color: #c7c0bd !important;

	text-shadow:
		0 2px 4px rgba(0, 0, 0, 0.95);
}
:global(html[data-tecspa-theme='ashen-gothic'] .banner .banner-label) {
	color: #c7c0bd !important;

	text-shadow:
		0 2px 4px rgba(0, 0, 0, 0.95);
}


/* BIG TECSPA */

:global(html[data-tecspa-theme='ashen-gothic'] .banner h1) {
	color: #f5f0eb !important;

	opacity: 1 !important;

	text-shadow:
		0 2px 0 #000,
		0 4px 12px rgba(0, 0, 0, 0.95),
		0 0 18px rgba(245, 240, 235, 0.08) !important;

	letter-spacing: 0.1em;
}


/* Trademark */

:global(html[data-tecspa-theme='ashen-gothic'] .banner h1 sup) {
	color: #c7c0bd !important;
}


/* Divider */

:global(html[data-tecspa-theme='ashen-gothic'] .banner .divider) {
	color: #c7c0bd !important;

	opacity: 0.8 !important;
}


/* Tagline */

:global(html[data-tecspa-theme='ashen-gothic'] .banner .tagline) {
	color: #ded8d4 !important;

	opacity: 1 !important;

	text-shadow:
		0 2px 5px rgba(0, 0, 0, 0.95);
}


/* Description */

:global(html[data-tecspa-theme='ashen-gothic'] .banner p) {
	color: #aaa29e !important;

	opacity: 1 !important;

	text-shadow:
		0 1px 4px rgba(0, 0, 0, 0.95);
}


/* Internal decorative symbols */

:global(html[data-tecspa-theme='ashen-gothic'] .banner-decoration) {
	color: #c7c0bd !important;

	opacity: 0.65 !important;

	text-shadow:
		0 2px 5px rgba(0, 0, 0, 0.95);
}

/* =========================================================
   ASHEN GOTHIC — HERO / MOURNING CARD
   ========================================================= */

:global(html[data-tecspa-theme='ashen-gothic'] .hero) {
	background:
		linear-gradient(
			180deg,
			#292627 0%,
			#211f20 55%,
			#181718 100%
		) !important;

	border: 1px solid #514c4b !important;

	box-shadow:
		0 18px 40px rgba(0, 0, 0, 0.6),
		inset 0 1px 0 rgba(255, 255, 255, 0.05),
		inset 0 0 50px rgba(0, 0, 0, 0.35) !important;

	color: #ebe6e2 !important;

	opacity: 1 !important;
}


/* tiny "welcome" line */

:global(html[data-tecspa-theme='ashen-gothic'] .hero-kicker) {
	color: #c7c0bd !important;

	opacity: 1 !important;

	text-shadow:
		0 2px 4px rgba(0, 0, 0, 0.95);
}


/* =========================================================
   THE BIG TECSPA TITLE
   ========================================================= */

:global(html[data-tecspa-theme='ashen-gothic'] .hero h1) {
	color: #f5f0eb !important;

	opacity: 1 !important;

	text-shadow:
		0 2px 0 #000,
		0 4px 12px rgba(0, 0, 0, 0.95),
		0 0 18px rgba(245, 240, 235, 0.08) !important;
}


/* trademark */

:global(html[data-tecspa-theme='ashen-gothic'] .hero h1 sup) {
	color: #c7c0bd !important;

	opacity: 1 !important;
}


/* divider */

:global(html[data-tecspa-theme='ashen-gothic'] .hero-divider) {
	color: #c7c0bd !important;

	opacity: 0.8 !important;
}


/* tagline */

:global(html[data-tecspa-theme='ashen-gothic'] .hero .tagline) {
	color: #ded8d4 !important;

	opacity: 1 !important;

	text-shadow:
		0 2px 5px rgba(0, 0, 0, 0.95);
}


/* description */

:global(html[data-tecspa-theme='ashen-gothic'] .hero .hero-note) {
	color: #aaa29e !important;

	opacity: 1 !important;

	text-shadow:
		0 1px 4px rgba(0, 0, 0, 0.95);
}


/* decorative corners */

:global(html[data-tecspa-theme='ashen-gothic'] .hero-corner) {
	color: #c7c0bd !important;

	opacity: 0.55 !important;
}

/* =========================================================
   THEME ART STRIP
   ========================================================= */

.theme-art-strip {
	position: relative;

	width: 100%;
	max-width: 900px;

	height: 150px;

	margin: 24px auto 30px;

	pointer-events: none;
}


/* Every theme gets its own little art world */

.theme-art-world {
	position: absolute;

	inset: 0;

	display: flex;
	align-items: center;
	justify-content: center;

	gap: 18px;

	opacity: 0;

	pointer-events: none;

	transition:
		opacity 0.35s ease,
		transform 0.35s ease;
}


/* Only the active theme's artwork appears */

:global(html[data-tecspa-theme='digital-cobalt'])
	.theme-art-world.digital-cobalt-art,

:global(html[data-tecspa-theme='ashen-gothic'])
	.theme-art-world.ashen-gothic-art,

:global(html[data-tecspa-theme='crimson-clinical'])
	.theme-art-world.crimson-clinical-art,

:global(html[data-tecspa-theme='ivory-unicorn'])
	.theme-art-world.ivory-unicorn-art {
	opacity: 1;
}


/* ---------------------------------------------------------
   GENERAL IMAGE TREATMENT
   --------------------------------------------------------- */

.theme-art-world img {
	display: block;

	object-fit: cover;

	max-height: 110px;
	max-width: 220px;

	border: 1px solid var(--tecspa-border);

	box-shadow:
		0 8px 20px rgba(0, 0, 0, 0.18);

	transition:
		transform 0.3s ease,
		filter 0.3s ease;
}


/* ---------------------------------------------------------
   DIGITAL COBALT
   --------------------------------------------------------- */

:global(html[data-tecspa-theme='digital-cobalt'])
	.digital-cobalt-art img {
	border-radius: 3px;

	border-color: #83b4e8;

	box-shadow:
		0 6px 18px rgba(0, 70, 160, 0.22),
		0 0 0 3px rgba(255, 255, 255, 0.45);

	filter: saturate(1.08);
}


/* little chaotic webcore arrangement */

:global(html[data-tecspa-theme='digital-cobalt'])
	.digital-cobalt-art img:nth-child(1) {
	width: 210px;
	height: 105px;

	transform: rotate(-2deg);
}

:global(html[data-tecspa-theme='digital-cobalt'])
	.digital-cobalt-art img:nth-child(2) {
	width: 150px;
	height: 105px;

	transform: rotate(2deg) translateY(-5px);
}

:global(html[data-tecspa-theme='digital-cobalt'])
	.digital-cobalt-art img:nth-child(3) {
	width: 170px;
	height: 105px;

	transform: rotate(-1deg) translateY(5px);
}


/* ---------------------------------------------------------
   ASHEN GOTHIC
   --------------------------------------------------------- */

:global(html[data-tecspa-theme='ashen-gothic'])
	.ashen-gothic-art {
	gap: 0;
}

:global(html[data-tecspa-theme='ashen-gothic'])
	.ashen-gothic-art img {
	border-color: #514c4b;

	filter:
		grayscale(1)
		contrast(0.92);

	box-shadow:
		0 10px 25px rgba(0, 0, 0, 0.65);
}


/* mourning ribbon */

:global(html[data-tecspa-theme='ashen-gothic'])
	.ashen-gothic-art img:nth-child(1) {
	position: absolute;

	top: 4px;
	left: 4%;

	width: 92%;
	height: 42px;

	object-fit: cover;

	opacity: 0.72;

	border: 0;

	box-shadow: none;

	transform: rotate(-1deg);
}


/* lace heart */

:global(html[data-tecspa-theme='ashen-gothic'])
	.ashen-gothic-art img:nth-child(2) {
	width: 105px;
	height: 105px;

	object-fit: contain;

	border: 0;

	box-shadow: none;

	background: transparent;

	transform: rotate(-5deg) translateY(8px);
}


/* angelic veil */

:global(html[data-tecspa-theme='ashen-gothic'])
	.ashen-gothic-art img:nth-child(3) {
	width: 170px;
	height: 110px;

	transform: rotate(2deg);
}


/* ---------------------------------------------------------
   CRIMSON CLINICAL
   lace / clinical paper / mourning medical romance
   --------------------------------------------------------- */

:global(html[data-tecspa-theme='crimson-clinical'])
	.crimson-clinical-art {
	position: relative;
	display: block;
	overflow: visible;
}

/* The lace assets are ornamental dividers, not framed pictures. */

:global(html[data-tecspa-theme='crimson-clinical'])
	.crimson-clinical-art img {
	position: absolute;
	display: block;
	left: 4%;
	width: 92%;
	max-width: none;
	height: 48px;
	max-height: none;
	object-fit: contain;
	border: 0;
	border-radius: 0;
	background: transparent;
	box-shadow: none;
	filter: drop-shadow(0 2px 3px rgba(80, 15, 25, 0.10));
}

/* upper lace */

:global(html[data-tecspa-theme='crimson-clinical'])
	.crimson-clinical-art .crimson-lace-top {
	top: 4px;
	transform: none;
	opacity: 0.84;
}

/* lower lace */

:global(html[data-tecspa-theme='crimson-clinical'])
	.crimson-clinical-art .crimson-lace-bottom {
	bottom: 4px;
	transform: none;
	opacity: 0.68;
}

/* ---------------------------------------------------------
   IVORY UNICORN
   porcelain / mist / silver / antique fantasy
   --------------------------------------------------------- */

:global(html[data-tecspa-theme='ivory-unicorn'])
	.ivory-unicorn-art {
	position: relative;
	overflow: visible;
	gap: 0;
}

:global(html[data-tecspa-theme='ivory-unicorn'])
	.ivory-unicorn-art img {
	position: absolute;
	display: block;
	border: 0;
	background: transparent;
	box-shadow: none;
	transition: transform 0.45s ease, opacity 0.45s ease, filter 0.45s ease;
}

:global(html[data-tecspa-theme='ivory-unicorn'])
	.ivory-swans {
	left: 8%;
	top: 25px;
	width: 245px;
	height: 115px;
	object-fit: cover;
	opacity: 0.30;
	filter: grayscale(0.15) sepia(0.08) contrast(0.82) brightness(1.08);
	box-shadow: 0 8px 22px rgba(90, 82, 88, 0.08);
	transform: rotate(-1deg);
}

:global(html[data-tecspa-theme='ivory-unicorn'])
	.ivory-porcelain {
	left: 27%;
	top: 20px;
	width: 155px;
	height: 120px;
	object-fit: cover;
	border: 1px solid rgba(190, 184, 188, 0.65);
	border-radius: 3px;
	opacity: 0.62;
	filter: grayscale(0.35) contrast(0.88) brightness(1.08);
	box-shadow: 0 9px 24px rgba(75, 68, 76, 0.12), 0 0 0 4px rgba(255, 255, 255, 0.42);
	transform: rotate(2deg);
}

:global(html[data-tecspa-theme='ivory-unicorn'])
	.ivory-horse {
	right: 29%;
	top: 4px;
	width: 190px;
	height: 145px;
	object-fit: cover;
	border: 1px solid rgba(205, 199, 198, 0.7);
	border-radius: 3px;
	opacity: 0.88;
	filter: grayscale(0.08) sepia(0.08) contrast(0.86) brightness(1.07);
	box-shadow: 0 12px 28px rgba(82, 73, 84, 0.16), 0 0 0 5px rgba(255, 255, 255, 0.48);
	transform: rotate(-1deg);
}

:global(html[data-tecspa-theme='ivory-unicorn'])
	.ivory-tea-set {
	right: 8%;
	top: 43px;
	width: 145px;
	height: 95px;
	object-fit: cover;
	opacity: 0.48;
	filter: grayscale(0.15) brightness(1.10) contrast(0.84);
	box-shadow: 0 8px 20px rgba(95, 82, 86, 0.10);
	transform: rotate(1deg);
}

:global(html[data-tecspa-theme='ivory-unicorn'])
	.ivory-teacup {
	left: 13%;
	bottom: 4px;
	width: 105px;
	height: 88px;
	object-fit: cover;
	opacity: 0.48;
	filter: grayscale(0.35) brightness(1.08);
	box-shadow: 0 7px 16px rgba(80, 74, 80, 0.08);
	transform: rotate(-4deg);
}

:global(html[data-tecspa-theme='ivory-unicorn'])
	.ivory-floral {
	left: -20px;
	top: -30px;
	width: 155px;
	height: 190px;
	object-fit: contain;
	opacity: 0.42;
	filter: drop-shadow(0 2px 4px rgba(100, 91, 104, 0.10));
	transform: rotate(-5deg);
}

:global(html[data-tecspa-theme='ivory-unicorn'])
	.ivory-scroll {
	right: -15px;
	bottom: -28px;
	width: 120px;
	height: 155px;
	object-fit: contain;
	opacity: 0.36;filter: drop-shadow(0 2px 5px rgba(100, 91, 104, 0.12));
	transform: rotate(4deg);
}

:global(html[data-tecspa-theme='ivory-unicorn'])
	.ivory-bow {
	left: 4%;
	top: 3px;
	width: 92%;
	height: 46px;
	object-fit: contain;
	opacity: 0.82;
	filter: drop-shadow(0 2px 3px rgba(80, 75, 80, 0.12));
	transform: none;
}

:global(html[data-tecspa-theme='ivory-unicorn'])
	.ivory-key {
	right: 18%;
	bottom: -20px;
	width: 150px;
	height: 75px;
	object-fit: contain;
	opacity: 0.55;
	filter: drop-shadow(0 2px 4px rgba(80, 75, 80, 0.16));
	transform: rotate(-3deg);
}

/* =========================================================
   💕 GYARU GLAM
   2000s gyaru / deco / glossy personal web
   hot pink • rhinestones • bows • hearts • leopard
   ========================================================= */

:global(html[data-tecspa-theme='gyaru-glam']) .background {
	border:
		2px solid #d47c9d;

	border-radius: 5px;

	background:
		radial-gradient(
			circle at 12px 12px,
			rgba(255, 255, 255, 0.55) 0 2px,
			transparent 2.5px
		),
		linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.22) 25%,
			transparent 25%,
			transparent 50%,
			rgba(255, 255, 255, 0.22) 50%,
			rgba(255, 255, 255, 0.22) 75%,
			transparent 75%
		),
		linear-gradient(
			180deg,
			#ffeaf4 0%,
			#f7d4e5 48%,
			#edbfd5 100%
		);

	background-size:
		24px 24px,
		14px 14px,
		auto;
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

:global(html[data-tecspa-theme='gyaru-glam']) .page {
	border:
		2px solid #d47c9d;

	border-radius: 5px;

	background:
		linear-gradient(
			180deg,
			#fffafd 0%,
			#fff3f9 5%,
			#fbe4ef 100%
		);

	box-shadow:
		5px 6px 0 rgba(176, 36, 94, 0.15),
		0 14px 35px rgba(176, 36, 94, 0.20),
		inset 0 1px 0 white;
}


/* =========================================================
   TOP NAVIGATION
   ========================================================= */

:global(html[data-tecspa-theme='gyaru-glam']) .top-navigation {
	border:
		1px solid #d27b9c;

	border-radius: 4px;

	background:
		linear-gradient(
			180deg,
			#ffffff 0%,
			#fff5fa 42%,
			#f8d9e8 52%,
			#efbfd5 100%
		);

	box-shadow:
		2px 3px 0 rgba(175, 35, 95, 0.15),
		inset 0 1px 0 white;

	padding: 4px;
}

:global(html[data-tecspa-theme='gyaru-glam']) .top-nav-link {
	border:
		1px solid transparent;

	border-radius: 3px;

	color: #b3005f;

	font-size: 0.78rem;
	font-weight: 700;
	letter-spacing: 0.035em;

	text-shadow:
		0 1px 0 white;

	transition:
		background 120ms ease,
		border-color 120ms ease,
		box-shadow 120ms ease,
		transform 120ms ease;
}

:global(html[data-tecspa-theme='gyaru-glam']) .top-nav-link:hover {
	border-color: #dc86aa;

	background:
		linear-gradient(
			180deg,
			#ffffff,
			#ffe0ee
		);

	box-shadow:
		inset 0 1px 0 white,
		0 2px 5px rgba(190, 30, 105, 0.18);

	transform: translateY(-1px);
}

:global(html[data-tecspa-theme='gyaru-glam']) .top-nav-link.active {
	border-color: #ca6891;

	background:
		linear-gradient(
			180deg,
			#ffeaf4,
			#f4c4da
		);

	box-shadow:
		inset 0 1px 2px rgba(160, 25, 85, 0.14),
		0 1px 0 white;
}

/* =========================================================
   ORNAMENTAL HEADER
   ========================================================= */

:global(html[data-tecspa-theme='gyaru-glam']) .ornamental-header {
	color: #d4006d;

	text-shadow:
		0 1px 0 white,
		0 0 6px rgba(255, 105, 180, 0.38);
}

:global(html[data-tecspa-theme='gyaru-glam']) .ornamental-line {
	background:
		linear-gradient(
			90deg,
			transparent,
			#df86aa,
			transparent
		);
}

/* =========================================================
   HERO
   ========================================================= */

:global(html[data-tecspa-theme='gyaru-glam']) .hero {
	border:
		2px solid #d47c9d;

	border-radius: 5px;

	background:
		linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.99) 0%,
			rgba(255, 241, 248, 0.98) 45%,
			rgba(246, 205, 224, 0.98) 100%
		);

	box-shadow:
		3px 4px 0 rgba(175, 30, 95, 0.16),
		inset 0 1px 0 white,
		inset 0 -8px 18px rgba(220, 60, 135, 0.08);

	overflow: hidden;
}

:global(html[data-tecspa-theme='gyaru-glam']) .hero::before {
	content: '♡  ✧  ☆  🎀  ☆  ✧  ♡';

	position: absolute;

	top: 8px;
	left: 0;
	right: 0;

	color: rgba(211, 0, 103, 0.25);

	font-size: 0.65rem;
	letter-spacing: 0.55rem;

	text-align: center;

	pointer-events: none;
}

:global(html[data-tecspa-theme='gyaru-glam']) .hero-kicker {
	color: #c40063;

	font-size: 0.68rem;
	font-weight: 700;
	letter-spacing: 0.12em;
	text-transform: uppercase;

	text-shadow:
		0 1px 0 white;
}

:global(html[data-tecspa-theme='gyaru-glam']) h1 {
	color: #d00069;

	font-family:
		'Trebuchet MS',
		Arial,
		Helvetica,
		sans-serif;

	font-weight: 900;

	letter-spacing: 0.025em;

	text-shadow:
		1px 2px 0 white,
		2px 3px 0 rgba(205, 45, 115, 0.20);
}

:global(html[data-tecspa-theme='gyaru-glam']) .tagline {
	color: #633247;

	font-weight: 700;
}

:global(html[data-tecspa-theme='gyaru-glam']) .hero-note {
	color: #8b6375;
}

/* =========================================================
   STATUS STRIP
   ========================================================= */

:global(html[data-tecspa-theme='gyaru-glam']) .status-strip {
	border:
		1px solid #d88aaa;

	border-radius: 4px;

	background:
		linear-gradient(
			180deg,
			#ffffff,
			#f9dfeb
		);

	box-shadow:
		2px 3px 0 rgba(175, 35, 95, 0.12),
		inset 0 1px 0 white;
}

/* =========================================================
   QUICK LINKS
   ========================================================= */

:global(html[data-tecspa-theme='gyaru-glam']) .quick-link-card {
	border:
		1px solid #d383a3;

	border-radius: 4px;

	background:
		linear-gradient(
			180deg,
			#ffffff 0%,
			#fff4f9 48%,
			#f5d4e3 100%
		);

	box-shadow:
		3px 4px 0 rgba(175, 35, 95, 0.14),
		inset 0 1px 0 white;

	position: relative;

	transition:
		transform 120ms ease,
		box-shadow 120ms ease,
		border-color 120ms ease;
}

:global(html[data-tecspa-theme='gyaru-glam']) .quick-link-card::before {
	content: '✧';

	position: absolute;

	top: 7px;
	right: 9px;

	color: rgba(211, 0, 103, 0.38);

	font-size: 0.85rem;

	text-shadow:
		0 1px 0 white,
		0 0 4px rgba(255, 105, 180, 0.35);

	pointer-events: none;
}

:global(html[data-tecspa-theme='gyaru-glam']) .quick-link-card:hover {
	transform: translate(-2px, -2px);

	border-color: #c9658e;

	box-shadow:
		5px 6px 0 rgba(175, 30, 90, 0.18),
		inset 0 1px 0 white;
}

/* =========================================================
   GENERIC PANELS
   ========================================================= */

:global(html[data-tecspa-theme='gyaru-glam']) .panel {
	border:
		1px solid #d98daa;

	border-radius: 4px;

	background:
		linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.99),
			rgba(250, 226, 238, 0.97)
		);

	box-shadow:
		3px 4px 0 rgba(175, 35, 95, 0.12),
		inset 0 1px 0 white;
}
:global(html[data-tecspa-theme='gyaru-glam']) .quote-section {
	border:
		1px solid #d98daa;

	border-radius: 4px;

	background:
		linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.99),
			rgba(250, 226, 238, 0.97)
		);

	box-shadow:
		3px 4px 0 rgba(175, 35, 95, 0.12),
		inset 0 1px 0 white;
}

/* =========================================================
   BUTTONS
   ========================================================= */

:global(html[data-tecspa-theme='gyaru-glam']) button {
	border:
		1px solid #c95f8b;

	border-radius: 4px;

	background:
		linear-gradient(
			180deg,
			#ffffff 0%,
			#fff0f7 43%,
			#f5cadf 52%,
			#eeb5d0 100%
		);

	color: #b40060;

	font-family:
		'Verdana',
		Arial,
		Helvetica,
		sans-serif;

	font-weight: 700;

	text-shadow:
		0 1px 0 white;

	box-shadow:
		2px 3px 0 rgba(165, 25, 85, 0.14),
		inset 0 1px 0 white;

	transition:
		transform 100ms ease,
		box-shadow 100ms ease;
}

:global(html[data-tecspa-theme='gyaru-glam']) button:hover {
	transform: translate(-1px, -1px);

	box-shadow:
		3px 4px 0 rgba(165, 25, 85, 0.18),
		inset 0 1px 0 white;
}

:global(html[data-tecspa-theme='gyaru-glam']) button:active {
	transform: translate(1px, 1px);

	box-shadow:
		1px 1px 0 rgba(165, 25, 85, 0.16),
		inset 0 1px 2px rgba(165, 25, 85, 0.12);
}

/* =========================================================
   GYARU — PROFILE WEB DETAILS
   ========================================================= */

:global(html[data-tecspa-theme='gyaru-glam']) .identity {
	text-shadow:
		0 1px 0 white;
}

:global(html[data-tecspa-theme='gyaru-glam']) .identity strong {
	color: #c50067;
}

:global(html[data-tecspa-theme='gyaru-glam']) .major-divider {
	color: #cf0068;
}

:global(html[data-tecspa-theme='gyaru-glam']) .major-divider::before {
	background:
		linear-gradient(
			90deg,
			transparent,
			#dc86a9,
			transparent
		);
}
:global(html[data-tecspa-theme='gyaru-glam']) .major-divider::after {
	background:
		linear-gradient(
			90deg,
			transparent,
			#dc86a9,
			transparent
		);
}

:global(html[data-tecspa-theme='gyaru-glam']) .floating-decoration {
	color: #d4006d;

	text-shadow:
		0 1px 0 white,
		0 0 8px rgba(255, 90, 175, 0.50);
}

/* =========================================================
   GYARU — LEOPARD / DECO ACCENTS
   ========================================================= */

:global(html[data-tecspa-theme='gyaru-glam']) .panel::after {
	content: '♡  ✧  ♡';

	display: block;

	margin-top: 0.65rem;

	color: rgba(190, 0, 90, 0.38);

	font-size: 0.68rem;

	letter-spacing: 0.35rem;

	text-align: right;

	pointer-events: none;
}
:global(html[data-tecspa-theme='gyaru-glam']) .quote-section::after {
	content: '♡  ✧  ♡';

	display: block;

	margin-top: 0.65rem;

	color: rgba(190, 0, 90, 0.38);

	font-size: 0.68rem;

	letter-spacing: 0.35rem;

	text-align: right;

	pointer-events: none;
}

/* =========================================================
   GYARU — RETRO WEB FOOTER
   ========================================================= */

:global(html[data-tecspa-theme='gyaru-glam']) footer {
	color: #8c6074;

	font-size: 0.7rem;

	text-shadow:
		0 1px 0 white;
}

/* ---------------------------------------------------------
   MOBILE
   --------------------------------------------------------- */

@media (max-width: 700px) {
	.theme-art-strip {
		height: 115px;
	}

	.theme-art-world {
		gap: 8px;
	}

	.theme-art-world img {
		max-height: 85px;
	}

	:global(html[data-tecspa-theme='digital-cobalt'])
		.digital-cobalt-art img:nth-child(1) {
		width: 135px;
		height: 80px;
	}

	:global(html[data-tecspa-theme='digital-cobalt'])
		.digital-cobalt-art img:nth-child(2) {
		width: 95px;
		height: 80px;
	}

	:global(html[data-tecspa-theme='digital-cobalt'])
		.digital-cobalt-art img:nth-child(3) {
		width: 105px;
		height: 80px;
	}

	:global(html[data-tecspa-theme='ashen-gothic'])
		.ashen-gothic-art img:nth-child(1) {
		width: 90%;
	}

	:global(html[data-tecspa-theme='crimson-clinical'])
		.crimson-clinical-art img {
		left: 2%;
		width: 96%;
		height: 38px;
	}

	:global(html[data-tecspa-theme='crimson-clinical'])
		.crimson-clinical-art .crimson-lace-top {
		top: 8px;
	}

	:global(html[data-tecspa-theme='crimson-clinical'])
		.crimson-clinical-art .crimson-lace-bottom {
		bottom: 8px;
	}

	:global(html[data-tecspa-theme='ivory-unicorn'])
		.ivory-swans {
		left: 2%;
		width: 150px;
		height: 85px;
	}

	:global(html[data-tecspa-theme='ivory-unicorn'])
		.ivory-porcelain {
		left: 24%;
		width: 105px;
		height: 85px;
	}

	:global(html[data-tecspa-theme='ivory-unicorn'])
		.ivory-horse {
		right: 19%;
		width: 135px;
		height: 105px;
	}

	:global(html[data-tecspa-theme='ivory-unicorn'])
		.ivory-tea-set {
		right: 1%;
		width: 95px;
		height: 70px;
	}

	:global(html[data-tecspa-theme='ivory-unicorn'])
		.ivory-teacup {
		left: 8%;
		width: 70px;
		height: 65px;
	}

	:global(html[data-tecspa-theme='ivory-unicorn'])
		.ivory-floral {
		left: -35px;
		top: -25px;
		width: 105px;
		height: 130px;
	}

	:global(html[data-tecspa-theme='ivory-unicorn'])
		.ivory-scroll {
		right: -25px;
		bottom: -20px;
		width: 90px;
		height: 115px;
	}

	:global(html[data-tecspa-theme='ivory-unicorn'])
		.ivory-bow {
		width: 96%;
		left: 2%;
	}

	:global(html[data-tecspa-theme='ivory-unicorn'])
		.ivory-key {
		right: 13%;
		width: 105px;
		height: 55px;
	}
}

/* =========================================================
   MOBILE FOUNDATION
   ========================================================= */

@media (max-width: 700px) {
	:global(body) {
		overflow-x: hidden;
	}

	.tecspa-shell {
		width: 100%;
		min-width: 0;
	}

	.page-content {
		width: 100%;
		min-width: 0;
	}
}

@media (max-width: 480px) {
	:global(body) {
		font-size: 15px;
	}

	.page-content {
		padding-left: 12px;
		padding-right: 12px;
	}
}

/* =========================================================
   MOBILE MEMBERS — COMPLETE MOBILE PRESENTATION
   ========================================================= */

@media (max-width: 700px) {
	/* -----------------------------------------------------
	   Members page container
	   ----------------------------------------------------- */

	.member-list {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	/* -----------------------------------------------------
	   Member card
	   ----------------------------------------------------- */

	.member-card {
		position: relative;

		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		display: flex;
		flex-direction: column;
		align-items: stretch;

		overflow: hidden;

		padding: 0;

		border: 1px solid var(--tecspa-border);

		background:
			linear-gradient(
				to bottom,
				color-mix(in srgb, var(--tecspa-surface) 94%, transparent),
				color-mix(in srgb, var(--tecspa-surface) 82%, transparent)
			);

		box-shadow:
			0 2px 8px color-mix(in srgb, var(--tecspa-text) 8%, transparent);

		transition:
			transform 160ms ease,
			box-shadow 160ms ease,
			border-color 160ms ease;
	}

	.member-card:hover {
		transform: translateY(-2px);

		border-color:
			color-mix(
				in srgb,
				var(--tecspa-accent) 55%,
				var(--tecspa-border)
			);

		box-shadow:
			0 6px 18px color-mix(in srgb, var(--tecspa-text) 12%, transparent);
	}

	/* -----------------------------------------------------
	   Avatar
	   ----------------------------------------------------- */

	.member-card .avatar {
		position: relative;

		width: 100%;
		height: 220px;

		flex: 0 0 220px;

		display: flex;
		align-items: center;
		justify-content: center;

		box-sizing: border-box;

		overflow: hidden;

		border: 0;
		border-bottom: 1px solid var(--tecspa-border);

		background:
			radial-gradient(
				circle at center,
				color-mix(in srgb, var(--tecspa-accent) 12%, transparent),
				transparent 68%
			),
			color-mix(in srgb, var(--tecspa-surface) 92%, transparent);

		color: var(--tecspa-accent);

		font-family: var(--tecspa-heading-font);
		font-size: 4rem;
	}

	.member-card .avatar img {
		display: block;

		width: 100%;
		height: 100%;

		object-fit: cover;

		border-radius: 0;
	}

	/* -----------------------------------------------------
	   Member information
	   ----------------------------------------------------- */

	.member-info {
		width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding: 20px 18px 18px;
	}

	.member-number {
		margin: 0 0 5px;

		color: var(--tecspa-accent);

		font-family: var(--tecspa-heading-font);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.12em;
	}

	.member-info h2 {
		margin: 0;

		max-width: 100%;

		overflow-wrap: anywhere;
		word-break: break-word;

		color: var(--tecspa-text);

		font-family: var(--tecspa-heading-font);
		font-size: clamp(1.55rem, 7vw, 2.2rem);
		line-height: 1.05;
	}

	.pronouns {
		margin: 7px 0 0;

		color: var(--tecspa-text-muted);

		font-size: 0.9rem;
		line-height: 1.4;
	}

	.description {
		margin: 14px 0 0;

		max-width: 100%;

		overflow-wrap: anywhere;
		word-break: break-word;

		color: var(--tecspa-text);

		font-size: 0.95rem;
		line-height: 1.65;
	}

	/* -----------------------------------------------------
	   Actions
	   ----------------------------------------------------- */

	.member-actions {
		width: 100%;

		display: flex;
		flex-direction: column;

		gap: 9px;

		margin-top: 20px;
	}

	.view-profile,
	.fronting-button {
		width: 100%;
		min-height: 46px;

		box-sizing: border-box;

		display: flex;
		align-items: center;
		justify-content: center;

		padding: 10px 14px;

		border: 1px solid var(--tecspa-border);
		border-radius: 2px;

		font-family: var(--tecspa-heading-font);
		font-size: 0.88rem;
		font-weight: 600;
		letter-spacing: 0.03em;

		cursor: pointer;

		transition:
			background 160ms ease,
			color 160ms ease,
			border-color 160ms ease,
			transform 160ms ease;
	}

	.view-profile {
		gap: 8px;

		color: var(--tecspa-accent-dark);

		text-decoration: none;

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 6%,
				transparent
			);
	}

	.view-profile span {
		font-size: 1rem;
	}

	.view-profile:hover {
		color: var(--tecspa-accent-dark);

		border-color: var(--tecspa-accent);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 12%,
				transparent
			);

		transform: translateY(-1px);
	}

	.fronting-button {
		color: var(--tecspa-text-muted);

		background:
			color-mix(
				in srgb,
				var(--tecspa-surface) 80%,
				transparent
			);
	}

	.fronting-button:hover {
		color: var(--tecspa-accent-dark);

		border-color: var(--tecspa-accent);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 9%,
				transparent
			);

		transform: translateY(-1px);
	}

	.fronting-button.fronting-active {
		color: var(--tecspa-accent-dark);

		border-color: var(--tecspa-accent);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 15%,
				transparent
			);

		box-shadow:
			0 0 0 1px
			color-mix(
				in srgb,
				var(--tecspa-accent) 10%,
				transparent
			) inset;
	}

	.view-profile:active,
	.fronting-button:active {
		transform: translateY(0);
	}

	/* -----------------------------------------------------
	   Empty state
	   ----------------------------------------------------- */

	.empty-state {
		width: 100%;
		box-sizing: border-box;

		padding: 32px 20px;

		text-align: center;

		border: 1px solid var(--tecspa-border);

		background:
			color-mix(
				in srgb,
				var(--tecspa-surface) 82%,
				transparent
			);
	}

	.empty-state p {
		max-width: 100%;

		overflow-wrap: anywhere;
	}
}


/* =========================================================
   SMALL PHONE
   ========================================================= */

@media (max-width: 420px) {
	.member-list {
		gap: 14px;
	}

	.member-card .avatar {
		height: 190px;
		flex-basis: 190px;
	}

	.member-info {
		padding: 17px 15px 15px;
	}

	.member-info h2 {
		font-size: clamp(1.4rem, 8vw, 1.9rem);
	}

	.description {
		font-size: 0.92rem;
		line-height: 1.6;
	}

	.view-profile,
	.fronting-button {
		min-height: 48px;
		font-size: 0.84rem;
	}
}


/* =========================================================
   VERY SMALL PHONE
   ========================================================= */

@media (max-width: 350px) {
	.member-card .avatar {
		height: 165px;
		flex-basis: 165px;
	}

	.member-info {
		padding: 15px 13px 13px;
	}

	.member-actions {
		margin-top: 16px;
	}
}

/* =========================================================
   TECSPA HOMEPAGE — MOBILE REBUILD
   ========================================================= */

@media (max-width: 700px) {
	/* -----------------------------------------------------
	   GLOBAL PAGE CONSTRAINTS
	   ----------------------------------------------------- */

	.background {
		width: 100%;
		min-width: 0;
		max-width: 100%;
		box-sizing: border-box;

		padding: 10px 6px 36px;

		overflow-x: hidden;
	}

	.page {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		margin: 6px 0 0;
		padding: 14px 14px 34px;

		overflow: hidden;
	}

	.page::before {
		inset: 6px;
	}

	/* Make sure no page section can create horizontal
	   overflow through an image, grid, or long text. */

	.page > *,
	.page section,
	.page nav,
	.page footer {
		max-width: 100%;
		min-width: 0;
		box-sizing: border-box;
	}

	/* -----------------------------------------------------
	   NAVIGATION
	   ----------------------------------------------------- */

	.top-navigation {
		width: 100%;
		max-width: 100%;

		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));

		gap: 4px;

		margin-bottom: 16px;
		padding: 5px;

		box-sizing: border-box;
	}

	.top-nav-link {
		width: 100%;
		min-width: 0;
		min-height: 44px;

		display: flex;
		align-items: center;
		justify-content: center;

		box-sizing: border-box;

		padding: 8px 5px;

		font-size: 0.88rem;
		line-height: 1.1;

		text-align: center;

		white-space: normal;
		overflow-wrap: anywhere;
	}

	.top-nav-link span {
		flex: 0 0 auto;
		font-size: 0.8rem;
	}

	/* -----------------------------------------------------
	   ORNAMENTAL HEADER
	   ----------------------------------------------------- */

	.ornamental-header {
		width: 100%;
		max-width: 100%;

		gap: 7px;

		margin: 3px 0 8px;

		overflow: hidden;
	}

	.ornamental-header > span:first-child,
	.ornamental-header > span:last-child {
		margin: 0;
		flex: 0 0 auto;
	}

	.ornamental-line {
		min-width: 0;
	}

	/* -----------------------------------------------------
	   HERO
	   ----------------------------------------------------- */

	.hero {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		margin: 10px 0 16px;
		padding: 34px 18px 30px;

		overflow: hidden;
	}

	.hero-inner {
		width: 100%;
		max-width: 100%;
		min-width: 0;
	}

	.hero-corner {
		font-size: 2rem;
	}

	.hero-corner-left {
		top: 8px;
		left: 10px;
	}

	.hero-corner-right {
		right: 10px;
		bottom: 8px;
	}

	.hero-kicker {
		max-width: 100%;

		font-size: 0.62rem;
		letter-spacing: 0.16em;
		line-height: 1.5;
	}

	h1 {
		max-width: 100%;

		font-size: clamp(2.8rem, 15vw, 4.6rem);
		line-height: 0.95;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.hero-divider {
		width: 100%;
		max-width: 280px;

		gap: 7px;
		margin-top: 17px;
	}

	.hero-divider span:nth-child(2) {
		min-width: 0;
	}

	.tagline {
		max-width: 100%;

		font-size: 0.82rem;
		line-height: 1.5;

		overflow-wrap: anywhere;
	}

	.hero-note {
		max-width: 100%;

		margin-top: 16px;

		font-size: 0.72rem;
		line-height: 1.7;

		overflow-wrap: anywhere;
	}

	/* -----------------------------------------------------
	   THEME ART
	   ----------------------------------------------------- */

	.theme-art-strip {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		overflow: hidden;
	}

	.theme-art-world {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		overflow: hidden;
	}

	.theme-art-world img {
		max-width: 100%;
	}

	/* -----------------------------------------------------
	   STATUS STRIP
	   ----------------------------------------------------- */

	.status-strip {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		display: flex;
		flex-wrap: wrap;

		gap: 7px;

		margin: 14px auto 22px;

		font-size: 0.64rem;
		line-height: 1.4;

		text-align: center;
	}

	.status-strip > div {
		min-width: 0;
		max-width: 100%;

		justify-content: center;
	}

	.status-divider {
		flex: 0 0 auto;
	}

	/* -----------------------------------------------------
	   SYSTEM INTRO
	   ----------------------------------------------------- */

	.intro {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-direction: column;

		gap: 22px;

		align-items: stretch;

		box-sizing: border-box;

		margin: 0 auto;
	}

	.intro-decoration {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		text-align: center;
	}

	.portrait-frame {
		max-width: 100%;
	}

	.portrait {
		max-width: 100%;
	}

	.intro-text {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		text-align: center;
	}

	.intro-text h2 {
		max-width: 100%;

		font-size: clamp(2rem, 10vw, 3rem);
		line-height: 1.05;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.intro-copy {
		max-width: 100%;

		font-size: 0.86rem;
		line-height: 1.75;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.intro-whisper {
		max-width: 100%;

		font-size: 0.78rem;
		line-height: 1.6;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.identity {
		width: 100%;
		max-width: 100%;

		display: flex;
		flex-wrap: wrap;
		justify-content: center;

		gap: 7px 14px;
	}

	.identity span {
		max-width: 100%;

		overflow-wrap: anywhere;
	}

	/* -----------------------------------------------------
	   MAJOR DIVIDERS
	   ----------------------------------------------------- */

	.major-divider {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		gap: 8px;

		margin: 26px 0;
	}

	.major-divider span {
		min-width: 0;
	}

	/* -----------------------------------------------------
	   EXPLORE / QUICK LINKS
	   ----------------------------------------------------- */

	.links-section {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;
	}

	.section-heading {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		text-align: center;
	}

	.section-heading h2 {
		max-width: 100%;

		font-size: clamp(2.2rem, 11vw, 3.3rem);
		line-height: 1;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.section-description {
		max-width: 100%;

		font-size: 0.8rem;
		line-height: 1.55;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	/* THIS is the important fix:
	   desktop cards are no longer allowed to stay
	   in a 3-column layout on a phone. */

	.link-grid {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: grid;
		grid-template-columns: 1fr;

		gap: 12px;

		box-sizing: border-box;

		margin-top: 20px;
	}

	.link-card {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		min-height: 190px;

		box-sizing: border-box;

		display: flex;
		flex-direction: column;

		padding: 18px 17px;

		overflow: hidden;
	}

	.card-top {
		width: 100%;
		max-width: 100%;

		display: flex;
		align-items: center;
		justify-content: space-between;

		min-width: 0;
	}

	.card-symbol,
	.card-number {
		flex: 0 0 auto;
	}

	.card-content {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		margin-top: auto;
		padding-top: 18px;
	}

	.card-content strong {
		display: block;

		max-width: 100%;

		font-size: clamp(1.8rem, 9vw, 2.7rem);
		line-height: 1;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.card-content small {
		display: block;

		max-width: 100%;

		margin-top: 9px;

		font-size: 0.8rem;
		line-height: 1.5;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.card-arrow {
		align-self: flex-end;

		margin-top: 16px;
	}

	/* -----------------------------------------------------
	   QUOTE
	   ----------------------------------------------------- */

	.quote-section {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding: 24px 12px;

		text-align: center;

		overflow: hidden;
	}

	.quote-section p {
		max-width: 100%;

		font-size: 1.05rem;
		line-height: 1.7;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.quote-mark {
		font-size: 2.5rem;
	}

	/* -----------------------------------------------------
	   FOOTER
	   ----------------------------------------------------- */

	footer {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding-top: 10px;

		text-align: center;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.footer-ornament {
		width: 100%;
		max-width: 100%;

		display: flex;
		align-items: center;
		justify-content: center;

		gap: 7px;

		overflow: hidden;
	}

	.footer-ornament span:nth-child(2),
	.footer-ornament span:nth-child(4) {
		flex: 1;
		min-width: 0;

		overflow: hidden;
	}

	/* -----------------------------------------------------
	   FLOATING DECORATIONS
	   ----------------------------------------------------- */

	.floating-decoration {
		pointer-events: none;
	}

	.decoration-one,
	.decoration-two,
	.decoration-three,
	.decoration-four {
		max-width: 20vw;

		overflow: hidden;
	}
}


/* =========================================================
   SMALL PHONE
   ========================================================= */

@media (max-width: 420px) {
	.background {
		padding-left: 4px;
		padding-right: 4px;
	}

	.page {
		padding-left: 11px;
		padding-right: 11px;
	}

	.hero {
		padding-left: 14px;
		padding-right: 14px;
	}

	.hero-kicker {
		font-size: 0.58rem;
	}

	.hero-note {
		font-size: 0.68rem;
	}

	.link-card {
		min-height: 175px;
		padding: 16px 14px;
	}

	.card-content strong {
		font-size: clamp(1.7rem, 10vw, 2.3rem);
	}

	.card-content small {
		font-size: 0.76rem;
	}
}


/* =========================================================
   VERY SMALL PHONE
   ========================================================= */

@media (max-width: 350px) {
	.page {
		padding-left: 9px;
		padding-right: 9px;
	}

	.top-nav-link {
		font-size: 0.82rem;
	}

	.hero {
		padding: 28px 11px 25px;
	}

	.link-card {
		min-height: 160px;
	}

	.card-content strong {
		font-size: 1.7rem;
	}
}

/* =========================================================
   HOMEPAGE NAVIGATION — CONSISTENT LAYOUT
   ========================================================= */

.top-navigation {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.top-navigation .top-nav-link {
    flex: 0 1 auto;
    min-width: 0;
    white-space: nowrap;
}

/* Keep every link readable on smaller screens */
@media (max-width: 900px) {
    .top-navigation {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 5px;
    }

    .top-navigation .top-nav-link {
        justify-content: center;
        padding: 9px 5px;
        font-size: 0.85rem;
    }
}

@media (max-width: 480px) {
    .top-navigation {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

</style>