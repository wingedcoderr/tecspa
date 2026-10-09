<script lang="ts">
 import { onMount } from 'svelte';
 import { getMasterKey } from '$lib/crypto/session';
 import { listMemberRecords } from '$lib/crypto/vault';
 type Member={id:string;name:string;avatar?:string|null};
 type Post={id:string;author:string;text:string;createdAt:string;memberId?:string|null;parentPostId?:string|null;reactionCount?:number};
 type Channel={id:string;name:string;posts:Post[]};
 type Community={id:string;name:string;description:string;visibility:'Public'|'Private';channels:Channel[];role?:string;memberCount?:number;membershipStatus?:string};
 let communities:Community[]=[]; let selectedCommunityId=''; let selectedChannelId=''; let members:Member[]=[]; let selectedMemberId='system'; let postText=''; let communityName=''; let communityDescription=''; let communityVisibility:'Public'|'Private'='Public'; let channelName=''; let showCreateCommunity=false; let showCreateChannel=false; let notice='Loading communities…'; let busy=false; let replyToPostId='';
 $: selectedCommunity=communities.find(c=>c.id===selectedCommunityId)??communities[0];
 $: selectedChannel=selectedCommunity?.channels.find(c=>c.id===selectedChannelId)??selectedCommunity?.channels[0];
 $: selectedMember=members.find(m=>m.id===selectedMemberId);
 const api=async(path:string,init:RequestInit={})=>{const res=await fetch(path,{...init,headers:{'content-type':'application/json',...(init.headers??{})},credentials:'same-origin'});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error??`Request failed (${res.status})`);return data;};
 const fromCommunity=(r:any):Community=>({id:r.id,name:r.name,description:r.description??'',visibility:r.visibility==='private'?'Private':'Public',channels:[],role:r.role,memberCount:Number(r.member_count??0),membershipStatus:r.membership_status});
 const fromPost=(r:any):Post=>({id:r.id,author:r.author_display_name??'System',text:r.content??'',createdAt:new Date(r.created_at).toLocaleString(),memberId:r.author_member_id,parentPostId:r.parent_post_id,reactionCount:Number(r.reaction_count??0)});
 async function loadPosts(communityId=selectedCommunity?.id,channelId=selectedChannel?.id){if(!communityId||!channelId)return;const data=await api(`/api/communities/${encodeURIComponent(communityId)}/posts?channelId=${encodeURIComponent(channelId)}`);const posts=(data.posts??[]).map(fromPost);communities=communities.map(c=>c.id!==communityId?c:{...c,channels:c.channels.map(ch=>ch.id===channelId?{...ch,posts}:ch)});}
 async function loadCommunity(id:string){const data=await api(`/api/communities/${encodeURIComponent(id)}`);const c=fromCommunity(data.community);c.channels=(data.channels??[]).map((ch:any)=>({id:ch.id,name:ch.name,posts:[]}));communities=communities.map(old=>old.id===id?c:old);selectedCommunityId=id;selectedChannelId=c.channels[0]?.id??'';if(selectedChannelId)await loadPosts(id,selectedChannelId);}
 async function refreshCommunities(){const data=await api('/api/communities');communities=(data.communities??[]).map(fromCommunity);if(communities.length){const keep=communities.some(c=>c.id===selectedCommunityId)?selectedCommunityId:communities[0].id;await loadCommunity(keep);}else{selectedCommunityId='';selectedChannelId='';}notice='Communities are synced with your TECSPA account.';}
 onMount(async()=>{try{await refreshCommunities();}catch(e){notice=e instanceof Error?e.message:'Could not load communities. Sign in and try again.';}if(getMasterKey()){try{const records=await listMemberRecords();members=records.map((r:any)=>({id:r.id??r.data?.id,name:r.name??r.data?.name??r.displayName??r.data?.displayName??'Unnamed member',avatar:r.avatar??r.data?.avatar??null})).filter((member:Member)=>Boolean(member.id));if(members.length)selectedMemberId=members[0].id;}catch{notice+=' Member identities could not be decrypted; posting as your system remains available.';}}else{notice+=' Unlock encryption to select a member identity.';}});
 async function selectCommunity(id:string){try{await loadCommunity(id);notice='Community loaded.';}catch(e){notice=e instanceof Error?e.message:'Could not load community.';}}
 async function createCommunity(){const name=communityName.trim();if(!name)return;busy=true;try{const data=await api('/api/communities',{method:'POST',body:JSON.stringify({name,description:communityDescription.trim(),visibility:communityVisibility.toLowerCase()})});communityName='';communityDescription='';communityVisibility='Public';showCreateCommunity=false;await refreshCommunities();await selectCommunity(data.community.id);notice='Community created and saved to TECSPA.';}catch(e){notice=e instanceof Error?e.message:'Could not create community.';}finally{busy=false;}}
 async function createChannel(){const name=channelName.trim();if(!name||!selectedCommunity)return;busy=true;try{await api(`/api/communities/${selectedCommunity.id}/channels`,{method:'POST',body:JSON.stringify({name})});channelName='';showCreateChannel=false;await loadCommunity(selectedCommunity.id);notice='Channel created.';}catch(e){notice=e instanceof Error?e.message:'Could not create channel.';}finally{busy=false;}}
 async function submitPost(){const text=postText.trim();if(!text||!selectedCommunity||!selectedChannel)return;busy=true;try{await api(`/api/communities/${selectedCommunity.id}/posts`,{method:'POST',body:JSON.stringify({channelId:selectedChannel.id,content:text,displayName:selectedMember?.name??'System',memberId:selectedMemberId==='system'?null:selectedMemberId,parentPostId:replyToPostId||null})});postText='';replyToPostId='';await loadPosts();notice='Post saved.';}catch(e){notice=e instanceof Error?e.message:'Could not publish post.';}finally{busy=false;}}
 async function react(post:Post){if(!selectedCommunity)return;try{await api(`/api/communities/${selectedCommunity.id}/posts/${post.id}/reactions`,{method:'POST',body:JSON.stringify({reaction:'heart'})});await loadPosts();}catch(e){notice=e instanceof Error?e.message:'Could not react.';}}
 async function reply(post:Post){replyToPostId=post.id;postText='';const box=document.querySelector('.composer textarea') as HTMLTextAreaElement|null;box?.focus();}
 async function reportPost(post:Post){if(!selectedCommunity)return;const reason=prompt('Why are you reporting this post?');if(!reason)return;try{await api(`/api/communities/${selectedCommunity.id}/posts/${post.id}/report`,{method:'POST',body:JSON.stringify({reason})});notice='Report submitted to community moderators.';}catch(e){notice=e instanceof Error?e.message:'Could not report post.';}}
 async function removePost(post:Post){if(!selectedCommunity||!confirm('Remove this post?'))return;try{await api(`/api/communities/${selectedCommunity.id}/posts/${post.id}`,{method:'DELETE'});await loadPosts();notice='Post removed.';}catch(e){notice=e instanceof Error?e.message:'Could not remove post.';}}
 async function joinCommunity(){if(!selectedCommunity)return;try{await api(`/api/communities/${selectedCommunity.id}`,{method:'POST'});await refreshCommunities();notice='Joined community.';}catch(e){notice=e instanceof Error?e.message:'Could not join community.';}}
 async function leaveCommunity(){if(!selectedCommunity||!confirm('Leave this community?'))return;try{await api(`/api/communities/${selectedCommunity.id}`,{method:'DELETE'});await refreshCommunities();notice='Left community.';}catch(e){notice=e instanceof Error?e.message:'Could not leave community.';}}
