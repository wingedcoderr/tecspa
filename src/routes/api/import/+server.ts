import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Fail closed: this legacy endpoint accepts or returns plaintext private data.
// Private web content must use /api/crypto/vault with client-side encryption.
const disabled: RequestHandler = async () => json(
  { error: 'This legacy plaintext endpoint is disabled. Use encrypted TECSPA storage.' },
  { status: 410 }
);

export const GET = disabled;
export const POST = disabled;
export const PUT = disabled;
export const PATCH = disabled;
export const DELETE = disabled;
