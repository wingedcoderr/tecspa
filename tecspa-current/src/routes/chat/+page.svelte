<script lang="ts">
	import { onMount, tick } from 'svelte';

	import type { Member } from '$lib/data/members';
	import type { ChatMessage } from '$lib/data/activity';
	import { memberImageUrl } from '$lib/media/member-media';
import { getDataAdapter } from '$lib/db/data-adapter';

	let members: Member[] = [];
	let messages: ChatMessage[] = [];

	let avatarUrls: Record<string, string> = {};

	let selectedMemberId = '';
	let messageText = '';

	let loading = true;
	let sending = false;

	let errorMessage = '';

	let editingMessageId: string | null = null;
	let editingText = '';

	let messagesContainer: HTMLDivElement | null = null;

	function getMember(
		memberId: string | null | undefined
	): Member | undefined {
		if (!memberId) {
			return undefined;
		}

		return members.find(
			(member) => member.id === memberId
		);
	}

	function getAvatar(
		member: Member | undefined
	): string {
		if (!member) {
			return '';
		}

		return avatarUrls[member.id] ?? '';
	}

	function isSameDay(
		first: string,
		second: string
	): boolean {
		const firstDate = new Date(first);
		const secondDate = new Date(second);

		return (
			firstDate.getFullYear() ===
				secondDate.getFullYear() &&
			firstDate.getMonth() ===
				secondDate.getMonth() &&
			firstDate.getDate() ===
				secondDate.getDate()
		);
	}

	function formatDate(value: string): string {
		return new Date(value).toLocaleDateString(
			undefined,
			{
				weekday: 'long',
				month: 'long',
				day: 'numeric'
			}
		);
	}

	function formatTime(value: string): string {
		return new Date(value).toLocaleTimeString(
			undefined,
			{
				hour: 'numeric',
				minute: '2-digit'
			}
		);
	}

	async function scrollToBottom() {
		await tick();

		if (messagesContainer) {
			messagesContainer.scrollTop =
				messagesContainer.scrollHeight;
		}
	}

	async function loadChat() {
		loading = true;
		errorMessage = '';

		try {
	const dataAdapter = getDataAdapter();

	const loadedMembers =
		await dataAdapter.getMembers();

	const loadedMessages =
		await dataAdapter.getChatMessages();

			const resolvedAvatarUrls: Record<
				string,
				string
			> = {};

			await Promise.all(
				loadedMembers.map(
					async (member) => {
						const avatar =
							member.avatar ?? '';

						if (!avatar) {
							return;
						}

						if (
							avatar.startsWith('data:') ||
							avatar.startsWith('http://') ||
							avatar.startsWith('https://') ||
							avatar.startsWith('asset:')
						) {
							resolvedAvatarUrls[
								member.id
							] = avatar;

							return;
						}

						try {
							resolvedAvatarUrls[
								member.id
							] =
								await memberImageUrl(
									avatar
								);
						} catch (error) {
							console.error(
								`Unable to resolve avatar for ${member.name}:`,
								error
							);
						}
					}
				)
			);

			members = loadedMembers;
			messages = loadedMessages;
			avatarUrls = resolvedAvatarUrls;

			if (
				!selectedMemberId &&
				members.length > 0
			) {
				const frontingMember =
					members.find(
						(member) => member.isFronting
					);

				selectedMemberId =
					frontingMember?.id ??
					members[0].id;
			}

			await scrollToBottom();
		} catch (error) {
			console.error(
				'TECSPA chat load error:',
				error
			);

			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (
				typeof error === 'string'
			) {
				errorMessage = error;
			} else {
				errorMessage =
					'Unable to load chat.';
			}
		} finally {
			loading = false;
		}
	}

	async function sendMessage() {
		const text = messageText.trim();

		if (
			!text ||
			!selectedMemberId ||
			sending
		) {
			return;
		}

		sending = true;
		errorMessage = '';

		try {
			const dataAdapter = getDataAdapter();

const created =
	await dataAdapter.createChatMessage(
		selectedMemberId,
		text
	);

			messages = [
				...messages,
				created
			];

			messageText = '';

			await scrollToBottom();
		} catch (error) {
			console.error(
				'TECSPA chat send error:',
				error
			);

			errorMessage =
				error instanceof Error
					? error.message
					: 'Unable to send message.';
		} finally {
			sending = false;
		}
	}

	function startEditing(
		message: ChatMessage
	) {
		editingMessageId = message.id;
		editingText = message.message;
	}

	function cancelEditing() {
		editingMessageId = null;
		editingText = '';
	}

	async function saveEdit(
		messageId: string
	) {
		const text = editingText.trim();

		if (!text) {
			return;
		}

		try {
			const dataAdapter = getDataAdapter();

const updated =
	await dataAdapter.updateChatMessage(
		messageId,
		text
	);

messages = messages.map(
	(message) =>
		message.id === messageId
			? updated
			: message
);

			cancelEditing();
		} catch (error) {
			console.error(
				'TECSPA chat edit error:',
				error
			);

			errorMessage =
				error instanceof Error
					? error.message
					: 'Unable to edit message.';
		}
	}

	async function removeMessage(
		messageId: string
	) {
		try {
			const dataAdapter = getDataAdapter();

await dataAdapter.deleteChatMessage(
	messageId
);

			messages = messages.filter(
				(message) =>
					message.id !== messageId
			);
		} catch (error) {
			console.error(
				'TECSPA chat delete error:',
				error
			);

			errorMessage =
				error instanceof Error
					? error.message
					: 'Unable to delete message.';
		}
	}

	function handleComposerKeydown(
		event: KeyboardEvent
	) {
		if (
			event.key === 'Enter' &&
			!event.shiftKey
		) {
			event.preventDefault();

			void sendMessage();
		}
	}

	onMount(() => {
		void loadChat();
	});
