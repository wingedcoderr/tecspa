import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const failures = [];
const legacyRoutes = [
  'src/routes/api/chat/+server.ts',
  'src/routes/api/chat/[id]/+server.ts',
  'src/routes/api/front-history/+server.ts',
  'src/routes/api/front-history/[id]/+server.ts',
  'src/routes/api/front-history/current/+server.ts',
  'src/routes/api/journal/+server.ts',
  'src/routes/api/journal/[id]/+server.ts',
  'src/routes/api/journal/[id]/pin/+server.ts',
  'src/routes/api/import/+server.ts',
  'src/routes/api/import/pluralspace/+server.ts',
  'src/routes/api/import/pluralspace/media/+server.ts',
  'src/routes/api/media/members/[memberID]/[kind]/+server.ts',
  'src/routes/api/members/+server.ts',
  'src/routes/api/members/[id]/+server.ts',
  'src/routes/api/members/[id]/fronting/+server.ts',
  'src/routes/api/shared/[shareId]/+server.ts',
  'src/routes/api/shared/[shareId]/chat/+server.ts',
  'src/routes/api/shared/[shareId]/journal/+server.ts',
  'src/routes/api/shared/[shareId]/media/[memberId]/[kind]/+server.ts'
];
for (const route of legacyRoutes) {
  const content = readFileSync(join(root, route), 'utf8');
  if (!content.includes('status: 410') || !content.includes('legacy plaintext endpoint')) {
    failures.push(`${route} is not fail-closed`);
  }
}
const adapter = readFileSync(join(root, 'src/lib/db/web-adapter.ts'), 'utf8');
for (const marker of ['saveEncryptedRecord', 'listEncryptedRecords', 'loadEncryptedRecord', 'requireUnlocked']) {
  if (!adapter.includes(marker)) failures.push(`Encrypted web adapter is missing ${marker}`);
}
for (const marker of ["fetch('/api/chat'", "fetch('/api/journal'", "fetch('/api/front-history'"]) {
  if (adapter.includes(marker)) failures.push(`Web adapter still calls plaintext API ${marker}`);
}
const vault = readFileSync(join(root, 'src/routes/api/crypto/vault/+server.ts'), 'utf8');
if (!vault.includes('e2ee_vault_records') || !vault.includes('encrypted_payload')) failures.push('Vault API storage check failed');
const keyApi = readFileSync(join(root, 'src/routes/api/crypto/key/+server.ts'), 'utf8');
if (!keyApi.includes('ON CONFLICT (account_id) DO NOTHING') || !keyApi.includes('payload.iterations !== 600_000')) failures.push('Encryption-key initialization is not fail-closed');
if (failures.length) {
  console.error('E2EE source checks FAILED:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`E2EE source checks passed (${legacyRoutes.length} legacy plaintext endpoints fail closed; encrypted web adapter markers verified).`);
console.log('NOTE: These are source guards, not a substitute for build, migration, integration, or independent security tests.');
