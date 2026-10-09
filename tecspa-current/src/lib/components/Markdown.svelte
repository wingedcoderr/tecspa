<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	let {
		content = '',
		class: className = ''
	}: {
		content?: string | null;
		class?: string;
	} = $props();

	const renderer = new marked.Renderer();

	renderer.image = ({
		href,
		title,
		text
	}) => {
		const safeHref = DOMPurify.sanitize(
			href ?? '',
			{
				ALLOWED_URI_REGEXP:
					/^(?:(?:https?|mailto|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
			}
		);

		const safeAlt = DOMPurify.sanitize(
			text ?? ''
		);

		const safeTitle = title
			? ` title="${DOMPurify.sanitize(title)}"`
			: '';

		return `<img src="${safeHref}" alt="${safeAlt}"${safeTitle} loading="lazy" />`;
	};

	renderer.link = ({
		href,
		title,
		tokens
	}) => {
		const safeHref = DOMPurify.sanitize(
			href ?? '',
			{
				ALLOWED_URI_REGEXP:
					/^(?:(?:https?|mailto|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
			}
		);

		const linkText = renderer.parser.parseInline(
			tokens
		);

		const safeTitle = title
			? ` title="${DOMPurify.sanitize(title)}"`
			: '';

		return `<a href="${safeHref}"${safeTitle} target="_blank" rel="noopener noreferrer">${linkText}</a>`;
	};

	marked.setOptions({
		renderer,
		gfm: true,
		breaks: true
	});

	function renderMarkdown(
		value: string | null | undefined
	): string {
		if (!value?.trim()) {
			return '';
		}

		const html = marked.parse(value) as string;

		return DOMPurify.sanitize(html, {
			USE_PROFILES: {
				html: true
			}
		});
	}

	let rendered = $derived(
		renderMarkdown(content)
	);
</script>

{#if rendered}
	<div
		class={`markdown-content ${className}`}
	>
		{@html rendered}
	</div>
{/if}

<style>
	.markdown-content {
		line-height: 1.65;
		overflow-wrap: anywhere;
	}

	.markdown-content :global(p) {
		margin: 0 0 0.8rem;
	}

	.markdown-content :global(p:last-child) {
		margin-bottom: 0;
	}

	.markdown-content :global(h1),
	.markdown-content :global(h2),
	.markdown-content :global(h3),
	.markdown-content :global(h4),
	.markdown-content :global(h5),
	.markdown-content :global(h6) {
		margin:
			1.1rem 0
			0.55rem;

		color: var(--tecspa-text);
		font-family: var(--tecspa-heading-font);
		line-height: 1.25;
	}

	.markdown-content :global(h1) {
		font-size: 1.6rem;
	}

	.markdown-content :global(h2) {
		font-size: 1.4rem;
	}

	.markdown-content :global(h3) {
		font-size: 1.2rem;
	}

	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		margin:
			0.5rem 0
			0.9rem;

		padding-left: 1.5rem;
	}

	.markdown-content :global(li) {
		margin: 0.25rem 0;
	}

	.markdown-content :global(blockquote) {
		margin:
			0.9rem 0;

		padding:
			0.55rem 0.9rem;

		border-left:
			3px solid
			var(--tecspa-accent);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 7%,
				transparent
			);

		color: var(--tecspa-text-muted);
	}

	.markdown-content :global(code) {
		padding:
			0.12rem
			0.3rem;

		border-radius: 3px;

		background:
			color-mix(
				in srgb,
				var(--tecspa-text) 8%,
				transparent
			);

		font-family:
			'Courier New',
			monospace;

		font-size: 0.9em;
	}

	.markdown-content :global(pre) {
		margin: 0.9rem 0;
		padding: 0.8rem;

		border:
			1px solid
			var(--tecspa-border);

		border-radius:
			var(--tecspa-panel-radius);

		background:
			color-mix(
				in srgb,
				var(--tecspa-text) 7%,
				var(--tecspa-surface)
			);

		overflow-x: auto;
	}

	.markdown-content :global(pre code) {
		padding: 0;
		background: transparent;
	}

	.markdown-content :global(a) {
		color: var(--tecspa-accent);
		font-weight: 600;
		text-decoration: underline;
	}

	.markdown-content :global(a:hover) {
		color: var(--tecspa-accent-dark);
	}

	.markdown-content :global(hr) {
		margin: 1rem 0;

		border: 0;
		border-top:
			1px solid
			var(--tecspa-border);
	}

	.markdown-content :global(table) {
		width: 100%;
		margin: 0.9rem 0;

		border-collapse: collapse;
		overflow: hidden;
	}

	.markdown-content :global(th),
	.markdown-content :global(td) {
		padding:
			0.45rem
			0.65rem;

		border:
			1px solid
			var(--tecspa-border);

		text-align: left;
	}

	.markdown-content :global(th) {
		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 10%,
				var(--tecspa-surface)
			);

		font-weight: 700;
	}

	.markdown-content :global(img) {
		display: block;

		max-width: 100%;
		height: auto;

		margin:
			0.75rem 0;

		border-radius:
			var(--tecspa-panel-radius);

		object-fit: contain;
	}

	.markdown-content :global(strong) {
		font-weight: 800;
	}

	.markdown-content :global(del) {
		opacity: 0.7;
	}
</style>