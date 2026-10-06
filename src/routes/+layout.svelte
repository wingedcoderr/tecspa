<script lang="ts">
	import { inject } from '@vercel/analytics';
	import { onMount } from 'svelte';
	import { applyTheme, loadTheme } from '$lib/theme/theme';

	interface Account {
		id: string;
		username: string;
	}

	let account: Account | null = null;
	let authLoading = true;

	onMount(async () => {
		inject()
		
		applyTheme(loadTheme());

		try {
			const response = await fetch('/api/auth/session');
			const data = await response.json();

			if (response.ok && data.account) {
				account = data.account;
			}
		} catch {
			// The main TECSPA UI should still load if auth lookup fails.
		} finally {
			authLoading = false;
		}
	});
</script>

<svelte:head>
	<title>tecspa ✦</title>
	<meta
		name="description"
		content="TECSPA — The Extremely Customizable Plural App"
	/>

<link
	rel="preconnect"
	href="https://fonts.googleapis.com"
/>
<link
	rel="preconnect"
	href="https://fonts.gstatic.com"
	crossorigin="anonymous"
/>
<link
	href="https://fonts.googleapis.com/css2?family=Audiowide&family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500;6..96,600;6..96,700;6..96,800&family=Cinzel+Decorative:wght@400;700;900&family=Cormorant+Garamond:wght@400;500;600;700&family=IM+Fell+English&family=Inter:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800;900&family=Orbitron:wght@400;500;600;700;800;900&family=Press+Start+2P&family=Quicksand:wght@400;500;600;700&family=Rakkas&family=Silkscreen:wght@400;700&family=UnifrakturCook:wght@700&family=Yeseva+One&display=swap"
	rel="stylesheet"
/>

</svelte:head>

