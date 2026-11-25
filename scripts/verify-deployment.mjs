import process from 'node:process';

const args = process.argv.slice(2);
function required(name) {
  const index = args.indexOf(name);
  const result = index === -1 ? '' : args[index + 1];
  if (!result || result.startsWith('--')) throw new Error(`${name} is required`);
  return result;
}

const origin = required('--origin').replace(/\/$/, '');
const expectedCommit = required('--source-commit').toLowerCase();
const expectedDigest = required('--bundle-digest').toLowerCase();
const parsed = new URL(origin);
if (parsed.protocol !== 'https:' || parsed.origin !== origin) throw new Error('origin must be an HTTPS origin');
if (!/^[0-9a-f]{40}$/.test(expectedCommit)) throw new Error('source commit must be a 40-character hexadecimal SHA');
if (!/^[0-9a-f]{64}$/.test(expectedDigest)) throw new Error('bundle digest must be a 64-character hexadecimal SHA');

// Cloudflare may briefly serve the preceding version after a successful upload.
// Only the exact expected commit, digest and matching catalog can pass.
for (let attempt = 1; attempt <= 12; attempt += 1) {
  try {
    const healthResponse = await fetch(`${origin}/health/v1`, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' } });
    if (!healthResponse.ok) throw new Error(`health check returned ${healthResponse.status}`);
    const health = await healthResponse.json();
    if (health.status !== 'ok') throw new Error(`health status is ${health.status}`);
    if (health.source_commit !== expectedCommit) throw new Error(`deployed commit ${health.source_commit} does not match ${expectedCommit}`);
    if (health.bundle_digest_sha256 !== expectedDigest) throw new Error('deployed bundle digest does not match the built artifact');

    const catalogResponse = await fetch(`${origin}/catalog/v1/active.json`, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' } });
    if (!catalogResponse.ok) throw new Error(`catalog check returned ${catalogResponse.status}`);
    const catalog = await catalogResponse.json();
    if (catalog.contract !== 'gradstudio-content-catalog/v1') throw new Error(`unexpected catalog contract ${catalog.contract}`);
    if (catalog.source?.commit !== expectedCommit) throw new Error('active catalog source does not match the deployed commit');
    if (catalog.release_id !== health.active_release_id) throw new Error('health and active catalog release IDs differ');

    console.log(`Verified ${health.active_release_id} from ${expectedCommit} at ${origin}.`);
    process.exit(0);
  } catch (error) {
    if (attempt === 12) throw error;
    console.warn(`Verification attempt ${attempt}/12: ${error.message}`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
