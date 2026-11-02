import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthenticatedSystem } from '$lib/server/system';
import { pool } from '$lib/server/db/postgres';

function validPublicKey(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const key = value as Record<string, unknown>;
  return key.kty === 'EC' && key.crv === 'P-256' &&
    typeof key.x === 'string' && key.x.length > 0 && key.x.length <= 128 &&
    typeof key.y === 'string' && key.y.length > 0 && key.y.length <= 128 &&
    key.ext === true && !('d' in key) && !('key_ops' in key);
}

export const GET: RequestHandler = async ({ cookies, url }) => {
  const { account } = await getAuthenticatedSystem(cookies);
  const requested = url.searchParams.get('accountId');
  if (requested && requested !== account.id) {
    const shareId = url.searchParams.get('shareId');
    if (!shareId) return json({ error: 'A share ID is required to look up another account identity.' }, { status: 400 });
    const share = await pool.query<{ owner_id: string; recipient_id: string }>(
      `SELECT s.owner_account_id AS owner_id, ss.recipient_account_id AS recipient_id
       FROM system_shares ss JOIN systems s ON s.id = ss.system_id
       WHERE ss.id = $1 AND (ss.recipient_account_id = $2 OR s.owner_account_id = $2)
         AND ss.status IN ('pending','accepted') LIMIT 1`,
      [shareId, account.id]
    );
    if (!share.rows.length || (requested !== share.rows[0].owner_id && requested !== share.rows[0].recipient_id)) {
      return json({ error: 'Sharing invitation not found.' }, { status: 404 });
    }
  }
  const accountId = requested || account.id;
  const result = await pool.query(
    `SELECT public_key, key_version FROM account_crypto_identities WHERE account_id = $1 LIMIT 1`,
    [accountId]
  );
  if (!result.rows.length) return json({ initialized: false });
  return json({ initialized: true, publicKey: result.rows[0].public_key, keyVersion: result.rows[0].key_version });
};

export const POST: RequestHandler = async ({ cookies, request }) => {
  const { account } = await getAuthenticatedSystem(cookies);
  const body = await request.json().catch(() => null);
  if (!body || !validPublicKey(body.publicKey)) return json({ error: 'A valid P-256 ECDH public JWK is required.' }, { status: 400 });
  const result = await pool.query(
    `INSERT INTO account_crypto_identities (account_id, public_key) VALUES ($1, $2::jsonb)
     ON CONFLICT (account_id) DO NOTHING RETURNING account_id`,
    [account.id, JSON.stringify(body.publicKey)]
  );
  if (!result.rowCount) return json({ error: 'An identity key already exists. Key rotation requires a dedicated recovery flow.' }, { status: 409 });
  return json({ saved: true });
};