<div class="tecspa-shell">
	<nav class="account-bar" aria-label="Account">
		<div class="account-bar-inner">
			<a class="account-brand" href="/">
				<span class="account-brand-mark">T</span>
				<span>TECSPA</span>
			</a>

			{#if authLoading}
				<div class="account-status">
					<span class="account-loading">Checking account…</span>
				</div>
			{:else if account}
				<div class="account-status">
					<a class="account-user" href="/account">
						<span class="account-avatar">
							{account.username.slice(0, 1).toUpperCase()}
						</span>

						<span>@{account.username}</span>
					</a>
				</div>
			{:else}
				<div class="account-status">
					<a class="account-link" href="/login">Sign in</a>
					<a class="account-button" href="/register">
						Create account
					</a>
				</div>
			{/if}
		</div>
	</nav>

	<div class="ornament ornament-top-left">
		<span class="ornament-default">❦</span>
		<span class="ornament-digital">✦</span>
		<span class="ornament-crimson">✚</span>
		<span class="ornament-ashen">☾</span>
	</div>

	<div class="ornament ornament-top-right">
		<span class="ornament-default">❦</span>
		<span class="ornament-digital">☁︎</span>
		<span class="ornament-crimson">♡</span>
		<span class="ornament-ashen">✞</span>
	</div>

	<div class="paper-grain"></div>

<div
	class="falling-symbols"
	aria-hidden="true"
>
	<span class="falling-symbol symbol-01"></span>
	<span class="falling-symbol symbol-02"></span>
	<span class="falling-symbol symbol-03"></span>
	<span class="falling-symbol symbol-04"></span>
	<span class="falling-symbol symbol-05"></span>
	<span class="falling-symbol symbol-06"></span>
	<span class="falling-symbol symbol-07"></span>
	<span class="falling-symbol symbol-08"></span>
	<span class="falling-symbol symbol-09"></span>
	<span class="falling-symbol symbol-10"></span>
	<span class="falling-symbol symbol-11"></span>
	<span class="falling-symbol symbol-12"></span>
</div>

<main class="page-content">
		<slot />
	</main>

	<div class="ornament ornament-bottom-left">
		<span class="ornament-default">❧</span>
		<span class="ornament-digital">⌁</span>
		<span class="ornament-crimson">✂</span>
		<span class="ornament-ashen">❦</span>
	</div>

	<div class="ornament ornament-bottom-right">
		<span class="ornament-default">❧</span>
		<span class="ornament-digital">★</span>
		<span class="ornament-crimson">🩸</span>
		<span class="ornament-ashen">𓆩</span>
	</div>
</div>

<div class="ornament ornament-top-right">
	<span class="ornament-default">❦</span>
	<span class="ornament-digital">☁︎</span>
	<span class="ornament-crimson">♡</span>
	<span class="ornament-ashen">✞</span>
</div>

<style>

	/* =========================================================
	   TECSPA SPECIALTY FONTS
	   ========================================================= */

	@font-face {
		font-family: 'Angelic Peace';
		src: url('/fonts/Angelic Peace.ttf')
			format('truetype');
		font-weight: 400;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'Faith Collapsing';
		src: url('/fonts/Faith Collapsing.ttf')
			format('truetype');
		font-weight: 400;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'Starborn';
		src: url('/fonts/Starborn.ttf')
			format('truetype');
		font-weight: 400;
		font-style: normal;
		font-display: swap;
	}

	:global(html) {
		min-height: 100%;
		background: var(--tecspa-background);
	}

	:global(body) {
		margin: 0;
		min-width: 320px;
		min-height: 100vh;

				background: var(--tecspa-background);

		color: var(--tecspa-text);
		font-family: var(--tecspa-body-font);

		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
	}

	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
	}

	:global(button),
	:global(input),
	:global(textarea),
	:global(select) {
		font: inherit;
	}

	:global(a) {
		color: inherit;
	}

	.tecspa-shell {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
	}

	.page-content {
		position: relative;
		z-index: 2;
	}

	.paper-grain {
		position: fixed;
		inset: 0;
		z-index: 1;
		pointer-events: none;

		opacity: 0.12;

		background-image:
			radial-gradient(
				rgba(80, 48, 70, 0.18) 0.6px,
				transparent 0.7px
			),
			radial-gradient(
				rgba(255, 255, 255, 0.8) 0.6px,
				transparent 0.7px
			);

		background-size:
			7px 7px,
			11px 11px;

		background-position:
			0 0,
			3px 4px;

		mix-blend-mode: multiply;
	}

	.ornament {
		position: fixed;
		z-index: 3;

		pointer-events: none;

		color: var(--tecspa-accent);
		font-family: Georgia, serif;
		font-size: 3.5rem;
		line-height: 1;

		opacity: 0.2;

		filter: drop-shadow(
			0 2px 3px rgba(50, 25, 45, 0.08)
		);
	}

	.ornament-top-left {
		top: 18px;
		left: 20px;
		transform: rotate(-18deg);
	}

	.ornament-top-right {
		top: 18px;
		right: 20px;
		transform: scaleX(-1) rotate(-18deg);
	}

	.ornament-bottom-left {
		bottom: 18px;
		left: 20px;
		transform: rotate(18deg);
	}

	.ornament-bottom-right {
		right: 20px;
		bottom: 18px;
		transform: scaleX(-1) rotate(18deg);
	}

	@media (max-width: 700px) {
		.ornament {
			font-size: 2.4rem;
		}

		.ornament-top-left {
			top: 10px;
			left: 10px;
		}

		.ornament-top-right {
			top: 10px;
			right: 10px;
		}

		.ornament-bottom-left {
			bottom: 10px;
			left: 10px;
		}

		.ornament-bottom-right {
			right: 10px;
			bottom: 10px;
		}
	}

	:global(html) {
		min-height: 100%;
	}

	:global(body) {
		min-height: 100vh;
	}

	/* =========================================================
	   DIGITAL COBALT
	   Windows XP × Frutiger Aero × old webcore
	   ========================================================= */

	:global(html[data-tecspa-theme='digital-cobalt']) {
		--tecspa-world-glow: rgba(0, 120, 255, 0.18);
	}

	:global(html[data-tecspa-theme='digital-cobalt'] body) {
		background:
			radial-gradient(
				circle at 18% 12%,
				rgba(255, 255, 255, 0.95) 0,
				rgba(255, 255, 255, 0) 22%
			),
			radial-gradient(
				circle at 80% 25%,
				rgba(0, 130, 255, 0.18) 0,
				transparent 32%
			),
			linear-gradient(
				180deg,
				#dff3ff 0%,
				#b8e1ff 48%,
				#dff5ff 100%
			);
	}

	:global(html[data-tecspa-theme='digital-cobalt'] body::before) {
		content: '';
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: -1;

		background:
			repeating-linear-gradient(
				0deg,
				rgba(255, 255, 255, 0.10) 0,
				rgba(255, 255, 255, 0.10) 1px,
				transparent 1px,
				transparent 4px
			),
			repeating-linear-gradient(
				90deg,
				rgba(0, 90, 200, 0.045) 0,
				rgba(0, 90, 200, 0.045) 1px,
				transparent 1px,
				transparent 7px
			);
		opacity: 0.75;
	}

	:global(html[data-tecspa-theme='digital-cobalt'] button),
	:global(html[data-tecspa-theme='digital-cobalt'] .button),
	:global(html[data-tecspa-theme='digital-cobalt'] a) {
		transition:
			transform 120ms ease,
			box-shadow 120ms ease,
			filter 120ms ease;
	}

	:global(html[data-tecspa-theme='digital-cobalt'] button:hover),
	:global(html[data-tecspa-theme='digital-cobalt'] .button:hover),
	:global(html[data-tecspa-theme='digital-cobalt'] a:hover) {
		filter: saturate(1.12) brightness(1.04);
	}

	:global(html[data-tecspa-theme='digital-cobalt'] button:active),
	:global(html[data-tecspa-theme='digital-cobalt'] .button:active) {
		transform: translateY(1px);
	}

	/* glossy old-Windows-ish panels */