</script>

<svelte:head>
	<title>Communities · TECSPA</title>
	<meta name="description" content="A community space designed with plural systems in mind." />
</svelte:head>

<div class="communities-page">
	<aside class="community-rail">
		<a class="back-link" href="/">← TECSPA</a>
		<div class="rail-label">YOUR SPACES</div>
		{#each communities as community}
			<button class:active={selectedCommunityId === community.id} class="community-icon" title={community.name} onclick={() => selectCommunity(community.id)}>{community.name.slice(0, 1).toUpperCase()}</button>
		{/each}
		<button class="community-icon add" title="Create community" onclick={() => showCreateCommunity = !showCreateCommunity}>+</button>
	</aside>

	<aside class="community-sidebar">
		<div class="community-heading">
			<div class="eyebrow">TECSPA COMMUNITIES</div>
			<h1>{selectedCommunity?.name ?? 'Your communities'}</h1>
			<p>{selectedCommunity?.description ?? 'Create a space for your interests, meet other systems, and choose how you participate.'}</p>
			{#if selectedCommunity}<span class="visibility">{selectedCommunity.visibility === 'Private' ? '🔒 Private space' : '◉ Public community'} · {selectedCommunity.memberCount ?? 0} members</span>{#if selectedCommunity.role === 'visitor'}<button class="sidebar-action" onclick={joinCommunity}>＋ Join community</button>{:else if selectedCommunity.role !== 'owner'}<button class="sidebar-action" onclick={leaveCommunity}>Leave community</button>{/if}{/if}
		</div>
		{#if showCreateCommunity}
			<form class="create-form" onsubmit={(event) => { event.preventDefault(); createCommunity(); }}>
				<label>Community name<input bind:value={communityName} maxlength="60" required placeholder="e.g. Cozy Corner" /></label>
				<label>Description<textarea bind:value={communityDescription} maxlength="240" placeholder="What's this space for?" /></label>
				<label>Visibility<select bind:value={communityVisibility}><option>Public</option><option>Private</option></select></label>
				<div class="form-actions"><button type="button" class="quiet" onclick={() => showCreateCommunity = false}>Cancel</button><button type="submit" class="primary">Create</button></div>
			</form>
		{:else}
			<button class="sidebar-action" onclick={() => showCreateCommunity = true}>＋ Create a community</button>
		{/if}
		{#if selectedCommunity}<div class="channels-title"><span>CHANNELS</span><button title="Create channel" onclick={() => showCreateChannel = !showCreateChannel}>＋</button></div>{/if}
		{#if showCreateChannel && selectedCommunity}
			<form class="inline-create" onsubmit={(event) => { event.preventDefault(); createChannel(); }}><input bind:value={channelName} maxlength="40" placeholder="new-channel" required /><button class="primary" type="submit">Add</button></form>
		{/if}
		{#if selectedCommunity}<nav class="channel-list" aria-label="Channels">
			{#each selectedCommunity?.channels ?? [] as channel}
				<button class:active={selectedChannelId === channel.id} class="channel-link" onclick={() => { selectedChannelId = channel.id; loadPosts(selectedCommunityId, channel.id).catch((e) => { notice = e instanceof Error ? e.message : 'Could not load channel messages.'; }); }}><span>#</span>{channel.name}</button>
			{/each}
		</nav>{:else}<div class="no-communities"><span>✦</span><p>You haven't created a community yet.</p><button class="primary" onclick={() => showCreateCommunity = true}>Create your first community</button></div>{/if}
		<div class="sidebar-foot"><span class="status-dot"></span> Early community preview</div>
	</aside>

	<main class="community-main">
		<header class="channel-header"><div><div class="eyebrow">{selectedCommunity?.name ?? 'WELCOME'}</div><h2>{#if selectedChannel}<span>#</span> {selectedChannel.name}{:else}Communities{/if}</h2></div><div class="header-note">A space to connect, at your own pace ✦</div></header>
		<div class="notice"><span>ⓘ</span><p>{notice}</p></div>
		<section class="feed" aria-label="Channel posts">
			{#if !selectedCommunity}<div class="empty-state welcome-state"><div class="empty-symbol">✦</div><h3>Your community space starts here</h3><p>Create a community from the left sidebar to add channels and start conversations.</p><button class="primary" onclick={() => showCreateCommunity = true}>＋ Create a community</button></div>
			{:else if (selectedChannel?.posts.length ?? 0) === 0}
				<div class="empty-state"><div class="empty-symbol">✧</div><h3>A little quiet in here</h3><p>Start the conversation whenever you're ready.</p></div>
			{:else}
				{#each selectedChannel?.posts ?? [] as post}
					<article class="post"><div class="post-avatar">{post.author.slice(0, 1).toUpperCase()}</div><div class="post-body"><div class="post-meta"><strong>{post.author}</strong><span>{post.createdAt}</span></div><p>{post.text}</p><div class="post-actions"><button title="React with a heart" onclick={() => react(post)}>♡ React ({post.reactionCount ?? 0})</button><button title="Reply" onclick={() => reply(post)}>↩ Reply</button><button title="Report post" onclick={() => reportPost(post)}>⚑ Report</button>{#if selectedCommunity?.role === 'owner' || selectedCommunity?.role === 'moderator' || post.memberId === selectedMemberId}<button title="Remove post" onclick={() => removePost(post)}>Remove</button>{/if}</div></div></article>
				{/each}
			{/if}
		</section>
		{#if selectedCommunity && selectedChannel}<form class="composer" onsubmit={(event) => { event.preventDefault(); submitPost(); }}>
			<div class="posting-as"><span>POSTING AS</span><select bind:value={selectedMemberId} aria-label="Choose member identity"><option value="system">System</option>{#each members as member}<option value={member.id}>{member.name}</option>{/each}</select><span class="privacy-note">Only this display name is shown publicly; private system fields are not shared.</span></div>{#if replyToPostId}<div class="replying-to">Replying to a post · <button type="button" class="quiet" onclick={() => replyToPostId = ''}>Cancel reply</button></div>{/if}
			<textarea bind:value={postText} maxlength="4000" placeholder={`Message #${selectedChannel?.name ?? 'general'}…`} aria-label="Write a post"></textarea>
			<div class="composer-footer"><span>{postText.length}/4000 · Be kind to each other.</span><button type="submit" class="primary" disabled={!postText.trim() || busy}>{replyToPostId ? 'Send reply ↗' : 'Post message ↗'}</button></div>
		</form>{/if}
	</main>
</div>

<style>
	:global(body) { margin: 0; }
	.communities-page { --c-bg: var(--tecspa-background, #101019); --c-panel: var(--tecspa-surface, #181824); --c-panel-2: var(--tecspa-surface-alt, #202032); --c-text: var(--tecspa-text, #eeeaf7); --c-muted: var(--tecspa-text-muted, #a5a0b8); --c-accent: var(--tecspa-accent, #b6a0ff); --c-border: var(--tecspa-border, color-mix(in srgb, var(--c-accent) 24%, transparent)); min-height: 100vh; display: grid; grid-template-columns: 76px 270px minmax(0, 1fr); background: var(--c-bg); color: var(--c-text); font-family: var(--tecspa-body-font, system-ui, sans-serif); }
	button, input, textarea, select { font: inherit; } button { cursor: pointer; }
	.community-rail { background: color-mix(in srgb, var(--c-panel) 92%, transparent); border-right: 1px solid var(--c-border); display: flex; align-items: center; flex-direction: column; gap: 12px; padding: 18px 10px; }
	.back-link { color: var(--c-muted); font-size: 11px; text-decoration: none; margin-bottom: 12px; writing-mode: vertical-rl; transform: rotate(180deg); }
	.rail-label, .eyebrow { color: var(--c-muted); font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
	.community-icon { width: 46px; height: 46px; border: 1px solid #ffffff12; border-radius: 15px; background: var(--c-panel-2); color: var(--c-text); font-weight: 800; transition: .15s ease; }
	.community-icon:hover, .community-icon.active { border-color: var(--c-accent); border-radius: 12px; box-shadow: 0 0 0 2px color-mix(in srgb, var(--c-accent) 20%, transparent); }
	.community-icon.add { color: var(--c-accent); font-size: 25px; }
	.community-sidebar { border-right: 1px solid var(--c-border); background: var(--c-panel); padding: 26px 18px 16px; display: flex; flex-direction: column; min-height: calc(100vh - 42px); }
	.community-heading h1 { font-size: 21px; margin: 10px 0 8px; overflow-wrap: anywhere; }.community-heading p { font-size: 12px; line-height: 1.6; color: var(--c-muted); margin: 0 0 12px; }.visibility { color: var(--c-muted); font-size: 11px; }
	.sidebar-action { width: 100%; margin: 24px 0; border: 1px dashed var(--c-border); border-radius: 10px; background: transparent; color: var(--c-text); padding: 11px; text-align: left; font-size: 12px; }
	.channels-title { display: flex; align-items: center; justify-content: space-between; margin: 16px 0 8px; color: var(--c-muted); font-size: 10px; font-weight: 800; letter-spacing: .13em; }.channels-title button { color: var(--c-muted); border: 0; background: transparent; font-size: 18px; }
	.channel-list { display: grid; gap: 4px; }.channel-link { border: 0; border-radius: 8px; padding: 10px; text-align: left; background: transparent; color: var(--c-muted); font-size: 13px; }.channel-link span { color: var(--c-accent); margin-right: 9px; font-weight: 800; }.channel-link:hover, .channel-link.active { background: var(--c-panel-2); color: var(--c-text); }
	.no-communities { display: grid; gap: 10px; margin-top: 18px; padding: 14px 10px; border: 1px dashed var(--c-border); border-radius: var(--tecspa-panel-radius, 12px); color: var(--c-muted); font-size: 12px; line-height: 1.5; }.no-communities > span { color: var(--c-accent); font-size: 24px; }.no-communities p { margin: 0; }.no-communities .primary { white-space: normal; }
	.sidebar-foot { margin-top: auto; padding-top: 24px; font-size: 10px; color: var(--c-muted); display: flex; align-items: center; gap: 7px; }.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #8ecba8; }
	.community-main { min-width: 0; display: flex; flex-direction: column; min-height: 100vh; }.channel-header { min-height: 74px; border-bottom: 1px solid var(--c-border); padding: 18px 28px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }.channel-header h2 { margin: 5px 0 0; font-size: 18px; }.channel-header h2 span { color: var(--c-accent); }.header-note { color: var(--c-muted); font-size: 12px; }
	.notice { display: flex; gap: 10px; margin: 20px 28px 0; padding: 11px 13px; border: 1px solid var(--c-border); border-radius: 10px; color: var(--c-muted); font-size: 11px; line-height: 1.5; }.notice span { color: var(--c-accent); }.notice p { margin: 0; }
	.feed { flex: 1; padding: 22px 28px; }.post { display: flex; gap: 13px; padding: 17px 0; border-bottom: 1px solid var(--c-border); }.post-avatar { flex: 0 0 38px; height: 38px; display: grid; place-items: center; border-radius: 13px; background: color-mix(in srgb, var(--c-accent) 22%, var(--c-panel-2)); color: var(--c-accent); font-weight: 800; }.post-body { min-width: 0; flex: 1; }.post-meta { display: flex; align-items: baseline; gap: 10px; }.post-meta strong { font-size: 13px; }.post-meta span { font-size: 10px; color: var(--c-muted); }.post-body p { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; line-height: 1.65; margin: 8px 0 10px; }.post-actions { display: flex; gap: 13px; }.post-actions button { border: 0; background: transparent; color: var(--c-muted); font-size: 10px; padding: 0; }
	.empty-state { text-align: center; padding: 70px 20px; color: var(--c-muted); }.empty-symbol { font-size: 42px; color: var(--c-accent); }.empty-state h3 { color: var(--c-text); margin-bottom: 7px; }.empty-state p { font-size: 12px; }
	.composer { margin: auto 28px 26px; padding: 15px; border: 1px solid var(--c-border); border-radius: 14px; background: var(--c-panel); }.posting-as { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }.posting-as > span:first-child { color: var(--c-muted); font-size: 9px; font-weight: 800; letter-spacing: .12em; }.posting-as select { max-width: 190px; border: 1px solid var(--c-border); border-radius: 7px; padding: 5px 8px; background: var(--c-panel-2); color: var(--c-text); font-size: 11px; }.privacy-note { color: var(--c-muted); font-size: 10px; }.composer textarea { display: block; resize: vertical; min-height: 70px; max-height: 220px; width: 100%; box-sizing: border-box; border: 0; outline: 0; color: var(--c-text); background: transparent; font-size: 13px; line-height: 1.6; }.composer-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 12px; border-top: 1px solid #ffffff10; color: var(--c-muted); font-size: 10px; }
	.replying-to { color: var(--c-muted); font-size: 11px; margin-bottom: 8px; }.primary { border: 0; border-radius: 8px; padding: 9px 13px; background: var(--c-accent); color: #171321; font-weight: 800; font-size: 11px; }.primary:disabled { opacity: .45; cursor: not-allowed; }.quiet { border: 1px solid var(--c-border); border-radius: 8px; padding: 8px 10px; background: transparent; color: var(--c-text); font-size: 11px; }
	.create-form { display: grid; gap: 10px; margin: 15px 0; }.create-form label { display: grid; gap: 5px; color: var(--c-muted); font-size: 10px; }.create-form input, .create-form textarea, .create-form select, .inline-create input { width: 100%; box-sizing: border-box; background: var(--c-panel-2); border: 1px solid var(--c-border); border-radius: 7px; padding: 8px; color: var(--c-text); font-size: 11px; }.create-form textarea { resize: vertical; min-height: 56px; }.form-actions { display: flex; justify-content: flex-end; gap: 7px; }.inline-create { display: flex; gap: 5px; margin-bottom: 10px; }.inline-create input { min-width: 0; }
	@media (max-width: 850px) { .communities-page { grid-template-columns: 58px 210px minmax(0, 1fr); }.community-rail { padding-inline: 6px; }.community-sidebar { padding: 20px 12px; }.channel-header { padding: 16px; }.notice { margin: 14px 16px 0; }.feed { padding: 16px; }.composer { margin: auto 16px 16px; }.header-note { display: none; } }
	@media (max-width: 620px) { .communities-page { grid-template-columns: 52px minmax(0, 1fr); }.community-sidebar { grid-column: 2; grid-row: 1; min-height: auto; border-right: 0; border-bottom: 1px solid var(--c-border); padding: 14px; }.community-heading h1 { font-size: 17px; }.community-heading p { margin-bottom: 6px; }.sidebar-action { margin: 12px 0; }.channels-title { margin-top: 8px; }.channel-list { display: flex; overflow-x: auto; }.channel-link { white-space: nowrap; }.sidebar-foot { display: none; }.community-main { grid-column: 2; min-height: 65vh; }.community-rail { grid-column: 1; grid-row: 1 / span 2; }.back-link { font-size: 9px; }.community-icon { width: 38px; height: 38px; border-radius: 12px; }.channel-header { min-height: 58px; }.composer-footer { align-items: flex-end; }.composer-footer span { max-width: 55%; line-height: 1.4; } }
</style>
