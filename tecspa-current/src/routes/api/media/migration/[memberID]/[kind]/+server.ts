import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { pool } from '$lib/server/db/postgres';
import { MEMBER_MEDIA_BUCKET, s3 } from '$lib/server/storage/s3';
import { getAuthenticatedSystem } from '$lib/server/system';

type MediaKind = 'avatar' | 'banner';

function isMediaKind(value: string): value is MediaKind {
  return value === 'avatar' || value === 'banner';
}

function dataUriToBytes(dataUri: string): { bytes: Uint8Array; mimeType: string } {
  const comma = dataUri.indexOf(',');
  if (comma < 0) throw error(404, 'Legacy member image was not found.');
  const header = dataUri.slice(5, comma);
  const mimeType = header.split(';')[0]?.trim() || 'application/octet-stream';
  const body = dataUri.slice(comma + 1);
  if (header.includes(';base64')) {
    return { bytes: new Uint8Array(Buffer.from(body, 'base64')), mimeType };
  }
  return { bytes: new TextEncoder().encode(decodeURIComponent(body)), mimeType };
}

/**
 * Temporary, authenticated migration-only endpoint. It returns the existing
 * image only to the owning system so the browser can encrypt it locally.
 * Normal media reads remain disabled; this endpoint must never be used for
 * ordinary rendering. It intentionally does not mutate or delete old objects.
 */
export const GET: RequestHandler = async ({ params, cookies }) => {
  const { system } = await getAuthenticatedSystem(cookies);
  const { memberID, kind } = params;
  if (!memberID || !kind || !isMediaKind(kind)) throw error(400, 'Invalid migration request.');

  const result = await pool.query<{ avatar: string | null; banner: string | null }>(
    `SELECT avatar, banner FROM members WHERE id = $1 AND system_id = $2 LIMIT 1`,
    [memberID, system.id]
  );
  if (!result.rows.length) throw error(404, 'Legacy member was not found.');
  const storedPath = result.rows[0][kind];
  if (!storedPath) throw error(404, 'This member has no legacy image.');

  let bytes: Uint8Array;
  let mimeType: string;
  if (storedPath.startsWith('data:image/')) {
    ({ bytes, mimeType } = dataUriToBytes(storedPath));
  } else {
    // Accept only the exact expected object-key prefix. Never treat this field
    // as an arbitrary S3 key supplied by the client.
    const expectedPrefix = `members/${memberID}/${kind}.`;
    if (!storedPath.startsWith(expectedPrefix) || storedPath.includes('..')) {
      throw error(404, 'Legacy image reference is not eligible for migration.');
    }
    const object = await s3.send(new GetObjectCommand({ Bucket: MEMBER_MEDIA_BUCKET, Key: storedPath }));
    if (!object.Body) throw error(404, 'Legacy image object was not found.');
    bytes = await object.Body.transformToByteArray();
    mimeType = object.ContentType ?? 'application/octet-stream';
  }

  if (!mimeType.startsWith('image/') || bytes.byteLength === 0 || bytes.byteLength > 1 * 1024 * 1024) {
    throw error(413, 'Legacy image is empty, unsupported, or larger than 1 MB.');
  }
  const body = new Uint8Array(bytes.byteLength);
  body.set(bytes);
  return new Response(body.buffer, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'no-store, private, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'attachment; filename="legacy-member-image"'
    }
  });
};
