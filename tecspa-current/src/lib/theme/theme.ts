export type ThemeSettings = {
	themeId: string;

	background: string;
	surface: string;
	surfaceAlt: string;

	accent: string;
	accentDark: string;

	text: string;
	textMuted: string;
	border: string;

	headingFont: string;
	bodyFont: string;

	panelWidth: string;
	panelRadius: string;
	panelShadow: string;

	ornamentOpacity: number;
	textureOpacity: number;

	symbols: string[];
	divider: string;
};

export type ThemePreset = {
	id: string;
	name: string;
	description: string;
	theme: ThemeSettings;
};

const STORAGE_KEY = 'tecspa-theme';

const sharedFonts = {
	headingFont:
		'Georgia, "Times New Roman", serif',
	bodyFont:
		'Arial, Helvetica, sans-serif'
};

export const defaultTheme: ThemeSettings = {
	themeId: 'default',

	background: '#eee8ed',
	surface: '#faf7fa',
	surfaceAlt: '#f1eaf1',

	accent: '#80617a',
	accentDark: '#5d4058',

	text: '#302a30',
	textMuted: '#776e77',
	border: '#d2c5d1',

	headingFont: sharedFonts.headingFont,
	bodyFont: sharedFonts.bodyFont,

	panelWidth: '900px',
	panelRadius: '18px',
	panelShadow: '0 18px 50px rgba(70, 45, 65, 0.10)',

	ornamentOpacity: 0.65,
	textureOpacity: 0.08,

	symbols: ['✦', '♡', '୨୧', '❧'],
	divider: '୨୧ ───── ✦ ───── ୨୧'
};

