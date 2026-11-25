import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildStaticBundle } from '../scripts/lib/static-bundle.mjs';
import { verifyStaticBundle } from '../scripts/lib/verify-static-bundle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, 'tests', 'fixtures', 'valid', 'content');
const commit = '2222222222222222222222222222222222222222';

test('rollback verifier accepts exact evidence and rejects changed bundle bytes', () => {
  const space = fs.mkdtempSync(path.join(os.tmpdir(), 'gradstudio-verify-'));
  const output = path.join(space, 'dist-rollback');
  try {
    const result = buildStaticBundle({
      repositoryRoot: root,
      contentRoot: fixture,
      outputRoot: output,
      sourceCommit: commit,
      contentBaseUrl: 'https://content.staging.example'
    });
    const expected = {
      bundleRoot: output,
      expectedSourceCommit: commit,
      expectedReleaseId: result.deploymentManifest.active_release_id,
      expectedBundleDigest: result.deploymentManifest.bundle_digest_sha256
    };
    assert.equal(verifyStaticBundle(expected).active_release_id, expected.expectedReleaseId);
    fs.appendFileSync(path.join(output, 'catalog', 'v1', 'active.json'), 'changed');
    assert.throws(() => verifyStaticBundle(expected), /bundle files do not match/);
  } finally {
    fs.rmSync(space, { recursive: true, force: true });
  }
});
