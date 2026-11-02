import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getShareForOwner, requireAcceptedIncomingShare } from '$lib/server/sharing';
import { pool } from '$lib/server/db/postgres';

const CATEGORIES = new Set(['members', 'fronting', 'front-history', 'chat', 'journal', 'polls']);
function validEnvelope(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return v.version === 1 && v.algorithm === 'AES-GCM' &&
    typeof v.iv === 'string' && v.iv.length <= 128 &&
    typeof v.ciphertext === 'string' && v.ciphertext.length > 0 && v.ciphertext.length <= 200_000 &&
    typeof v.ephemeralPublicKey === 'object' && v.ephemeralPublicKey !== null;
}

// Recipient reads only their own accepted share's envelopes.
export const GET: RequestHandler = async ({ cookies, params }) => {
  const share = await requireAcceptedIncomingShare(cookies, params.shareId);
  const allowed = new Set<string>();
  const p = share.permissions;
  if (p.viewMembers) allowed.add('members');
  if (p.viewFronting) allowed.add('fronting');
  if (p.viewFrontHistory) allowed.add('front-history');
  if (p.viewChat) allowed.add('chat');
  if (p.viewJournal) allowed.add('journal');
  if (p.viewPolls) allowed.add('polls');
  const result = await pool.query(
    `SELECT category, envelope, updated_at FROM share_key_envelopes WHERE share_id = $1 AND category = ANY($2::text[]) ORDER BY category`,
    [share.id, [...allowed]]
  );
  return json({ envelopes: result.rows });
};

// The system owner uploads envelopes encrypted specifically for the invitee.
export const PUT: RequestHandler = async ({ cookies, params, request }) => {
  const share = await getShareForOwner(cookies, params.shareId);
  if (share.status === 'revoked') return json({ error: 'This invitation has been revoked.' }, { status: 409 });
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.envelopes) || body.envelopes.length > 6) {
    return json({ error: 'A list of up to six encrypted key envelopes is required.' }, { status: 400 });
  }
  const seen = new Set<string>();
  for (const item of body.envelopes) {
    if (!item || typeof item !== 'object' || !CATEGORIES.has(item.category) || !validEnvelope(item.envelope) || seen.has(item.category)) {
      return json({ error: 'One or more key envelopes are invalid.' }, { status: 400 });
    }
    seen.add(item.category);
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of body.envelopes) {
      await client.query(
        `INSERT INTO share_key_envelopes (share_id, category, envelope) VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (share_id, category) DO UPDATE SET envelope = EXCLUDED.envelope, updated_at = NOW()`,
        [share.id, item.category, JSON.stringify(item.envelope)]
      );
    }
    await client.query('COMMIT');
  } catch (cause) {
    await client.query('ROLLBACK');
    throw cause;
  } finally {
    client.release();
  }
  return json({ saved: true, categories: [...seen] });
};