export const themePresets: ThemePreset[] = [
	{
		id: 'crimson-clinical',
		name: 'Crimson Clinical',
		description:
			'clinical paper, blood-red accents, anatomy, mourning ribbons, and beautiful medical unease.',
		theme: {
			themeId: 'crimson-clinical',

			background: '#e9e1e2',
			surface: '#f8f3f3',
			surfaceAlt: '#eee3e5',

			accent: '#8f1d2c',
			accentDark: '#5a101b',

			text: '#2b2023',
			textMuted: '#79666b',
			border: '#cdb9bd',

			headingFont:
	'Cinzel Decorative, Georgia, serif',
bodyFont:
	'Cormorant Garamond, Georgia, serif',
			panelWidth: '900px',
			panelRadius: '5px',
			panelShadow:
				'0 16px 45px rgba(70, 20, 28, 0.14)',

			ornamentOpacity: 0.8,
			textureOpacity: 0.14,

			symbols: ['✚', '♡', '✂', '🩸'],
			divider: '✚ ── 🩸 ── ✚'
		}
	},

		{
		id: 'digital-cobalt',
		name: 'Digital Cobalt',
		description:
			'2000s personal web pages, MySpace-era profiles, glossy blue interfaces, Windows XP, glittering buttons, and old internet nostalgia.',
		theme: {
			themeId: 'digital-cobalt',

			background: '#b9dcf7',
			surface: '#f7fcff',
			surfaceAlt: '#d7ecfb',

			accent: '#075fd1',
			accentDark: '#003b8f',

			text: '#163b63',
			textMuted: '#52718e',
			border: '#6da6d8',

			headingFont:
	'Starborn, Audiowide, Trebuchet MS, Arial, sans-serif',
bodyFont:
	'Verdana, Arial, Helvetica, sans-serif',
			panelWidth: '920px',
			panelRadius: '4px',
			panelShadow:
				'4px 5px 0 rgba(0, 70, 150, 0.16), 0 12px 30px rgba(0, 76, 160, 0.20), inset 0 1px rgba(255,255,255,0.95)',

			ornamentOpacity: 0.9,
			textureOpacity: 0.22,

			symbols: ['★', '✦', '☁︎', '💿', '♡'],
			divider: '★ ── ✦ ── 💿 ── ✦ ── ★'
		}
	},

	{
		id: 'ashen-gothic',
		name: 'Ashen Gothic',
		description:
			'fog, lace, mourning ribbons, old stone, smoke, devotional relics, and haunted monochrome.',
		theme: {
			themeId: 'ashen-gothic',

			background: '#171617',
			surface: '#242223',
			surfaceAlt: '#2c292a',

			accent: '#c7c0bd',
			accentDark: '#918987',

			text: '#ebe6e2',
			textMuted: '#a69e9a',
			border: '#514c4b',

			headingFont:
	'Faith Collapsing, UnifrakturCook, Georgia, serif',
bodyFont:
	'Cormorant Garamond, Georgia, serif',

			panelWidth: '900px',
			panelRadius: '2px',
			panelShadow:
				'0 20px 60px rgba(0, 0, 0, 0.55)',

			ornamentOpacity: 0.82,
			textureOpacity: 0.22,

			symbols: ['☾', '✞', '🕯', '❦', '𓆩', '𓆪'],
			divider: '✞ ── ❦ ── ☾ ── ❦ ── ✞'
		}
	},

	{
		id: 'pastel-parfait',
		name: 'Pastel Parfait',
		description:
			'soft pastel sweetness with rounded shapes and playful little details.',
		theme: {
			themeId: 'pastel-parfait',

			background: '#fff1f7',
			surface: '#fffafd',
			surfaceAlt: '#f7e7f1',

			accent: '#d68ab1',
			accentDark: '#a95c86',

			text: '#4a3340',
			textMuted: '#8b6e7e',
			border: '#e7bfd4',

			headingFont:
	'Starborn, Quicksand, Arial, sans-serif',
bodyFont:
	'Quicksand, Arial, sans-serif',

			panelWidth: '900px',
			panelRadius: '24px',
			panelShadow:
				'0 18px 45px rgba(180, 100, 145, 0.12)',

			ornamentOpacity: 0.7,
			textureOpacity: 0.06,

			symbols: ['♡', '୨୧', '✿', '☆'],
			divider: '୨୧ · · · ♡ · · · ୨୧'
		}
	},

	{
		id: 'sugar-anatomy',
		name: 'Sugar Anatomy',
		description:
			'neon candy colors, surreal anatomy, glossy webcore sweetness, and wonderfully strange little medical things.',
		theme: {
			themeId: 'sugar-anatomy',

			background: '#c9e98d',
			surface: '#fff5fb',
			surfaceAlt: '#ffd9ec',

			accent: '#ec168f',
			accentDark: '#7b1aa8',

			text: '#3d2450',
			textMuted: '#815f7b',
			border: '#e889b9',

			headingFont:
	'Starborn, Rakkas, Trebuchet MS, sans-serif',
bodyFont:
	'Nunito, Arial, sans-serif',

			panelWidth: '920px',
			panelRadius: '14px',
			panelShadow:
				'0 14px 40px rgba(220, 20, 135, 0.18), 0 4px 12px rgba(122, 26, 168, 0.08)',

			ornamentOpacity: 0.9,
			textureOpacity: 0.16,

			symbols: ['♡', '✦', '🫀', '🎀'],
			divider: '♡ ── ✦ ── 🫀 ── ✦ ── ♡'
		}
	},

	{
		id: 'lavender-clinic',
		name: 'Lavender Clinic',
		description:
			'soft lavender medical imagery with a gentle, dreamy clinical atmosphere.',
		theme: {
			themeId: 'lavender-clinic',

			background: '#eeeafa',
			surface: '#fbf9ff',
			surfaceAlt: '#e5def4',

			accent: '#8b6bb5',
			accentDark: '#64458c',

			text: '#332b40',
			textMuted: '#776b88',
			border: '#c8b9dd',

			headingFont:
	'Yeseva One, Cormorant Garamond, Georgia, serif',
bodyFont:
	'Nunito, Arial, sans-serif',

			panelWidth: '900px',
			panelRadius: '14px',
			panelShadow:
				'0 18px 50px rgba(100, 70, 145, 0.10)',

			ornamentOpacity: 0.7,
			textureOpacity: 0.08,

			symbols: ['✚', '♡', '✦', '୨୧'],
			divider: '✚ · · · ✦ · · · ✚'
		}
	},

	{
		id: 'black-rose',
		name: 'Black Rose',
		description:
			'dark romantic florals, black velvet, and restrained gothic ornament.',
		theme: {
			themeId: 'black-rose',

			background: '#120f12',
			surface: '#201a20',
			surfaceAlt: '#2a222a',

			accent: '#9c405f',
			accentDark: '#65263c',

			text: '#eee4e8',
			textMuted: '#aa939d',
			border: '#503640',

			headingFont:
	'Faith Collapsing, "UnifrakturCook", serif',
bodyFont:
	'"Cormorant Garamond", Georgia, serif',

			panelWidth: '900px',
			panelRadius: '8px',
			panelShadow:
				'0 18px 55px rgba(0, 0, 0, 0.45)',

			ornamentOpacity: 0.75,
			textureOpacity: 0.14,

			symbols: ['❦', '✦', '♡', '🥀'],
			divider: '❦ ─── ✦ ─── ❦'
		}
	},

	{
		id: 'ivory-unicorn',
		name: 'Ivory Unicorn',
		description:
			'porcelain unicorns, moonlit whites, soft fantasy, antique ornament, and dreamy silver details.',
		theme: {
			themeId: 'ivory-unicorn',

			background: '#f1f0ee',
			surface: '#fffdfb',
			surfaceAlt: '#e8e6e3',

			accent: '#9b8fb0',
			accentDark: '#665b78',

			text: '#403d42',
			textMuted: '#89838a',
			border: '#d5d0d1',

			headingFont:
	'Angelic Peace, Cinzel Decorative, Georgia, serif',
bodyFont:
	'Cormorant Garamond, Georgia, serif',

			panelWidth: '900px',
			panelRadius: '10px',
			panelShadow:
				'0 18px 55px rgba(100, 90, 105, 0.12), 0 2px 8px rgba(255,255,255,0.9) inset',

			ornamentOpacity: 0.82,
			textureOpacity: 0.08,

			symbols: ['☾', '✧', '♡', '❀'],
			divider: '☾ ── ✧ ──  ── ✧ ── ☾'
		}
	},

	{
		id: 'ink-ivory',
		name: 'Ink & Ivory',
		description:
			'monochrome ink paintings, antique paper, feathers, peacocks, dragons, calligraphy, and quiet strange beauty.',
		theme: {
			themeId: 'ink-ivory',

			background: '#e7e3dc',
			surface: '#f6f3ed',
			surfaceAlt: '#dcd6cc',

			accent: '#383735',
			accentDark: '#171716',

			text: '#292827',
			textMuted: '#706d68',
			border: '#bcb5aa',

		headingFont:
	'Angelic Peace, IM Fell English, Georgia, serif',
bodyFont:
	'IM Fell English, Georgia, serif',

			panelWidth: '920px',
			panelRadius: '2px',
			panelShadow:
				'0 16px 45px rgba(40, 37, 32, 0.14)',

			ornamentOpacity: 0.9,
			textureOpacity: 0.18,

			symbols: ['❦', '𓆩', '𓆪', '✧', '☾'],
			divider: '❦ ─── ✧ ─── ❦'
		}
	},

		{
		id: 'gyaru-glam',
		name: 'Gyaru Glam',
		description:
			'2000s gyaru fashion, glossy pink personal pages, rhinestones, hearts, bows, leopard print, and maximalist internet glamour.',
		theme: {
			themeId: 'gyaru-glam',

			background: '#f6d7e7',
			surface: '#fffafd',
			surfaceAlt: '#f7dce9',

			accent: '#e60073',
			accentDark: '#a80050',

			text: '#4b2638',
			textMuted: '#8d6376',
			border: '#d98aaa',

			headingFont:
	'Starborn, Quicksand, Arial, sans-serif',
bodyFont:
	'Quicksand, Arial, sans-serif',

			panelWidth: '920px',
			panelRadius: '5px',
			panelShadow:
				'4px 5px 0 rgba(190, 35, 105, 0.16), 0 12px 30px rgba(190, 35, 105, 0.20), inset 0 1px rgba(255,255,255,0.98)',

			ornamentOpacity: 0.95,
			textureOpacity: 0.28,

			symbols: ['♡', '☆', '✧', '🎀', '♥'],
			divider: '♡ ── ☆ ── ✧ ── 🎀 ── ♡'
		}
	},
];