:global(html[data-tecspa-theme='digital-cobalt'] .panel) {
	border-color: #80b4e8;
	box-shadow:
		inset 0 1px rgba(255, 255, 255, 0.95),
		0 8px 25px rgba(0, 85, 180, 0.12);
}

:global(html[data-tecspa-theme='digital-cobalt'] .card) {
	border-color: #80b4e8;
	box-shadow:
		inset 0 1px rgba(255, 255, 255, 0.95),
		0 8px 25px rgba(0, 85, 180, 0.12);
}

:global(html[data-tecspa-theme='digital-cobalt'] article) {
	border-color: #80b4e8;
	box-shadow:
		inset 0 1px rgba(255, 255, 255, 0.95),
		0 8px 25px rgba(0, 85, 180, 0.12);
}

	/* =========================================================
	   CRIMSON CLINICAL
	   medicine × blood × anatomy × mourning
	   ========================================================= */

	:global(html[data-tecspa-theme='crimson-clinical'] body) {
		background:
			radial-gradient(
				ellipse at 15% 15%,
				rgba(150, 20, 35, 0.10),
				transparent 32%
			),
			radial-gradient(
				ellipse at 85% 75%,
				rgba(110, 10, 25, 0.09),
				transparent 35%
			),
			linear-gradient(
				135deg,
				#eee7e7,
				#e4d9db
			);
	}

	:global(html[data-tecspa-theme='crimson-clinical'] body::before) {
		content: '';
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: -1;

		background:
			radial-gradient(
				ellipse at 30% 25%,
				transparent 0 18%,
				rgba(105, 18, 30, 0.045) 19%,
				transparent 31%
			),
			radial-gradient(
				ellipse at 72% 70%,
				transparent 0 20%,
				rgba(120, 20, 35, 0.035) 21%,
				transparent 33%
			);
		mix-blend-mode: multiply;
	}

	:global(html[data-tecspa-theme='crimson-clinical'] h1),
	:global(html[data-tecspa-theme='crimson-clinical'] h2),
	:global(html[data-tecspa-theme='crimson-clinical'] h3) {
		letter-spacing: 0.025em;
	}

	:global(html[data-tecspa-theme='crimson-clinical'] button),
	:global(html[data-tecspa-theme='crimson-clinical'] .button) {
		border-radius: 3px;
		box-shadow:
			0 2px 0 rgba(80, 10, 20, 0.12),
			inset 0 1px rgba(255, 255, 255, 0.65);
	}

	:global(html[data-tecspa-theme='crimson-clinical'] button:hover),
	:global(html[data-tecspa-theme='crimson-clinical'] .button:hover) {
		box-shadow:
			0 4px 14px rgba(100, 20, 30, 0.15),
			inset 0 1px rgba(255, 255, 255, 0.75);
	}

	:global(html[data-tecspa-theme='crimson-clinical'] .panel),
	:global(html[data-tecspa-theme='crimson-clinical'] .card),
	:global(html[data-tecspa-theme='crimson-clinical'] article) {
		border-color: #c9afb4;
	}

	/* =========================================================
	   ASHEN GOTHIC
	   mourning × lace × cemetery × smoke × relics
	   ========================================================= */

	:global(html[data-tecspa-theme='ashen-gothic'] body) {
		background:
			radial-gradient(
				ellipse at 50% 0%,
				rgba(255, 255, 255, 0.055),
				transparent 42%
			),
			linear-gradient(
				180deg,
				#1d1b1c,
				#111011 70%,
				#090909
			);
	}

	:global(html[data-tecspa-theme='ashen-gothic'] body::before) {
		content: '';
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: -1;

		background:
			repeating-linear-gradient(
				112deg,
				transparent 0,
				transparent 23px,
				rgba(255, 255, 255, 0.018) 24px,
				transparent 25px
			),
			repeating-linear-gradient(
				72deg,
				transparent 0,
				transparent 47px,
				rgba(0, 0, 0, 0.08) 48px,
				transparent 49px
			);
		opacity: 0.9;
	}

	:global(html[data-tecspa-theme='ashen-gothic'] h1),
	:global(html[data-tecspa-theme='ashen-gothic'] h2),
	:global(html[data-tecspa-theme='ashen-gothic'] h3) {
		font-weight: 500;
		letter-spacing: 0.04em;
	}

	:global(html[data-tecspa-theme='ashen-gothic'] button),
	:global(html[data-tecspa-theme='ashen-gothic'] .button) {
		border-radius: 0;
		border-width: 1px;
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.035),
			0 8px 25px rgba(0, 0, 0, 0.25);
	}

	:global(html[data-tecspa-theme='ashen-gothic'] button:hover),
	:global(html[data-tecspa-theme='ashen-gothic'] .button:hover) {
		background:
			linear-gradient(
				90deg,
				transparent,
				rgba(255, 255, 255, 0.06),
				transparent
			);
	}

	:global(html[data-tecspa-theme='ashen-gothic'] .panel),
	:global(html[data-tecspa-theme='ashen-gothic'] .card),
	:global(html[data-tecspa-theme='ashen-gothic'] article) {
		border-color: #514b4a;
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.025),
			0 18px 45px rgba(0, 0, 0, 0.35);
	}

	/* =========================================================
	   SHARED THEME-WORLD DETAILS
	   ========================================================= */

	:global(html[data-tecspa-theme='digital-cobalt'] input),
	:global(html[data-tecspa-theme='digital-cobalt'] textarea),
	:global(html[data-tecspa-theme='digital-cobalt'] select) {
		border-radius: 4px;
		box-shadow:
			inset 1px 1px 3px rgba(0, 40, 100, 0.12),
			inset -1px -1px 2px rgba(255, 255, 255, 0.85);
	}

	:global(html[data-tecspa-theme='crimson-clinical'] input),
	:global(html[data-tecspa-theme='crimson-clinical'] textarea),
	:global(html[data-tecspa-theme='crimson-clinical'] select) {
		border-radius: 2px;
		background: rgba(255, 252, 252, 0.72);
	}

	:global(html[data-tecspa-theme='ashen-gothic'] input),
	:global(html[data-tecspa-theme='ashen-gothic'] textarea),
	:global(html[data-tecspa-theme='ashen-gothic'] select) {
		border-radius: 0;
		background: #191718;
		color: #eee8e4;
	}

	@media (max-width: 650px) {
		:global(html[data-tecspa-theme='digital-cobalt'] body::before),
		:global(html[data-tecspa-theme='crimson-clinical'] body::before),
		:global(html[data-tecspa-theme='ashen-gothic'] body::before) {
			opacity: 0.55;
		}
	}

	/* =========================================================
	   THEME-SPECIFIC ORNAMENTS
	   ========================================================= */

	.ornament span {
		display: none;
	}

	.ornament-default {
		display: inline !important;
	}

	/* -------------------------
	   DIGITAL COBALT
	   ------------------------- */

	:global(html[data-tecspa-theme='digital-cobalt'])
		.ornament-default {
		display: none !important;
	}

	:global(html[data-tecspa-theme='digital-cobalt'])
		.ornament-digital {
		display: inline !important;
	}

	:global(html[data-tecspa-theme='digital-cobalt'])
		.ornament {
		color: #006fe6;
		opacity: 0.38;

		text-shadow:
			0 1px 0 white,
			0 0 12px rgba(0, 120, 255, 0.35);
	}

	/* -------------------------
	   CRIMSON CLINICAL
	   ------------------------- */

	:global(html[data-tecspa-theme='crimson-clinical'])
		.ornament-default {
		display: none !important;
	}

	:global(html[data-tecspa-theme='crimson-clinical'])
		.ornament-crimson {
		display: inline !important;
	}

	:global(html[data-tecspa-theme='crimson-clinical'])
		.ornament {
		color: #8f1d2c;
		opacity: 0.34;

		text-shadow:
			0 1px 0 rgba(255, 255, 255, 0.7);
	}

	/* -------------------------
	   ASHEN GOTHIC
	   ------------------------- */

	:global(html[data-tecspa-theme='ashen-gothic'])
		.ornament-default {
		display: none !important;
	}

	:global(html[data-tecspa-theme='ashen-gothic'])
		.ornament-ashen {
		display: inline !important;
	}

	:global(html[data-tecspa-theme='ashen-gothic'])
		.ornament {
		color: #c7c0bd;
		opacity: 0.27;

		text-shadow:
			0 2px 5px rgba(0, 0, 0, 0.8);
	}

	/* =========================================================
	   DIGITAL COBALT — FLOATING WEB ARTIFACTS
	   ========================================================= */

	:global(html[data-tecspa-theme='digital-cobalt'])
		.tecspa-shell::before {
		content: '✦ ｡ﾟ･ 𓂃 ☁︎ 𓂃 ･ﾟ｡ ✦';

		position: fixed;
		top: 72px;
		left: 50%;
		transform: translateX(-50%);

		z-index: 1;
		pointer-events: none;

		color: rgba(0, 100, 210, 0.28);

		font-family:
			"Trebuchet MS",
			Arial,
			sans-serif;

		font-size: 0.85rem;
		letter-spacing: 0.45em;
		white-space: nowrap;

		text-shadow:
			0 1px 0 white;
	}

	/* =========================================================
	   CRIMSON CLINICAL — MEDICAL DOCUMENT MARK
	   ========================================================= */

	:global(html[data-tecspa-theme='crimson-clinical'])
		.tecspa-shell::before {
		content: '✚  ·  clinical record  ·  ✚';

		position: fixed;
		top: 74px;
		left: 50%;
		transform: translateX(-50%);

		z-index: 1;
		pointer-events: none;

		color: rgba(110, 20, 32, 0.34);

		font-family:
			"Courier New",
			monospace;

		font-size: 0.65rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;

		border-top: 1px solid rgba(110, 20, 32, 0.20);
		border-bottom: 1px solid rgba(110, 20, 32, 0.20);

		padding: 4px 18px;
	}

	/* =========================================================
	   ASHEN GOTHIC — MOURNING DIVIDER
	   ========================================================= */

	:global(html[data-tecspa-theme='ashen-gothic'])
		.tecspa-shell::before {
		content: '☾  ───────  ❦  ───────  ☾';

		position: fixed;
		top: 72px;
		left: 50%;
		transform: translateX(-50%);

		z-index: 1;
		pointer-events: none;

		color: rgba(210, 203, 199, 0.22);

		font-family: Georgia, serif;

		font-size: 0.72rem;
		letter-spacing: 0.12em;
		white-space: nowrap;

		text-shadow:
			0 1px 4px black;
	}

	@media (max-width: 700px) {
		:global(html[data-tecspa-theme='digital-cobalt'])
			.tecspa-shell::before,
		:global(html[data-tecspa-theme='crimson-clinical'])
			.tecspa-shell::before,
		:global(html[data-tecspa-theme='ashen-gothic'])
			.tecspa-shell::before {
			top: 58px;
			font-size: 0.58rem;
			letter-spacing: 0.08em;
		}
	}

