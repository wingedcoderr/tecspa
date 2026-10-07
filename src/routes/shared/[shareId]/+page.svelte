<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';

  type Member = {
    id: string;
    name: string | null;
    pronouns: string | null;
    aliases: string | null;
    role: string | null;
    status: string | null;
    about: string | null;
    interests: string | null;
    frontTriggers: string | null;
    hasAvatar: boolean;
    hasBanner: boolean;
    isFronting: boolean;
  };

  type ChatMessage = {
    id: string;
    senderMemberId: string | null;
    senderName: string | null;
    message: string;
    createdAt: string;
  };

  type JournalEntry = {
    id: string;
    authorMemberId: string | null;
    authorName: string | null;
    title: string;
    body: string;
    tags: unknown[];
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
  };

  type FrontEntry = {
    id: string;
    memberId: string;
    memberName: string | null;
    startedAt: string;
    endedAt: string | null;
    note: string;
  };

  let systemName = '';
  let ownerUsername = '';
  let role: 'viewer' | 'contributor' = 'viewer';
  let canEdit = false;
  let permissions = {
    viewMembers: true,
    viewFronting: true,
    viewFrontHistory: false,
    viewChat: false,
    participateChat: false,
    viewJournal: false,
    viewPolls: false
  };
  let members: Member[] = [];
  let chat: ChatMessage[] = [];
  let journal: JournalEntry[] = [];
  let frontHistory: FrontEntry[] = [];
  let loading = true;
  let saving = false;
  let errorMessage = '';
  let successMessage = '';
  let messageText = '';
  let selectedSenderId = '';
  let journalTitle = '';
  let journalBody = '';
  let editingMember: Member | null = null;
  let editSystemName = '';
  let editingJournal: JournalEntry | null = null;

  function mediaUrl(member: Member, kind: 'avatar' | 'banner') {
    if (!(kind === 'avatar' ? member.hasAvatar : member.hasBanner)) return '';
    return `/api/shared/${encodeURIComponent(shareId)}/media/${encodeURIComponent(member.id)}/${kind}`;
  }

  const shareId = page.params.shareId ?? '';

  async function loadShared() {
    loading = true;
    errorMessage = '';
    try {
      const response = await fetch(`/api/shared/${shareId}`);
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'This shared system could not be opened.');
      systemName = data.system.name;
      ownerUsername = data.system.ownerUsername;
      role = data.share.role;
      canEdit = Boolean(data.canEdit);
      permissions = data.permissions;
      members = data.members ?? [];
      chat = data.chat ?? [];
      journal = data.journal ?? [];
      frontHistory = data.frontHistory ?? [];
      editSystemName = systemName;
      if (!selectedSenderId && members.length) selectedSenderId = members.find((m) => m.name)?.id ?? '';
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'This shared system could not be opened.';
    } finally {
      loading = false;
    }
  }

  async function sendMessage() {
    if (!messageText.trim() || saving) return;
    saving = true; errorMessage = ''; successMessage = '';
    try {
      const response = await fetch(`/api/shared/${shareId}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, senderMemberId: selectedSenderId || null })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'The message could not be sent.');
      messageText = '';
      await loadShared();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'The message could not be sent.';
    } finally { saving = false; }
  }

  async function addJournalEntry() {
    if (!journalTitle.trim() || !journalBody.trim() || saving) return;
    saving = true; errorMessage = ''; successMessage = '';
    try {
      const response = await fetch(`/api/shared/${shareId}/journal`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: journalTitle, body: journalBody, authorMemberId: selectedSenderId || null })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'The journal entry could not be created.');
      journalTitle = ''; journalBody = ''; successMessage = 'Journal entry added.';
      await loadShared();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'The journal entry could not be created.';
    } finally { saving = false; }
  }

  async function saveJournal() {
    if (!editingJournal || !canEdit || !permissions.viewJournal || saving) return;
    saving = true; errorMessage = ''; successMessage = '';
    try {
      const response = await fetch(`/api/shared/${shareId}/journal`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingJournal.id,
          title: editingJournal.title,
          body: editingJournal.body
        })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'The journal entry could not be updated.');
      editingJournal = null;
      successMessage = 'Journal entry updated.';
      await loadShared();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'The journal entry could not be updated.';
    } finally { saving = false; }
  }

  async function toggleFronting(member: Member) {
    if (!canEdit || saving) return;
    saving = true; errorMessage = ''; successMessage = '';
    try {
      const response = await fetch(`/api/shared/${shareId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id, isFronting: !member.isFronting })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Fronting could not be updated.');
      members = data.members ?? members;
      frontHistory = data.frontHistory ?? frontHistory;
      successMessage = `${member.name ?? 'Member'} is ${!member.isFronting ? 'fronting now' : 'no longer fronting'}.`;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Fronting could not be updated.';
    } finally { saving = false; }
  }

  async function saveMember() {
    if (!editingMember || !canEdit || saving) return;
    saving = true; errorMessage = ''; successMessage = '';
    try {
      const response = await fetch(`/api/shared/${shareId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member: editingMember })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'The member could not be updated.');
      editingMember = null;
      successMessage = 'Member profile updated.';
      await loadShared();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'The member could not be updated.';
    } finally { saving = false; }
  }

  async function saveSystemName() {
    if (!canEdit || !editSystemName.trim() || saving) return;
    saving = true; errorMessage = ''; successMessage = '';
    try {
      const response = await fetch(`/api/shared/${shareId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemName: editSystemName })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'The system name could not be updated.');
      systemName = editSystemName.trim();
      successMessage = 'System name updated.';
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'The system name could not be updated.';
    } finally { saving = false; }
  }

  function copy<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  onMount(loadShared);