export function loadTheme(): ThemeSettings {
	if (typeof window === 'undefined') {
		return { ...defaultTheme };
	}

	try {
		const stored = window.localStorage.getItem(STORAGE_KEY);

		if (!stored) {
			return { ...defaultTheme };
		}

		const parsed = JSON.parse(stored) as Partial<ThemeSettings>;

		return {
			...defaultTheme,
			...parsed,
			symbols:
				Array.isArray(parsed.symbols) && parsed.symbols.length > 0
					? parsed.symbols
					: defaultTheme.symbols
		};
	} catch {
		return { ...defaultTheme };
	}
}

export function saveTheme(theme: ThemeSettings) {
	if (typeof window === 'undefined') {
		return;
	}

	window.localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify(theme)
	);
}

export function applyTheme(theme: ThemeSettings) {
	if (typeof document === 'undefined') {
		return;
	}

	const root = document.documentElement;

	root.dataset.tecspaTheme = theme.themeId;

	root.style.setProperty(
		'--tecspa-background',
		theme.background
	);

	root.style.setProperty(
		'--tecspa-surface',
		theme.surface
	);

	root.style.setProperty(
		'--tecspa-surface-alt',
		theme.surfaceAlt
	);

	root.style.setProperty(
		'--tecspa-accent',
		theme.accent
	);

	root.style.setProperty(
		'--tecspa-accent-dark',
		theme.accentDark
	);

	root.style.setProperty(
		'--tecspa-text',
		theme.text
	);

	root.style.setProperty(
		'--tecspa-text-muted',
		theme.textMuted
	);

	root.style.setProperty(
		'--tecspa-border',
		theme.border
	);

	root.style.setProperty(
		'--tecspa-heading-font',
		theme.headingFont
	);

	root.style.setProperty(
		'--tecspa-body-font',
		theme.bodyFont
	);

	root.style.setProperty(
		'--tecspa-panel-width',
		theme.panelWidth
	);

	root.style.setProperty(
		'--tecspa-panel-radius',
		theme.panelRadius
	);

	root.style.setProperty(
		'--tecspa-panel-shadow',
		theme.panelShadow
	);

	root.style.setProperty(
		'--tecspa-ornament-opacity',
		String(theme.ornamentOpacity)
	);

	root.style.setProperty(
		'--tecspa-texture-opacity',
		String(theme.textureOpacity)
	);

		const primarySymbol =
		theme.symbols[0] ?? '✦';

	const secondarySymbol =
		theme.symbols[1] ?? '♡';

	const tertiarySymbol =
		theme.symbols[2] ?? '୨୧';

	root.style.setProperty(
		'--tecspa-symbol-primary',
		JSON.stringify(primarySymbol)
	);

	root.style.setProperty(
		'--tecspa-symbol-secondary',
		JSON.stringify(secondarySymbol)
	);

	root.style.setProperty(
		'--tecspa-symbol-tertiary',
		JSON.stringify(tertiarySymbol)
	);
}

export function applyPresetTheme(id: string) {
	const preset = themePresets.find(
		(item) => item.id === id
	);

	if (!preset) {
		return;
	}

	const theme = {
		...preset.theme,
		symbols: [...preset.theme.symbols]
	};

	saveTheme(theme);
	applyTheme(theme);

	if (typeof window !== 'undefined') {
		window.dispatchEvent(
			new CustomEvent('tecspa-theme-change', {
				detail: theme
			})
		);
	}
}

export function resetTheme() {
	const theme = {
		...defaultTheme,
		symbols: [...defaultTheme.symbols]
	};

	saveTheme(theme);
	applyTheme(theme);

	if (typeof window !== 'undefined') {
		window.dispatchEvent(
			new CustomEvent('tecspa-theme-change', {
				detail: theme
			})
		);
	}
}