/* =========================================================
   IVORY UNICORN
   porcelain fantasy / moonlight / soft antique ornament
   ========================================================= */

:global(html[data-tecspa-theme='ivory-unicorn'] body) {
	background:
		radial-gradient(
			circle at 18% 10%,
			rgba(255, 255, 255, 0.98) 0,
			rgba(255, 255, 255, 0) 30%
		),
		radial-gradient(
			circle at 82% 18%,
			rgba(211, 203, 224, 0.24) 0,
			rgba(211, 203, 224, 0) 30%
		),
		linear-gradient(
			180deg,
			#f8f7f5 0%,
			#e9e7e5 48%,
			#f3f1ef 100%
		);

	color: #403d42;
}

:global(html[data-tecspa-theme='ivory-unicorn'] body::before) {
	background:
		radial-gradient(
			circle at 25% 30%,
			rgba(255, 255, 255, 0.9) 0,
			transparent 22%
		),
		radial-gradient(
			circle at 75% 65%,
			rgba(155, 143, 176, 0.08) 0,
			transparent 24%
		);
	opacity: 0.75;
}

:global(html[data-tecspa-theme='ivory-unicorn'] .panel),
:global(html[data-tecspa-theme='ivory-unicorn'] .card),
:global(html[data-tecspa-theme='ivory-unicorn'] article) {
	border-color: #d5d0d1;
	background:
		linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.96),
			rgba(247, 245, 243, 0.94)
		);
	box-shadow:
		0 18px 50px rgba(90, 80, 100, 0.09),
		inset 0 1px rgba(255, 255, 255, 0.95);
}

