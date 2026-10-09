BEGIN;
CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  owner_system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  visibility TEXT NOT NULL CHECK (visibility IN ('public','private')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','locked','deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS communities_visibility_created_idx ON communities(visibility, created_at DESC) WHERE status='active';
CREATE TABLE IF NOT EXISTS community_memberships (
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','moderator','member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','banned','left')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, system_id)
);
CREATE INDEX IF NOT EXISTS community_memberships_system_idx ON community_memberships(system_id,status);
CREATE TABLE IF NOT EXISTS community_channels (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 240),
  kind TEXT NOT NULL DEFAULT 'text' CHECK (kind IN ('text','announcement')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (community_id,name)
);
CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL REFERENCES community_channels(id) ON DELETE CASCADE,
  author_system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  author_member_id TEXT,
  author_display_name TEXT NOT NULL CHECK (char_length(author_display_name) BETWEEN 1 AND 80),
  content_mode TEXT NOT NULL CHECK (content_mode IN ('public_plaintext','encrypted')),
  content TEXT NOT NULL CHECK (char_length(content) <= 12000),
  parent_post_id TEXT REFERENCES community_posts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden','removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS community_posts_channel_created_idx ON community_posts(channel_id,created_at DESC) WHERE status='visible';
CREATE TABLE IF NOT EXISTS community_reactions (
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('heart','laugh','support','sparkles','thumbs_up')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id,system_id,reaction)
);
CREATE TABLE IF NOT EXISTS community_reports (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  post_id TEXT REFERENCES community_posts(id) ON DELETE SET NULL,
  reporter_system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 1000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMIT;