</script>

<svelte:head>
	<title>Chat · TECSPA</title>
</svelte:head>

<div class="chat-page">
	<header class="page-header">
	<div>
		<a
			class="back-button"
			href="/"
			aria-label="Back to home"
		>
			<span>←</span>
			<span>back</span>
		</a>

		<p class="eyebrow">headmate chat</p>

		<h1>❧ Chat</h1>

		<p class="subtitle">
			A little place for everyone to leave
			messages for each other.
		</p>
	</div>

	<div class="header-symbol">
			<span>✦</span>
			<span>♡</span>
			<span>✦</span>
		</div>
	</header>

	{#if errorMessage}
		<div class="error-banner">
			<strong>Something went wrong.</strong>

			<span>{errorMessage}</span>

			<button
				type="button"
				onclick={() => {
					void loadChat();
				}}
			>
				Try again
			</button>
		</div>
	{/if}

	<div class="chat-shell">
		<aside class="chat-sidebar">
			<div class="sidebar-heading">
				<div>
					<p class="eyebrow">speaking as</p>
					<h2>Headmate</h2>
				</div>

				<span class="sidebar-count">
					{members.length}
				</span>
			</div>

			{#if loading}
				<div class="sidebar-loading">
					Loading headmates…
				</div>
			{:else if members.length === 0}
				<div class="sidebar-empty">
					<p>No headmates yet.</p>

					<span>
						Create a member first to use
						chat.
					</span>
				</div>
			{:else}
				<div class="member-list">
					{#each members as member}
						<button
							type="button"
							class:active={
								selectedMemberId ===
								member.id
							}
							class="member-button"
							onclick={() => {
								selectedMemberId =
									member.id;
							}}
						>
							<div class="member-avatar">
								{#if getAvatar(member)}
									<img
										src={getAvatar(member)}
										alt=""
									/>
								{:else}
									<span>
										{member.name
											.charAt(0)
											.toUpperCase()}
									</span>
								{/if}

								{#if member.isFronting}
									<span
										class="fronting-dot"
										title="Currently fronting"
									></span>
								{/if}
							</div>

							<div class="member-info">
								<strong>
									{member.name}
								</strong>

								{#if member.pronouns}
									<span>
										{member.pronouns}
									</span>
								{/if}
							</div>

							{#if selectedMemberId ===
								member.id}
								<span class="selected-mark">
									✓
								</span>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</aside>

		<section class="chat-main">
			<div class="chat-topbar">
				<div>
					<p class="eyebrow">
						system conversation
					</p>

					<h2>
						{#if selectedMemberId}
							{getMember(selectedMemberId)
								?.name ?? 'Chat'}
						{:else}
							Chat
						{/if}
					</h2>
				</div>

				<div class="message-count">
					{messages.length}
					{messages.length === 1
						? 'message'
						: 'messages'}
				</div>
			</div>

			<div
				class="messages"
				bind:this={messagesContainer}
			>
				{#if loading}
					<div class="empty-chat">
						<div class="empty-symbol">
							❧
						</div>

						<h3>Opening the chat…</h3>

						<p>
							Loading your conversation.
						</p>
					</div>
				{:else if messages.length === 0}
					<div class="empty-chat">
						<div class="empty-symbol">
							♡
						</div>

						<h3>No messages yet</h3>

						<p>
							Be the first person to
							leave something here.
						</p>
					</div>
				{:else}
					{#each messages as message, index}
						{@const member =
							getMember(
								message.senderMemberId
							)}

						{@const previousMessage =
							index > 0
								? messages[index - 1]
								: null}

						{#if !previousMessage ||
							!isSameDay(
								previousMessage.createdAt,
								message.createdAt
							)}
							<div class="date-divider">
								<span>
									{formatDate(
										message.createdAt
									)}
								</span>
							</div>
						{/if}

						<div
							class="message-row"
							class:own={
								message.senderMemberId ===
								selectedMemberId
							}
						>
							<div class="message-avatar">
								{#if getAvatar(member)}
									<img
										src={getAvatar(member)}
										alt=""
									/>
								{:else}
									<span>
										{member?.name
											?.charAt(0)
											?.toUpperCase() ??
											'?'}
									</span>
								{/if}
							</div>

							<div class="message-content">
								<div class="message-meta">
									<strong>
										{member?.name ??
											'Unknown headmate'}
									</strong>

									<span>
										{formatTime(
											message.createdAt
										)}
									</span>

									{#if message.editedAt}
										<span class="edited">
											edited
										</span>
									{/if}
								</div>

								{#if editingMessageId ===
									message.id}
									<div class="edit-box">
										<textarea
											bind:value={editingText}
											rows="3"
											autofocus
										></textarea>

										<div class="edit-actions">
											<button
												type="button"
												class="secondary-button"
												onclick={
													cancelEditing
												}
											>
												Cancel
											</button>

											<button
												type="button"
												class="primary-button"
												onclick={() => {
													void saveEdit(
	message.id
);
												}}
											>
												Save
											</button>
										</div>
									</div>
								{:else}
									<div class="message-bubble">
										{message.message}
									</div>

									<div class="message-actions">
										<button
											type="button"
											onclick={() => {
												startEditing(
													message
												);
											}}
										>
											Edit
										</button>

										<button
											type="button"
											onclick={() => {
												void removeMessage(
													message.id
												);
											}}
										>
											Delete
										</button>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div class="composer">
				<div class="composer-identity">
					<div class="composer-avatar">
						{#if getAvatar(
							getMember(selectedMemberId)
						)}
							<img
								src={getAvatar(
									getMember(selectedMemberId)
								)}
								alt=""
							/>
						{:else}
							<span>
								{getMember(selectedMemberId)
									?.name
									?.charAt(0)
									?.toUpperCase() ?? '?'}
							</span>
						{/if}
					</div>

					<div>
						<span class="composer-label">
							Speaking as
						</span>

						<strong>
							{getMember(selectedMemberId)
								?.name ??
								'Select a headmate'}
						</strong>
					</div>
				</div>

				<textarea
					bind:value={messageText}
					disabled={
						!selectedMemberId ||
						sending
					}
					rows="2"
					placeholder={
						selectedMemberId
							? 'Write a message…'
							: 'Choose a headmate first…'
					}
					onkeydown={handleComposerKeydown}
				></textarea>

				<div class="composer-footer">
					<span>
						Enter to send · Shift + Enter
						for a new line
					</span>

					<button
						type="button"
						class="send-button"
						disabled={
							!selectedMemberId ||
							!messageText.trim() ||
							sending
						}
						onclick={() => {
							void sendMessage();
						}}
					>
						{#if sending}
							Sending…
						{:else}
							Send ✦
						{/if}
					</button>
				</div>
			</div>
		</section>
	</div>
</div>

<style>
	.chat-page {
		width: min(1200px, 100%);
		margin: 0 auto;
		padding: 2rem 1.25rem 3rem;
		color: var(--tecspa-text);
		font-family: var(--tecspa-body-font);
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		margin-bottom: 0.75rem;
		color: var(--tecspa-text-muted);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-decoration: none;
		text-transform: uppercase;
		transition:
			color 0.15s ease,
			transform 0.15s ease;
	}

	.back-button:hover {
		color: var(--tecspa-accent);
		transform: translateX(-3px);
	}

	.back-button span:first-child {
		font-size: 1rem;
	}

	.page-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 2rem;
		margin-bottom: 1.5rem;
	}

	.eyebrow {
		margin: 0 0 0.35rem;
		color: var(--tecspa-accent);
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	h1,
	h2,
	h3 {
		margin: 0;
		font-family: var(--tecspa-heading-font);
	}

	h1 {
		font-size: clamp(2rem, 4vw, 3.2rem);
		line-height: 1;
	}

	.subtitle {
		max-width: 620px;
		margin: 0.75rem 0 0;
		color: var(--tecspa-text-muted);
		line-height: 1.6;
	}

	.header-symbol {
		display: flex;
		gap: 0.55rem;
		color: var(--tecspa-accent);
		font-size: 1.35rem;
		opacity: 0.8;
	}

	.error-banner {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.7rem;
		margin-bottom: 1rem;
		padding: 0.9rem 1rem;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background: var(--tecspa-surface);
		color: var(--tecspa-text);
		box-shadow: var(--tecspa-panel-shadow);
	}

	.error-banner span {
		color: var(--tecspa-text-muted);
		flex: 1;
	}

	.error-banner button {
		border: 0;
		background: transparent;
		color: var(--tecspa-accent);
		cursor: pointer;
		font-weight: 700;
	}

	.chat-shell {
		display: grid;
		grid-template-columns: 280px minmax(0, 1fr);
		min-height: 680px;
		overflow: hidden;
		border: 1px solid var(--tecspa-border);
		border-radius: var(--tecspa-panel-radius);
		background: var(--tecspa-surface);
		box-shadow: var(--tecspa-panel-shadow);
	}

	.chat-sidebar {
		border-right: 1px solid var(--tecspa-border);
		background: var(--tecspa-surface-alt);
	}

	.sidebar-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.25rem;
		border-bottom: 1px solid var(--tecspa-border);
	}

	.sidebar-heading h2 {
		font-size: 1.15rem;
	}

	.sidebar-count,
	.message-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
		padding: 0.3rem 0.55rem;
		border: 1px solid var(--tecspa-border);
		border-radius: 999px;
		background: var(--tecspa-surface);
		color: var(--tecspa-text-muted);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.member-list {
		padding: 0.65rem;
	}

	.member-button {
		display: flex;
		align-items: center;
		width: 100%;
		gap: 0.75rem;
		padding: 0.7rem;
		border: 1px solid transparent;
		border-radius: calc(var(--tecspa-panel-radius) * 0.75);
		background: transparent;
		color: var(--tecspa-text);
		text-align: left;
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			transform 0.15s ease;
	}

	.member-button:hover {
		border-color: var(--tecspa-border);
		background: var(--tecspa-surface);
		transform: translateY(-1px);
	}

	.member-button.active {
		border-color: var(--tecspa-accent);
		background: var(--tecspa-surface);
		box-shadow:
			0 4px 14px
			color-mix(
				in srgb,
				var(--tecspa-accent) 12%,
				transparent
			);
	}

	.member-avatar,
	.message-avatar,
	.composer-avatar {
		position: relative;
		flex: 0 0 auto;
		overflow: hidden;
		border-radius: 50%;
		background: var(--tecspa-surface);
		border: 1px solid var(--tecspa-border);
	}

	.member-avatar {
		width: 42px;
		height: 42px;
	}

	.message-avatar {
		width: 38px;
		height: 38px;
	}

	.composer-avatar {
		width: 40px;
		height: 40px;
	}

	.member-avatar img,
	.message-avatar img,
	.composer-avatar img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	.member-avatar > span:not(.fronting-dot),
	.message-avatar > span,
	.composer-avatar > span {
		display: grid;
		width: 100%;
		height: 100%;
		place-items: center;
		color: var(--tecspa-accent);
		font-weight: 800;
	}

	.fronting-dot {
		position: absolute;
		right: 1px;
		bottom: 1px;
		width: 10px;
		height: 10px;
		border: 2px solid var(--tecspa-surface);
		border-radius: 50%;
		background: var(--tecspa-accent);
	}

	.member-info {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 0.15rem;
	}

	.member-info strong {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.member-info span {
		color: var(--tecspa-text-muted);
		font-size: 0.75rem;
	}

	.selected-mark {
		color: var(--tecspa-accent);
		font-weight: 900;
	}

	.sidebar-loading,
	.sidebar-empty {
		padding: 1.25rem;
		color: var(--tecspa-text-muted);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.sidebar-empty p {
		margin: 0 0 0.25rem;
		color: var(--tecspa-text);
		font-weight: 700;
	}

	.chat-main {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		min-width: 0;
		min-height: 0;
		background: var(--tecspa-background);
	}

	.chat-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.1rem 1.25rem;
		border-bottom: 1px solid var(--tecspa-border);
		background: var(--tecspa-surface);
	}

	.chat-topbar h2 {
		font-size: 1.3rem;
	}

	.messages {
		min-height: 0;
		overflow-y: auto;
		padding: 1.5rem 1.25rem 2rem;
		scroll-behavior: smooth;
	}

	.empty-chat {
		display: grid;
		min-height: 100%;
		place-items: center;
		align-content: center;
		padding: 3rem 1rem;
		text-align: center;
	}

	.empty-symbol {
		display: grid;
		width: 64px;
		height: 64px;
		margin-bottom: 1rem;
		place-items: center;
		border: 1px solid var(--tecspa-border);
		border-radius: 50%;
		background: var(--tecspa-surface);
		color: var(--tecspa-accent);
		font-size: 1.7rem;
	}

	.empty-chat h3 {
		font-size: 1.25rem;
	}

	.empty-chat p {
		margin: 0.45rem 0 0;
		color: var(--tecspa-text-muted);
	}

	.date-divider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 1.25rem 0;
		color: var(--tecspa-text-muted);
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.date-divider::before,
	.date-divider::after {
		content: '';
		height: 1px;
		flex: 1;
		background: var(--tecspa-border);
	}

	.message-row {
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
		max-width: 820px;
		margin-bottom: 1.1rem;
	}

	.message-row.own {
		margin-left: auto;
	}

	.message-content {
		min-width: 0;
		max-width: min(680px, 80%);
	}

	.message-meta {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-bottom: 0.3rem;
	}

	.message-meta strong {
		font-size: 0.85rem;
	}

	.message-meta span {
		color: var(--tecspa-text-muted);
		font-size: 0.7rem;
	}

	.message-meta .edited {
		font-style: italic;
	}

	.message-bubble {
		padding: 0.8rem 0.95rem;
		border: 1px solid var(--tecspa-border);
		border-radius: 0.85rem;
		background: var(--tecspa-surface);
		line-height: 1.55;
		white-space: pre-wrap;
		word-break: break-word;
		box-shadow:
			0 3px 12px
			color-mix(
				in srgb,
				var(--tecspa-text) 4%,
				transparent
			);
	}

	.message-row.own .message-bubble {
		border-color: var(--tecspa-accent);
		background: color-mix(
			in srgb,
			var(--tecspa-accent) 9%,
			var(--tecspa-surface)
		);
	}

	.message-actions {
		display: flex;
		gap: 0.6rem;
		margin-top: 0.25rem;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.message-row:hover .message-actions {
		opacity: 1;
	}

	.message-actions button {
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--tecspa-text-muted);
		font: inherit;
		font-size: 0.7rem;
		cursor: pointer;
	}

	.message-actions button:hover {
		color: var(--tecspa-accent);
	}

	.edit-box {
		padding: 0.75rem;
		border: 1px solid var(--tecspa-accent);
		border-radius: 0.85rem;
		background: var(--tecspa-surface);
	}

	.edit-box textarea {
		width: 100%;
		min-height: 70px;
		resize: vertical;
		border: 0;
		outline: 0;
		background: transparent;
		color: var(--tecspa-text);
		font: inherit;
		line-height: 1.5;
	}

	.edit-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.primary-button,
	.secondary-button {
		padding: 0.45rem 0.75rem;
		border-radius: 0.55rem;
		font: inherit;
		font-size: 0.78rem;
		font-weight: 700;
		cursor: pointer;
	}

	.primary-button {
		border: 1px solid var(--tecspa-accent);
		background: var(--tecspa-accent);
		color: var(--tecspa-surface);
	}

	.secondary-button {
		border: 1px solid var(--tecspa-border);
		background: var(--tecspa-surface);
		color: var(--tecspa-text);
	}

	.composer {
		padding: 0.85rem 1rem 1rem;
		border-top: 1px solid var(--tecspa-border);
		background: var(--tecspa-surface);
	}

	.composer-identity {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		margin-bottom: 0.7rem;
	}

	.composer-identity > div:last-child {
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
	}

	.composer-label {
		color: var(--tecspa-text-muted);
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.composer-identity strong {
		font-size: 0.85rem;
	}

	.composer textarea {
		display: block;
		width: 100%;
		box-sizing: border-box;
		resize: vertical;
		min-height: 58px;
		max-height: 180px;
		padding: 0.75rem 0.85rem;
		border: 1px solid var(--tecspa-border);
		border-radius: 0.75rem;
		outline: none;
		background: var(--tecspa-background);
		color: var(--tecspa-text);
		font: inherit;
		line-height: 1.5;
	}

	.composer textarea:focus {
		border-color: var(--tecspa-accent);
	}

	.composer textarea:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.composer-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.6rem;
	}

	.composer-footer > span {
		color: var(--tecspa-text-muted);
		font-size: 0.68rem;
	}

	.send-button {
		padding: 0.65rem 1rem;
		border: 1px solid var(--tecspa-accent);
		border-radius: 0.65rem;
		background: var(--tecspa-accent);
		color: var(--tecspa-surface);
		font: inherit;
		font-size: 0.78rem;
		font-weight: 800;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			opacity 0.15s ease;
	}

	.send-button:hover:not(:disabled) {
		transform: translateY(-1px);
	}

	.send-button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	@media (max-width: 800px) {
		.chat-shell {
			grid-template-columns: 1fr;
		}

		.chat-sidebar {
			border-right: 0;
			border-bottom: 1px solid var(--tecspa-border);
		}

		.member-list {
			display: flex;
			gap: 0.5rem;
			overflow-x: auto;
		}

		.member-button {
			flex: 0 0 auto;
			width: auto;
			min-width: 150px;
		}

		.message-content {
			max-width: 85%;
		}
	}

	@media (max-width: 520px) {
		.chat-page {
			padding-inline: 0.75rem;
		}

		.page-header {
			align-items: flex-start;
		}

		.header-symbol {
			display: none;
		}

		.chat-shell {
			min-height: 600px;
		}

		.composer-footer {
			align-items: flex-end;
		}

		.composer-footer > span {
			max-width: 55%;
		}
	}

/* =========================================================
   TECSPA CHAT — MOBILE REBUILD
   ========================================================= */

@media (max-width: 700px) {
	/* -----------------------------------------------------
	   PAGE FOUNDATION
	   ----------------------------------------------------- */

	.chat-page {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding: 18px 10px 28px;

		overflow-x: hidden;
	}

	.page-header {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		display: flex;
		align-items: flex-start;
		justify-content: space-between;

		gap: 12px;

		margin-bottom: 16px;
	}

	.page-header > div:first-child {
		min-width: 0;
		max-width: 100%;
	}

	.back-button {
		margin-bottom: 10px;
	}

	.page-header h1 {
		max-width: 100%;

		font-size: clamp(2.2rem, 12vw, 3.4rem);
		line-height: 0.98;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.subtitle {
		max-width: 100%;

		font-size: 0.82rem;
		line-height: 1.6;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.header-symbol {
		flex: 0 0 auto;

		padding-top: 28px;

		font-size: 1rem;
	}

	/* -----------------------------------------------------
	   ERROR
	   ----------------------------------------------------- */

	.error-banner {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		align-items: stretch;
		flex-direction: column;

		gap: 7px;

		margin-bottom: 12px;
		padding: 12px 13px;
	}

	.error-banner span {
		width: 100%;
		min-width: 0;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.error-banner button {
		align-self: flex-start;

		min-height: 42px;

		padding: 8px 12px;
	}

	/* -----------------------------------------------------
	   MAIN CHAT SHELL
	   ----------------------------------------------------- */

	.chat-shell {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-direction: column;

		min-height: 0;

		box-sizing: border-box;

		overflow: hidden;
	}

	/* -----------------------------------------------------
	   HEADMATE SELECTOR
	   ----------------------------------------------------- */

	.chat-sidebar {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		border-right: 0;
		border-bottom: 1px solid var(--tecspa-border);
	}

	.sidebar-heading {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		padding: 12px 13px;

		gap: 10px;
	}

	.sidebar-heading h2 {
		font-size: 1rem;
	}

	.sidebar-count {
		min-width: 30px;

		padding: 4px 8px;
	}

	/* Horizontal scrolling member picker.
	   This is much better on a phone than a 280px sidebar. */

	.chat-sidebar .member-list {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;

		flex-direction: row;

		gap: 8px;

		box-sizing: border-box;

		padding: 9px 10px 12px;

		overflow-x: auto;
		overflow-y: hidden;

		scrollbar-width: thin;

		-webkit-overflow-scrolling: touch;
	}

	.chat-sidebar .member-button {
		flex: 0 0 auto;

		width: auto;
		min-width: 108px;
		max-width: 145px;

		min-height: 72px;

		display: flex;
		align-items: center;

		gap: 8px;

		box-sizing: border-box;

		padding: 8px;

		border-color: var(--tecspa-border);

		background: color-mix(
			in srgb,
			var(--tecspa-surface) 75%,
			transparent
		);

		-webkit-tap-highlight-color: transparent;
	}

	.chat-sidebar .member-button.active {
		border-color: var(--tecspa-accent);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 10%,
				var(--tecspa-surface)
			);
	}

	.chat-sidebar .member-avatar {
		position: relative;

		width: 42px;
		height: 42px;

		flex: 0 0 42px;

		box-sizing: border-box;

		overflow: hidden;
	}

	.chat-sidebar .member-avatar img {
		width: 100%;
		height: 100%;

		display: block;

		object-fit: cover;
	}

	.chat-sidebar .member-info {
		min-width: 0;
		max-width: 100%;
	}

	.chat-sidebar .member-info strong,
	.chat-sidebar .member-info span {
		display: block;

		max-width: 100%;

		overflow: hidden;

		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chat-sidebar .member-info strong {
		font-size: 0.78rem;
	}

	.chat-sidebar .member-info span {
		margin-top: 2px;

		font-size: 0.64rem;
	}

	.chat-sidebar .selected-mark {
		margin-left: auto;

		flex: 0 0 auto;

		color: var(--tecspa-accent);

		font-size: 0.8rem;
	}

	.chat-sidebar .fronting-dot {
		position: absolute;

		right: 0;
		bottom: 0;

		width: 10px;
		height: 10px;

		border: 2px solid var(--tecspa-surface);

		border-radius: 50%;

		background: var(--tecspa-accent);
	}

	.sidebar-loading,
	.sidebar-empty {
		padding: 16px 13px;

		font-size: 0.8rem;
		line-height: 1.5;
	}

	/* -----------------------------------------------------
	   CHAT MAIN
	   ----------------------------------------------------- */

	.chat-main {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-direction: column;

		box-sizing: border-box;

		min-height: 600px;
	}

	.chat-topbar {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		align-items: center;
		justify-content: space-between;

		gap: 10px;

		box-sizing: border-box;

		padding: 13px;

		border-bottom: 1px solid var(--tecspa-border);
	}

	.chat-topbar > div:first-child {
		min-width: 0;
		max-width: 100%;
	}

	.chat-topbar h2 {
		max-width: 100%;

		margin-top: 2px;

		font-size: clamp(1.25rem, 7vw, 1.8rem);
		line-height: 1.05;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.message-count {
		flex: 0 0 auto;

		font-size: 0.65rem;
	}

	/* -----------------------------------------------------
	   MESSAGE AREA
	   ----------------------------------------------------- */

	.messages {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		min-height: 380px;
		max-height: none;

		padding: 14px 11px;

		overflow-x: hidden;
		overflow-y: auto;
	}

	.date-divider {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		margin: 10px 0 14px;

		text-align: center;
	}

	.date-divider span {
		display: inline-block;

		max-width: 100%;

		padding: 4px 9px;

		border: 1px solid var(--tecspa-border);
		border-radius: 999px;

		background: var(--tecspa-surface);

		color: var(--tecspa-text-muted);

		font-size: 0.62rem;
		line-height: 1.3;
	}

	/* -----------------------------------------------------
	   MESSAGE ROWS
	   ----------------------------------------------------- */

	.message-row {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		align-items: flex-start;

		gap: 8px;

		box-sizing: border-box;

		margin-bottom: 13px;
	}

	.message-row.own {
		flex-direction: row-reverse;
	}

	.message-avatar {
		width: 34px;
		height: 34px;

		flex: 0 0 34px;

		box-sizing: border-box;

		overflow: hidden;

		border: 1px solid var(--tecspa-border);
		border-radius: 50%;

		background: var(--tecspa-surface-alt);
	}

	.message-avatar img {
		width: 100%;
		height: 100%;

		display: block;

		object-fit: cover;
	}

	.message-content {
		flex: 1 1 auto;

		width: 0;
		min-width: 0;
		max-width: min(82%, 430px);
	}

	.message-row.own .message-content {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.message-meta {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		align-items: baseline;
		flex-wrap: wrap;

		gap: 5px;

		margin-bottom: 4px;
	}

	.message-row.own .message-meta {
		justify-content: flex-end;
	}

	.message-meta strong {
		max-width: 100%;

		font-size: 0.72rem;

		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.message-meta span {
		color: var(--tecspa-text-muted);

		font-size: 0.62rem;
	}

	.message-bubble {
		width: fit-content;
		max-width: 100%;

		box-sizing: border-box;

		padding: 9px 11px;

		border: 1px solid var(--tecspa-border);
		border-radius: 12px 12px 12px 3px;

		background:
			color-mix(
				in srgb,
				var(--tecspa-surface-alt) 78%,
				transparent
			);

		color: var(--tecspa-text);

		font-size: 0.82rem;
		line-height: 1.55;

		overflow-wrap: anywhere;
		word-break: break-word;

		white-space: pre-wrap;
	}

	.message-row.own .message-bubble {
		border-radius: 12px 12px 3px 12px;

		border-color:
			color-mix(
				in srgb,
				var(--tecspa-accent) 45%,
				var(--tecspa-border)
			);

		background:
			color-mix(
				in srgb,
				var(--tecspa-accent) 10%,
				var(--tecspa-surface)
			);
	}

	.message-actions {
		display: flex;
		flex-wrap: wrap;

		gap: 4px;

		margin-top: 3px;
	}

	.message-row.own .message-actions {
		justify-content: flex-end;
	}

	.message-actions button {
		min-height: 30px;

		padding: 4px 7px;

		border: 0;
		background: transparent;

		color: var(--tecspa-text-muted);

		font-size: 0.6rem;

		cursor: pointer;
	}

	.message-actions button:hover {
		color: var(--tecspa-accent);
	}

	/* -----------------------------------------------------
	   EDITING
	   ----------------------------------------------------- */

	.edit-box {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;
	}

	.edit-box textarea {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		min-height: 90px;

		padding: 9px;

		font: inherit;
		font-size: 0.82rem;
		line-height: 1.5;

		resize: vertical;
	}

	.edit-actions {
		width: 100%;

		display: flex;
		flex-direction: column;

		gap: 6px;

		margin-top: 6px;
	}

	.edit-actions button {
		width: 100%;
		min-height: 42px;

		box-sizing: border-box;
	}

	/* -----------------------------------------------------
	   EMPTY CHAT
	   ----------------------------------------------------- */

	.empty-chat {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		padding: 45px 18px;

		text-align: center;
	}

	.empty-chat h3 {
		max-width: 100%;

		font-size: 1.35rem;

		overflow-wrap: anywhere;
	}

	.empty-chat p {
		max-width: 100%;

		font-size: 0.8rem;
		line-height: 1.6;

		overflow-wrap: anywhere;
	}

	.empty-symbol {
		font-size: 2.5rem;
	}

	/* -----------------------------------------------------
	   COMPOSER
	   ----------------------------------------------------- */

	.composer {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		box-sizing: border-box;

		padding: 11px;

		border-top: 1px solid var(--tecspa-border);

		background:
			color-mix(
				in srgb,
				var(--tecspa-surface) 96%,
				transparent
			);
	}

	.composer-identity {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		align-items: center;

		gap: 8px;

		margin-bottom: 8px;
	}

	.composer-avatar {
		width: 34px;
		height: 34px;

		flex: 0 0 34px;

		box-sizing: border-box;

		overflow: hidden;

		border: 1px solid var(--tecspa-border);
		border-radius: 50%;
	}

	.composer-avatar img {
		width: 100%;
		height: 100%;

		display: block;

		object-fit: cover;
	}

	.composer-identity > div:last-child {
		min-width: 0;
		max-width: 100%;
	}

	.composer-label {
		display: block;

		margin-bottom: 2px;

		color: var(--tecspa-text-muted);

		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.composer-identity strong {
		display: block;

		max-width: 100%;

		font-size: 0.78rem;

		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.composer > textarea {
		width: 100%;
		max-width: 100%;

		box-sizing: border-box;

		min-height: 78px;

		padding: 10px;

		border: 1px solid var(--tecspa-border);
		border-radius: 8px;

		background: var(--tecspa-surface-alt);
		color: var(--tecspa-text);

		font: inherit;
		font-size: 0.82rem;
		line-height: 1.5;

		resize: vertical;
	}

	.composer-footer {
		width: 100%;
		max-width: 100%;
		min-width: 0;

		display: flex;
		flex-direction: column;

		gap: 8px;

		box-sizing: border-box;

		margin-top: 8px;
	}

	.composer-footer > span {
		max-width: 100%;

		color: var(--tecspa-text-muted);

		font-size: 0.62rem;
		line-height: 1.4;

		overflow-wrap: anywhere;
	}

	.send-button {
		width: 100%;
		min-height: 46px;

		box-sizing: border-box;

		border: 1px solid var(--tecspa-accent);
		border-radius: 3px;

		background: var(--tecspa-accent);
		color: white;

		font: inherit;
		font-size: 0.8rem;
		font-weight: 800;

		cursor: pointer;
	}

	.send-button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* -----------------------------------------------------
	   HARD OVERFLOW SAFETY
	   ----------------------------------------------------- */

	.chat-page *,
	.chat-page *::before,
	.chat-page *::after {
		min-width: 0;
		max-width: 100%;
	}

	.chat-page img,
	.chat-page textarea,
	.chat-page button {
		max-width: 100%;
	}
}


/* =========================================================
   SMALL PHONE
   ========================================================= */

@media (max-width: 420px) {
	.chat-page {
		padding-left: 6px;
		padding-right: 6px;
	}

	.page-header {
		gap: 6px;
	}

	.header-symbol {
		font-size: 0.85rem;
	}

	.chat-sidebar .member-button {
		min-width: 100px;
	}

	.message-content {
		max-width: 84%;
	}

	.message-bubble {
		font-size: 0.79rem;
	}
}


/* =========================================================
   VERY SMALL PHONE
   ========================================================= */

@media (max-width: 350px) {
	.chat-page {
		padding-left: 4px;
		padding-right: 4px;
	}

	.chat-sidebar .member-button {
		min-width: 92px;
	}

	.chat-sidebar .member-avatar {
		width: 36px;
		height: 36px;

		flex-basis: 36px;
	}

	.message-avatar {
		width: 30px;
		height: 30px;

		flex-basis: 30px;
	}

	.message-content {
		max-width: 86%;
	}
}

</style>