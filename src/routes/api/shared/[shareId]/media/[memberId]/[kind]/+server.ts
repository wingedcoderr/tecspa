import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getIncomingShare } from '$lib/server/sharing';
import { pool } from '$lib/server/db/postgres';
import { MEMBER_MEDIA_BUCKET, s3 } from '$lib/server/storage/s3';

export const GET: RequestHandler = async ({ cookies, params }) => {
  const share = await getIncomingShare(cookies, params.shareId);
  if (share.status !== 'accepted' || (!share.permissions.viewMembers && !share.permissions.viewFronting)) {
    throw error(403, 'Member media has not been shared.');
  }
  if (params.kind !== 'avatar' && params.kind !== 'banner') throw error(400, 'Invalid member media type.');

  const result = await pool.query<{ key: string | null; is_fronting: boolean }>(
    `SELECT ${params.kind} AS key, is_fronting FROM members WHERE id = $1 AND system_id = $2 LIMIT 1`,
    [params.memberId, share.systemId]
  );
  const row = result.rows[0];
  const canSeeMedia =
    params.kind === 'avatar'
      ? share.permissions.viewMembers ||
        (share.permissions.viewFronting && row?.is_fronting === true)
      : share.permissions.viewMembers;
  const key = canSeeMedia ? row?.key : null;
  if (!key) throw error(404, 'Member media was not found.');

  const object = await s3.send(new GetObjectCommand({ Bucket: MEMBER_MEDIA_BUCKET, Key: key }));
  if (!object.Body) throw error(404, 'Member media was not found.');
  const bytes = await object.Body.transformToByteArray();

  return new Response(bytes as unknown as BodyInit, {
    headers: {
      'Content-Type': object.ContentType ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=300'
    }
  });
};