:global(html[data-tecspa-theme='ivory-unicorn'] button) {
	border-color: #c8c1ca;
	background:
		linear-gradient(
			180deg,
			#ffffff 0%,
			#eeeaf0 100%
		);
	color: #665b78;
	box-shadow:
		0 2px 5px rgba(90, 80, 100, 0.08),
		inset 0 1px rgba(255, 255, 255, 0.95);
}

:global(html[data-tecspa-theme='ivory-unicorn'] button:hover) {
	background:
		linear-gradient(
			180deg,
			#ffffff 0%,
			#e6e0ea 100%
		);
	border-color: #9b8fb0;
}

:global(html[data-tecspa-theme='ivory-unicorn'] input),
:global(html[data-tecspa-theme='ivory-unicorn'] textarea),
:global(html[data-tecspa-theme='ivory-unicorn'] select) {
	border-color: #d5d0d1;
	background: rgba(255, 254, 252, 0.88);
	color: #403d42;
	border-radius: 6px;
	box-shadow:
		inset 0 1px 4px rgba(70, 65, 75, 0.05),
		0 1px 0 rgba(255, 255, 255, 0.9);
}

:global(html[data-tecspa-theme='ivory-unicorn'] a) {
	color: #665b78;
}

:global(html[data-tecspa-theme='ivory-unicorn'] a:hover) {
	color: #9b8fb0;
}


