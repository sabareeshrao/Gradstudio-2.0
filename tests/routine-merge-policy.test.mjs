import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('routine content merging uses trusted default-branch code and dispatches staging only', async () => {
  const workflow = await readFile(new URL('../.github/workflows/routine-content-auto-merge.yml', import.meta.url), 'utf8');
  const script = await readFile(new URL('../scripts/merge-routine-content-pr.mjs', import.meta.url), 'utf8');
  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /ref: main/);
  assert.doesNotMatch(workflow, /pull_request_target/);
  assert.match(script, /routineContentDiff/);
  assert.match(script, /categories\|courses\|sections\|simulations\|shared/);
  assert.match(script, /content-appearance\.yml/);
  assert.match(script, /content-staging\.yml\/dispatches/);
  assert.doesNotMatch(script, /production/i);
});
