import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthenticatedSystem } from '$lib/server/system';
import { pool } from '$lib/server/db/postgres';

const VALID_TYPES = new Set([
  'member', 'journal', 'chat-message', 'front-history', 'poll', 'custom'
]);
const MAX_PAYLOAD_BYTES = 2_000_000;

function validPayload(value: unknown): value is {
  version: 1; algorithm: 'AES-GCM'; iv: string; ciphertext: string;
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return item.version === 1 && item.algorithm === 'AES-GCM' &&
    typeof item.iv === 'string' && item.iv.length <= 128 &&
    typeof item.ciphertext === 'string' && item.ciphertext.length > 0 &&
    item.ciphertext.length <= MAX_PAYLOAD_BYTES * 2;
}

export const GET: RequestHandler = async ({ cookies, url }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const recordType = url.searchParams.get('type');
  const recordId = url.searchParams.get('id');
  if (!recordType || !VALID_TYPES.has(recordType)) {
    return json({ error: 'A supported record type is required.' }, { status: 400 });
  }
  if (recordId) {
    const result = await pool.query(
      `SELECT encrypted_payload FROM e2ee_vault_records
       WHERE system_id = $1 AND record_type = $2 AND record_id = $3 LIMIT 1`,
      [system.id, recordType, recordId]
    );
    if (!result.rows.length) return json({ record: null });
    return json({ record: result.rows[0].encrypted_payload });
  }
  const result = await pool.query(
    `SELECT record_id, encrypted_payload, updated_at FROM e2ee_vault_records
     WHERE system_id = $1 AND record_type = $2 ORDER BY updated_at DESC`,
    [system.id, recordType]
  );
  return json({ records: result.rows });
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'A JSON record is required.' }, { status: 400 });
  }
  const data = body as Record<string, unknown>;
  const recordType = data.recordType;
  const recordId = data.recordId;
  const payload = data.payload;
  if (typeof recordType !== 'string' || !VALID_TYPES.has(recordType)) {
    return json({ error: 'A supported record type is required.' }, { status: 400 });
  }
  if (typeof recordId !== 'string' || recordId.length < 1 || recordId.length > 256) {
    return json({ error: 'A valid record ID is required.' }, { status: 400 });
  }
  if (!validPayload(payload)) {
    return json({ error: 'A valid encrypted payload is required.' }, { status: 400 });
  }
  const serialized = JSON.stringify(payload);
  if (new TextEncoder().encode(serialized).byteLength > MAX_PAYLOAD_BYTES) {
    return json({ error: 'Encrypted payload is too large.' }, { status: 413 });
  }
  await pool.query(
    `INSERT INTO e2ee_vault_records (system_id, record_type, record_id, encrypted_payload)
     VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (system_id, record_type, record_id)
     DO UPDATE SET encrypted_payload = EXCLUDED.encrypted_payload, updated_at = NOW()`,
    [system.id, recordType, recordId, serialized]
  );
  return json({ saved: true });
};

export const DELETE: RequestHandler = async ({ cookies, url }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const recordType = url.searchParams.get('type');
  const recordId = url.searchParams.get('id');
  if (!recordType || !VALID_TYPES.has(recordType) || !recordId) {
    return json({ error: 'A valid record type and ID are required.' }, { status: 400 });
  }
  await pool.query(
    `DELETE FROM e2ee_vault_records WHERE system_id = $1 AND record_type = $2 AND record_id = $3`,
    [system.id, recordType, recordId]
  );
  return json({ deleted: true });
};