/* =========================================================
   INK & IVORY
   antique paper / monochrome ink / Japanese art-book mood
   ========================================================= */

:global(html[data-tecspa-theme='ink-ivory'] body) {
	background:
		radial-gradient(
			circle at 15% 20%,
			rgba(255, 255, 255, 0.52) 0,
			transparent 28%
		),
		radial-gradient(
			circle at 82% 70%,
			rgba(80, 76, 68, 0.06) 0,
			transparent 30%
		),
		linear-gradient(
			180deg,
			#eeeae3 0%,
			#ddd8cf 50%,
			#e8e4dc 100%
		);

	color: #292827;
}

:global(html[data-tecspa-theme='ink-ivory'] body::before) {
	background:
		repeating-linear-gradient(
			0deg,
			transparent 0,
			transparent 5px,
			rgba(50, 47, 43, 0.018) 6px
		);
	opacity: 0.8;
}

:global(html[data-tecspa-theme='ink-ivory'] .panel),
:global(html[data-tecspa-theme='ink-ivory'] .card),
:global(html[data-tecspa-theme='ink-ivory'] article) {
	border-color: #bcb5aa;
	background:
		linear-gradient(
			180deg,
			rgba(249, 247, 241, 0.96),
			rgba(239, 235, 226, 0.94)
		);
	border-radius: 2px;
	box-shadow:
		0 14px 38px rgba(50, 47, 42, 0.10),
		inset 0 0 0 1px rgba(255, 255, 255, 0.45);
}

:global(html[data-tecspa-theme='ink-ivory'] button) {
	border-color: #9f998f;
	border-radius: 2px;
	background:
		linear-gradient(
			180deg,
			#f8f5ee,
			#ddd8ce
		);
	color: #292827;
	box-shadow:
		inset 0 1px rgba(255, 255, 255, 0.8),
		0 2px 5px rgba(40, 38, 34, 0.08);
}

:global(html[data-tecspa-theme='ink-ivory'] button:hover) {
	background:
		linear-gradient(
			180deg,
			#ffffff,
			#d4cec3
		);
	border-color: #383735;
}

:global(html[data-tecspa-theme='ink-ivory'] input),
:global(html[data-tecspa-theme='ink-ivory'] textarea),
:global(html[data-tecspa-theme='ink-ivory'] select) {
	border-color: #bcb5aa;
	border-radius: 2px;
	background: rgba(248, 245, 238, 0.86);
	color: #292827;
}

:global(html[data-tecspa-theme='ink-ivory'] a) {
	color: #383735;
	text-decoration-color: rgba(56, 55, 53, 0.35);
}

:global(html[data-tecspa-theme='ink-ivory'] a:hover) {
	color: #171716;
	text-decoration-color: #171716;
}


/* =========================================================
   GYARU GLAM
   2000s gyaru / magazine / charms / leopard / glitter
   ========================================================= */

:global(html[data-tecspa-theme='gyaru-glam'] body) {
	background:
		radial-gradient(
			circle at 12% 15%,
			rgba(255, 255, 255, 0.9) 0,
			transparent 20%
		),
		radial-gradient(
			circle at 88% 30%,
			rgba(255, 90, 180, 0.18) 0,
			transparent 28%
		),
		linear-gradient(
			180deg,
			#ffdff0 0%,
			#f3c8df 48%,
			#ffdce9 100%
		);

	color: #402331;
}

:global(html[data-tecspa-theme='gyaru-glam'] body::before) {
	background:
		radial-gradient(
			circle,
			rgba(255, 255, 255, 0.55) 0 1px,
			transparent 2px
		);
	background-size: 18px 18px;
	opacity: 0.3;
}

:global(html[data-tecspa-theme='gyaru-glam'] .panel),
:global(html[data-tecspa-theme='gyaru-glam'] .card),
:global(html[data-tecspa-theme='gyaru-glam'] article) {
	border-color: #d985b3;
	background:
		linear-gradient(
			180deg,
			rgba(255, 249, 253, 0.97),
			rgba(255, 235, 246, 0.94)
		);
	border-radius: 16px;
	box-shadow:
		0 15px 35px rgba(210, 25, 120, 0.13),
		0 2px 0 rgba(255, 255, 255, 0.9) inset;
}

