import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const validation = fs.readFileSync(path.join(root, '.github', 'workflows', 'content-validation.yml'), 'utf8');
const staging = fs.readFileSync(path.join(root, '.github', 'workflows', 'content-staging.yml'), 'utf8');
const wrangler = fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8');

function assertPinnedActions(workflow) {
  const actions = [...workflow.matchAll(/uses:\s*([^@\s]+)@([^\s#]+)/g)];
  assert.ok(actions.length > 0);
  for (const [, action, revision] of actions) assert.match(revision, /^[0-9a-f]{40}$/, `${action} must use an immutable revision`);
}

test('pull-request validation is read-only, pinned, credential-free, and cannot deploy', () => {
  assert.match(validation, /permissions:\s*\n\s*contents:\s*read/);
  assert.doesNotMatch(validation, /\$\{\{\s*secrets\./);
  assert.doesNotMatch(validation, /wrangler\s+deploy(?![^\n]*--dry-run)/);
  assertPinnedActions(validation);
});

test('staging deployment is trusted-main-only, serialized, disabled by default, and pinned', () => {
  assert.match(staging, /branches:\s*\[main\]/);
  assert.doesNotMatch(staging, /pull_request/);
  assert.match(staging, /environment:\s*staging/);
  assert.match(staging, /if:\s*vars\.CLOUDFLARE_STAGING_ENABLED == 'true'/);
  assert.match(staging, /group:\s*content-staging/);
  assert.match(staging, /cancel-in-progress:\s*false/);
  assert.match(staging, /git rev-parse origin\/main/);
  assert.match(staging, /secrets\.CLOUDFLARE_API_TOKEN/);
  assert.match(staging, /write-impact-summary\.mjs/);
  assert.match(staging, /GITHUB_STEP_SUMMARY/);
  assert.match(staging, /wrangler deploy --env staging/);
  assert.doesNotMatch(staging, /--env production|gradstudio-content-prod|gradstudio\.org/);
  assertPinnedActions(staging);
});

test('Wrangler configuration contains no production environment, route, or data binding', () => {
  const config = JSON.parse(wrangler.replace(/^\s*\/\/.*$/gm, ''));
  assert.deepEqual(Object.keys(config.env).sort(), ['development', 'staging']);
  assert.equal(JSON.stringify(config).includes('production'), false);
  assert.equal(JSON.stringify(config).includes('routes'), false);
  assert.equal(JSON.stringify(config).includes('d1_databases'), false);
  assert.equal(JSON.stringify(config).includes('r2_buckets'), false);
});