</script>

<svelte:head>
  <title>{systemName ? `${systemName} — TECSPA` : 'Shared TECSPA'}</title>
</svelte:head>

<div class="page-shell">
  <nav class="top-navigation">
    <a href="/sharing">← sharing</a>
    <a href="/">home</a>
    <a href="/members">your system</a>
  </nav>

  {#if loading}
    <section class="panel loading-panel"><p>opening the shared system…</p></section>
  {:else if errorMessage && !systemName}
    <section class="panel error-panel"><h2>access unavailable</h2><p>{errorMessage}</p></section>
  {:else}
    <header class="page-header">
      <p class="eyebrow">SHARED SYSTEM · {role}</p>
      <h1>{systemName}</h1>
      <p class="subtitle">shared with you by @{ownerUsername}</p>
      <div class="ornament">✦　୨୧　✦</div>
      <p class="access-note">{canEdit ? 'Contributor access · shared data can be edited where permission is granted.' : 'Viewer access · this shared system is read-only for you.'}</p>
      {#if canEdit}
        <div class="system-editor">
          <input bind:value={editSystemName} aria-label="Shared system name" />
          <button class="secondary-button" onclick={saveSystemName} disabled={saving}>save name</button>
        </div>
      {/if}
    </header>

    {#if errorMessage}<div class="notice error">{errorMessage}</div>{/if}
    {#if successMessage}<div class="notice success">{successMessage}</div>{/if}

    {#if permissions.viewFronting}
      <section class="panel front-panel">
        <div class="section-heading"><div><p class="eyebrow">RIGHT NOW</p><h2>currently fronting</h2></div><span>{members.filter((m) => m.isFronting).length}</span></div>
        {#if members.filter((m) => m.isFronting).length === 0}
          <p class="muted">no one is marked as fronting right now.</p>
        {:else}
          <div class="fronter-list">
            {#each members.filter((m) => m.isFronting) as member}
              <div class="fronter">
                <div class="small-avatar">{#if mediaUrl(member, 'avatar')}<img src={mediaUrl(member, 'avatar')} alt="" />{:else}✦{/if}</div>
                <div><strong>{member.name ?? 'Private member'}</strong>{#if member.pronouns}<span>{member.pronouns}</span>{/if}</div>
                {#if canEdit}<button class="tiny-button" onclick={() => toggleFronting(member)} disabled={saving}>end front</button>{/if}
              </div>
            {/each}
          </div>
        {/if}
      </section>
    {/if}

    {#if permissions.viewMembers}
      <section class="panel">
        <div class="section-heading"><div><p class="eyebrow">MEMBERS</p><h2>system directory</h2><p class="muted">Only information included in the shared member view is shown here.</p></div><span>{members.length}</span></div>
        <div class="member-grid">
          {#each members as member}
            <article class="member-card">
              {#if mediaUrl(member, 'banner')}
                <img class="banner" src={mediaUrl(member, 'banner')} alt="" />
              {/if}
              <div class="member-card-content">
                <div class="member-top">
                  <div class="avatar">{#if mediaUrl(member, 'avatar')}<img src={mediaUrl(member, 'avatar')} alt={`${member.name ?? 'Member'} avatar`} />{:else}✦{/if}</div>
                  <div><h3>{member.name ?? 'Private member'}</h3>{#if member.pronouns}<p class="muted">{member.pronouns}</p>{/if}</div>
                </div>
                <div class="member-details">
                  {#if member.aliases}<p><strong>aliases:</strong> {member.aliases}</p>{/if}
                  {#if member.role}<p><strong>role:</strong> {member.role}</p>{/if}
                  {#if member.status}<p><strong>status:</strong> {member.status}</p>{/if}
                  {#if member.about}<p class="detail">{member.about}</p>{/if}
                  {#if member.interests}<p><strong>interests:</strong> {member.interests}</p>{/if}
                  {#if member.frontTriggers}<p><strong>front triggers:</strong> {member.frontTriggers}</p>{/if}
                </div>
                <div class="member-actions">
                  {#if member.isFronting}<span class="fronting-badge">✦ fronting now</span>{/if}
                  {#if canEdit && permissions.viewMembers}
                    <button class="secondary-button" onclick={() => editingMember = copy(member)}>edit profile</button>
                  {/if}
                  {#if canEdit && permissions.viewFronting}
                    <button class="secondary-button" onclick={() => toggleFronting(member)} disabled={saving}>{member.isFronting ? 'end front' : 'set fronting'}</button>
                  {/if}
                </div>
              </div>
            </article>
          {/each}
        </div>
      </section>
    {/if}

    {#if permissions.viewFrontHistory}
      <section class="panel">
        <div class="section-heading"><div><p class="eyebrow">HISTORY</p><h2>front history</h2></div></div>
        <div class="history-list">
          {#each frontHistory as entry}
            <article><strong>{entry.memberName ?? 'system member'}</strong><span>{new Date(entry.startedAt).toLocaleString()}</span>{#if entry.endedAt}<span>→ {new Date(entry.endedAt).toLocaleString()}</span>{/if}{#if entry.note}<p>{entry.note}</p>{/if}</article>
          {/each}
        </div>
      </section>
    {/if}

    {#if permissions.viewChat}
      <section class="panel">
        <div class="section-heading"><div><p class="eyebrow">SHARED SPACE</p><h2>chat</h2><p class="muted">This conversation is visible according to the owner's sharing settings.</p></div></div>
        <div class="chat-list">
          {#if chat.length === 0}<p class="muted">no messages yet.</p>{/if}
          {#each chat as message}
            <article class="chat-message"><strong>{message.senderName ?? 'system member'}</strong><p>{message.message}</p><time>{new Date(message.createdAt).toLocaleString()}</time></article>
          {/each}
        </div>
        {#if permissions.participateChat}
          <div class="composer">
            {#if members.length}<select bind:value={selectedSenderId}><option value="">send without a member identity</option>{#each members as member}<option value={member.id}>{member.name ?? 'Private member'}</option>{/each}</select>{/if}
            <textarea bind:value={messageText} placeholder="write a message…" rows="3"></textarea>
            <button class="primary-button" onclick={sendMessage} disabled={saving || !messageText.trim()}>send message</button>
          </div>
        {/if}
      </section>
    {/if}

    {#if permissions.viewJournal}
      <section class="panel">
        <div class="section-heading"><div><p class="eyebrow">PRIVATE SPACE</p><h2>journal</h2><p class="muted">Only journal entries shared with this invitation are shown.</p></div></div>
        <div class="journal-list">
          {#if journal.length === 0}<p class="muted">no journal entries have been shared.</p>{/if}
          {#each journal as entry}
            <article class="journal-entry">
              <div class="journal-heading"><div><h3>{entry.title}</h3><span>{entry.authorName ?? 'system member'}</span></div>{#if entry.isPinned}<span>pinned</span>{/if}</div>
              <p class="journal-body">{entry.body}</p>
              <div class="entry-footer"><time>{new Date(entry.updatedAt).toLocaleString()}</time>{#if canEdit && permissions.viewJournal}<button class="tiny-button" onclick={() => editingJournal = copy(entry)}>edit</button>{/if}</div>
            </article>
          {/each}
        </div>
        {#if canEdit}
          <div class="journal-actions">
            <span class="muted">Contributor access: you can add and edit shared journal entries.</span>
          </div>
          <div class="composer journal-composer">
            <h3>add journal entry</h3>
            <input bind:value={journalTitle} placeholder="title" />
            {#if members.length}<select bind:value={selectedSenderId}><option value="">no member author</option>{#each members as member}<option value={member.id}>{member.name ?? 'Private member'}</option>{/each}</select>{/if}
            <textarea bind:value={journalBody} placeholder="write something…" rows="6"></textarea>
            <button class="primary-button" onclick={addJournalEntry} disabled={saving || !journalTitle.trim() || !journalBody.trim()}>add entry</button>
          </div>
        {/if}
      </section>
    {/if}
  {/if}

  {#if editingMember}
    <div class="modal-backdrop" role="presentation" onclick={(event) => { if (event.currentTarget === event.target) editingMember = null; }}>
      <div class="modal" role="dialog" aria-modal="true" aria-label="Edit shared member">
        <div class="section-heading"><div><p class="eyebrow">CONTRIBUTOR ACCESS</p><h2>edit member</h2></div><button class="tiny-button" onclick={() => editingMember = null}>close</button></div>
        <label>name<input bind:value={editingMember.name} /></label>
        <label>pronouns<input bind:value={editingMember.pronouns} /></label>
        <label>aliases<input bind:value={editingMember.aliases} /></label>
        <label>role<input bind:value={editingMember.role} /></label>
        <label>status<input bind:value={editingMember.status} /></label>
        <label>about<textarea bind:value={editingMember.about} rows="4"></textarea></label>
        <label>interests<input bind:value={editingMember.interests} /></label>
        <label>front triggers<input bind:value={editingMember.frontTriggers} /></label>
        <div class="modal-actions"><button class="secondary-button" onclick={() => editingMember = null}>cancel</button><button class="primary-button" onclick={saveMember} disabled={saving}>save changes</button></div>
      </div>
    </div>
  {/if}

  {#if editingJournal}
    <div class="modal-backdrop" role="presentation" onclick={(event) => { if (event.currentTarget === event.target) editingJournal = null; }}>
      <div class="modal" role="dialog" aria-modal="true" aria-label="Edit shared journal entry">
        <div class="section-heading"><div><p class="eyebrow">CONTRIBUTOR ACCESS</p><h2>edit journal entry</h2></div><button class="tiny-button" onclick={() => editingJournal = null}>close</button></div>
        <label>title<input bind:value={editingJournal.title} /></label>
        <label>body<textarea bind:value={editingJournal.body} rows="10"></textarea></label>
        <div class="modal-actions"><button class="secondary-button" onclick={() => editingJournal = null}>cancel</button><button class="primary-button" onclick={saveJournal} disabled={saving}>save changes</button></div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(*){box-sizing:border-box}:global(body){margin:0;background:var(--tecspa-background);color:var(--tecspa-text);font-family:var(--tecspa-body-font)}
  .page-shell{min-height:100vh;padding:28px 20px 60px;background:radial-gradient(circle at top left,color-mix(in srgb,var(--tecspa-accent) 10%,transparent),transparent 32%),radial-gradient(circle at bottom right,color-mix(in srgb,var(--tecspa-accent) 9%,transparent),transparent 35%)}
  .top-navigation{max-width:1000px;margin:0 auto 24px;display:flex;gap:20px;justify-content:center;flex-wrap:wrap}.top-navigation a{color:var(--tecspa-text-muted);text-decoration:none;border-bottom:1px solid var(--tecspa-border);padding-bottom:4px}
  .page-header,.panel{max-width:1000px;margin:0 auto 20px;border:1px solid var(--tecspa-border);border-radius:var(--tecspa-panel-radius);background:var(--tecspa-surface);box-shadow:var(--tecspa-panel-shadow)}
  .page-header{padding:38px 26px 32px;text-align:center}.panel{padding:22px}.eyebrow{margin:0 0 7px;color:var(--tecspa-accent);font-family:var(--tecspa-heading-font);font-size:.72rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase}h1,h2,h3,p{margin-top:0}h1{margin-bottom:8px;font-family:var(--tecspa-heading-font);font-size:clamp(2.5rem,7vw,4.5rem);font-style:italic;color:var(--tecspa-accent-dark)}h2,h3{font-family:var(--tecspa-heading-font);color:var(--tecspa-accent-dark)}h2{margin-bottom:6px}.subtitle,.muted,.access-note{color:var(--tecspa-text-muted);line-height:1.6}.access-note{margin:12px 0 0;font-size:.88rem}.ornament{margin-top:15px;color:var(--tecspa-accent);opacity:var(--tecspa-ornament-opacity)}
  .notice{max-width:1000px;margin:0 auto 15px;padding:12px 14px;border:1px solid var(--tecspa-border);border-radius:12px;background:var(--tecspa-surface)}.notice.error{border-color:var(--tecspa-accent)}.notice.success{border-color:var(--tecspa-accent)}
  .section-heading{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:18px}.section-heading>span{padding:5px 10px;border:1px solid var(--tecspa-border);border-radius:999px;color:var(--tecspa-text-muted)}
  .front-panel{border-color:color-mix(in srgb,var(--tecspa-accent) 45%,var(--tecspa-border))}.fronter-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}.fronter{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--tecspa-border);border-radius:12px;background:var(--tecspa-surface-alt)}.fronter div:nth-child(2){flex:1}.fronter span{display:block;color:var(--tecspa-text-muted);font-size:.85rem}.small-avatar,.avatar{overflow:hidden;border-radius:50%;background:var(--tecspa-background);display:grid;place-items:center;color:var(--tecspa-accent);flex-shrink:0}.small-avatar{width:48px;height:48px}.small-avatar img,.avatar img{width:100%;height:100%;object-fit:cover}
  .member-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:15px}.member-card{overflow:hidden;border:1px solid var(--tecspa-border);border-radius:14px;background:var(--tecspa-surface-alt)}.banner{display:block;width:100%;height:130px;object-fit:cover}.member-card-content{padding:17px}.member-top{display:flex;gap:13px;align-items:center}.avatar{width:64px;height:64px}.member-top h3{margin:0 0 3px;font-size:1.35rem}.member-details{margin-top:14px}.member-details p{margin:7px 0;line-height:1.5}.detail,.journal-body{white-space:pre-wrap}.member-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:15px}.fronting-badge{color:var(--tecspa-accent);font-weight:700}
  .history-list,.chat-list,.journal-list{display:grid;gap:10px}.history-list article,.chat-message,.journal-entry{padding:14px;border:1px solid var(--tecspa-border);border-radius:12px;background:var(--tecspa-surface-alt)}.history-list article{display:grid;grid-template-columns:auto auto auto;gap:8px;align-items:baseline}.history-list p{grid-column:1/-1;margin:3px 0}.history-list span,time{color:var(--tecspa-text-muted);font-size:.82rem}.chat-message strong{color:var(--tecspa-accent-dark)}.chat-message p{margin:7px 0;white-space:pre-wrap}.composer{display:grid;gap:10px;margin-top:18px;padding-top:18px;border-top:1px solid var(--tecspa-border)}.composer input,.composer textarea,.composer select,.system-editor input,.modal input,.modal textarea{width:100%;padding:11px 12px;border:1px solid var(--tecspa-border);border-radius:10px;background:var(--tecspa-surface-alt);color:var(--tecspa-text);font:inherit}.journal-heading{display:flex;justify-content:space-between;gap:12px}.journal-heading h3{margin-bottom:3px}.journal-heading span{color:var(--tecspa-text-muted);font-size:.85rem}.journal-body{line-height:1.65;margin:12px 0}.entry-footer{display:flex;justify-content:space-between;align-items:center;gap:10px}.journal-actions{margin-bottom:10px}.system-editor{max-width:560px;margin:20px auto 0;display:flex;gap:8px}.primary-button,.secondary-button,.tiny-button{padding:10px 14px;border-radius:10px;font:inherit;cursor:pointer}.primary-button{border:1px solid var(--tecspa-accent);background:var(--tecspa-accent);color:var(--tecspa-background)}.secondary-button,.tiny-button{border:1px solid var(--tecspa-border);background:var(--tecspa-surface-alt);color:var(--tecspa-text)}.tiny-button{padding:7px 10px;font-size:.82rem}.loading-panel{text-align:center}.error-panel{border-color:var(--tecspa-accent)}
  .modal-backdrop{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:20px;background:color-mix(in srgb,var(--tecspa-background) 72%,transparent)}.modal{width:min(680px,100%);max-height:90vh;overflow:auto;padding:22px;border:1px solid var(--tecspa-border);border-radius:var(--tecspa-panel-radius);background:var(--tecspa-surface);box-shadow:var(--tecspa-panel-shadow)}.modal label{display:grid;gap:6px;margin:12px 0;color:var(--tecspa-text-muted);font-size:.82rem}.modal-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}
  @media(max-width:680px){.page-shell{padding-inline:12px}.page-header,.panel{padding:18px}.member-grid{grid-template-columns:1fr}.history-list article{grid-template-columns:1fr}.system-editor{flex-direction:column}}
</style>