:global(html[data-tecspa-theme='gyaru-glam'] button) {
	border-color: #df6fa9;
	border-radius: 999px;
	background:
		linear-gradient(
			180deg,
			#ff6db7 0%,
			#e81787 100%
		);
	color: white;
	text-shadow: 0 1px rgba(100, 0, 50, 0.25);
	box-shadow:
		0 4px 10px rgba(200, 20, 110, 0.2),
		inset 0 1px rgba(255, 255, 255, 0.55);
}

:global(html[data-tecspa-theme='gyaru-glam'] button:hover) {
	background:
		linear-gradient(
			180deg,
			#ff8bc7 0%,
			#f0188b 100%
		);
	transform: translateY(-1px);
}

:global(html[data-tecspa-theme='gyaru-glam'] input),
:global(html[data-tecspa-theme='gyaru-glam'] textarea),
:global(html[data-tecspa-theme='gyaru-glam'] select) {
	border-color: #d985b3;
	border-radius: 10px;
	background: rgba(255, 248, 252, 0.94);
	color: #402331;
	box-shadow:
		inset 0 1px 3px rgba(130, 40, 85, 0.08);
}

:global(html[data-tecspa-theme='gyaru-glam'] a) {
	color: #d4147d;
}

:global(html[data-tecspa-theme='gyaru-glam'] a:hover) {
	color: #f0188b;
}


/* =========================================================
   NEW THEME ORNAMENTS
   ========================================================= */

:global(html[data-tecspa-theme='ivory-unicorn'])
	.ornament {
	color: #9b8fb0;
	text-shadow:
		0 1px 0 rgba(255, 255, 255, 0.9),
		0 0 12px rgba(155, 143, 176, 0.22);
}

:global(html[data-tecspa-theme='ink-ivory'])
	.ornament {
	color: #383735;
	opacity: 0.5;
}

