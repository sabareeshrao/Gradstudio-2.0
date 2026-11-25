import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { buildStaticBundle } from './lib/static-bundle.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
function value(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`${name} requires a value`);
  return args[index + 1];
}

const sourceCommit = value('--source-commit', process.env.GITHUB_SHA || '');
const contentBaseUrl = value('--content-base-url', process.env.CONTENT_PUBLIC_ORIGIN || 'https://content.invalid');
const parsedOrigin = new URL(contentBaseUrl);
if (parsedOrigin.protocol !== 'https:' || parsedOrigin.origin !== contentBaseUrl.replace(/\/$/, '')) {
  throw new Error('--content-base-url must be an HTTPS origin without a path');
}

const result = buildStaticBundle({
  repositoryRoot,
  contentRoot: path.resolve(repositoryRoot, value('--content', 'content')),
  outputRoot: path.resolve(repositoryRoot, value('--output', 'dist-static')),
  sourceCommit,
  contentBaseUrl: parsedOrigin.origin,
  previousBundleRoot: value('--retain-from', null) ? path.resolve(repositoryRoot, value('--retain-from')) : null
});

console.log(JSON.stringify({
  release_id: result.deploymentManifest.active_release_id,
  retained_release_ids: result.deploymentManifest.retained_release_ids,
  simulations: result.catalog.simulations.length,
  files: result.deploymentManifest.file_count,
  bytes: result.deploymentManifest.total_bytes,
  digest: result.deploymentManifest.bundle_digest_sha256
}, null, 2));