:global(html[data-tecspa-theme='gyaru-glam'])
	.ornament {
	color: #f0188b;
	text-shadow:
		0 0 8px rgba(240, 24, 139, 0.28),
		1px 1px 0 rgba(255, 255, 255, 0.75);
}

	/* =========================================================
	   FALLING THEME SYMBOLS
	   ========================================================= */

	.falling-symbols {
		position: fixed;
		inset: 0;

		z-index: 0;

		overflow: hidden;

		pointer-events: none;

		contain: strict;
	}

	.falling-symbol {
		position: absolute;

		top: -8vh;

		display: block;

		color: var(--tecspa-accent);

		font-family:
			var(--tecspa-heading-font);

		font-size: clamp(
			0.7rem,
			1.3vw,
			1.25rem
		);

		line-height: 1;

		opacity:
			calc(
				var(--tecspa-ornament-opacity) * 0.45
			);

		text-shadow:
			0 1px 4px
			color-mix(
				in srgb,
				var(--tecspa-accent) 18%,
				transparent
			);

		animation-name:
			tecspa-symbol-fall;

		animation-timing-function:
			linear;

		animation-iteration-count:
			infinite;

		will-change:
			transform,
			opacity;
	}

	.falling-symbol::before {
		content:
			var(--tecspa-symbol-primary);
	}

	.falling-symbol:nth-child(even)::before {
		content:
			var(--tecspa-symbol-secondary);
	}

	.symbol-01 {
		left: 4%;
		animation-duration: 18s;
		animation-delay: -13s;
	}

	.symbol-02 {
		left: 12%;
		animation-duration: 23s;
		animation-delay: -5s;
	}

	.symbol-03 {
		left: 21%;
		animation-duration: 20s;
		animation-delay: -17s;
	}

	.symbol-04 {
		left: 31%;
		animation-duration: 26s;
		animation-delay: -8s;
	}

	.symbol-05 {
		left: 42%;
		animation-duration: 21s;
		animation-delay: -19s;
	}

	.symbol-06 {
		left: 51%;
		animation-duration: 24s;
		animation-delay: -11s;
	}

	.symbol-07 {
		left: 61%;
		animation-duration: 19s;
		animation-delay: -3s;
	}

	.symbol-08 {
		left: 70%;
		animation-duration: 27s;
		animation-delay: -15s;
	}

	.symbol-09 {
		left: 78%;
		animation-duration: 22s;
		animation-delay: -7s;
	}

	.symbol-10 {
		left: 85%;
		animation-duration: 25s;
		animation-delay: -20s;
	}

	.symbol-11 {
		left: 92%;
		animation-duration: 20s;
		animation-delay: -10s;
	}

	.symbol-12 {
		left: 97%;
		animation-duration: 28s;
		animation-delay: -22s;
	}

	@keyframes tecspa-symbol-fall {
		0% {
			transform:
				translate3d(
					0,
					-12vh,
					0
				)
				rotate(0deg);

			opacity: 0;
		}

		8% {
			opacity:
				calc(
					var(--tecspa-ornament-opacity) * 0.45
				);
		}

		25% {
			transform:
				translate3d(
					28px,
					25vh,
					0
				)
				rotate(65deg);
		}

		50% {
			transform:
				translate3d(
					-24px,
					52vh,
					0
				)
				rotate(145deg);
		}

		75% {
			transform:
				translate3d(
					30px,
					78vh,
					0
				)
				rotate(230deg);
		}

		92% {
			opacity:
				calc(
					var(--tecspa-ornament-opacity) * 0.22
				);
		}

		100% {
			transform:
				translate3d(
					-18px,
					112vh,
					0
				)
				rotate(320deg);

			opacity: 0;
		}
	}

	@media (
		prefers-reduced-motion: reduce
	) {
		.falling-symbol {
			animation: none;
			opacity: 0.12;
		}
	}

	.page-content {
		position: relative;
		z-index: 1;
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
	   ACCOUNT BAR
	   ========================================================= */

	.account-bar {
		position: relative;
		z-index: 10;
		width: 100%;
		padding: 14px 20px 0;
	}

	.account-bar-inner {
		width: min(100%, 1200px);
		min-height: 52px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 8px 12px;
		border: 1px solid color-mix(
			in srgb,
			var(--tecspa-accent) 30%,
			transparent
		);
		border-radius: 14px;
		background: color-mix(
			in srgb,
			var(--tecspa-background) 82%,
			transparent
		);
		backdrop-filter: blur(12px);
		box-shadow:
			0 8px 28px rgba(0, 0, 0, 0.08),
			inset 0 1px rgba(255, 255, 255, 0.45);
	}

	.account-brand,
	.account-user,
	.account-link,
	.account-button {
		text-decoration: none;
	}

	.account-brand {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		color: var(--tecspa-text);
		font-family: var(--tecspa-heading-font);
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	.account-brand:hover,
	.account-user:hover {
		text-decoration: none;
	}

	.account-brand-mark {
		width: 30px;
		height: 30px;
		display: grid;
		place-items: center;
		border: 1px solid var(--tecspa-accent);
		border-radius: 8px;
		background: color-mix(
			in srgb,
			var(--tecspa-accent) 12%,
			var(--tecspa-background)
		);
		color: var(--tecspa-accent);
		font-size: 0.78rem;
		font-weight: 900;
	}

	.account-status {
		display: flex;
		align-items: center;
		gap: 9px;
	}

	.account-loading {
		font-size: 0.78rem;
		opacity: 0.5;
	}

	.account-link {
		padding: 7px 10px;
		color: var(--tecspa-accent);
		font-size: 0.8rem;
		font-weight: 700;
	}

	.account-button {
		padding: 8px 12px;
		border: 1px solid var(--tecspa-accent);
		border-radius: 9px;
		background: var(--tecspa-accent);
		color: white;
		font-size: 0.78rem;
		font-weight: 800;
	}

	.account-user {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 5px 9px 5px 5px;
		border: 1px solid color-mix(
			in srgb,
			var(--tecspa-accent) 25%,
			transparent
		);
		border-radius: 999px;
		color: var(--tecspa-text);
		font-size: 0.8rem;
		font-weight: 700;
		background: color-mix(
			in srgb,
			var(--tecspa-background) 75%,
			transparent
		);
	}

	.account-avatar {
		width: 27px;
		height: 27px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--tecspa-accent);
		color: white;
		font-size: 0.7rem;
		font-weight: 900;
	}

	.account-link:hover,
	.account-button:hover,
	.account-user:hover {
		filter: brightness(1.06);
	}

	@media (max-width: 700px) {
		.account-bar {
			padding: 10px 10px 0;
		}

		.account-bar-inner {
			min-height: 46px;
			padding: 6px 8px;
			border-radius: 11px;
		}

		.account-brand span:last-child {
			display: none;
		}

		.account-brand-mark {
			width: 28px;
			height: 28px;
		}

		.account-link {
			padding: 6px 7px;
		}

		.account-button {
			padding: 7px 9px;
		}

		.account-user {
			padding-right: 7px;
			font-size: 0.75rem;
		}
	}

	@media (max-width: 420px) {
		.account-status {
			gap: 4px;
		}

		.account-link {
			display: none;
		}

		.account-button {
			font-size: 0.72rem;
		}
	}

</style>