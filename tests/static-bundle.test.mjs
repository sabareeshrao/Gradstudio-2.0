import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { formatImpactSummary } from '../scripts/lib/impact-summary.mjs';
import { buildStaticBundle } from '../scripts/lib/static-bundle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, 'tests', 'fixtures', 'valid', 'content');
const commit = '2222222222222222222222222222222222222222';

function temp(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `gradstudio-${name}-`));
}

function build(outputRoot, options = {}) {
  return buildStaticBundle({
    repositoryRoot: root,
    contentRoot: options.contentRoot || fixture,
    outputRoot,
    sourceCommit: options.sourceCommit || commit,
    contentBaseUrl: 'https://content.staging.example',
    previousBundleRoot: options.previousBundleRoot || null
  });
}

test('static bundle publishes the active and immutable catalogs with declared assets', () => {
  const output = path.join(temp('bundle'), 'dist-static');
  const result = build(output);
  try {
    const release = result.deploymentManifest.active_release_id;
    const active = fs.readFileSync(path.join(output, 'catalog', 'v1', 'active.json'));
    const immutable = fs.readFileSync(path.join(output, 'releases', release, 'catalog.json'));
    assert.deepEqual(active, immutable);
    assert.ok(fs.existsSync(path.join(output, 'releases', release, 'content', 'simulations', 'sim-alpha', 'index.html')));
    assert.ok(fs.existsSync(path.join(output, 'releases', release, 'content', 'shared', 'asset-synthetic-theme', 'tokens.css')));
    assert.ok(fs.existsSync(path.join(output, 'schemas', 'catalog-v1.json')));
    assert.equal(result.deploymentManifest.source.commit, commit);
    assert.equal(result.deploymentManifest.file_count, result.deploymentManifest.files.length + 1);
    assert.equal(result.deploymentManifest.public_asset_count, 6);
    assert.equal(fs.existsSync(path.join(output, '.compiler')), false);
  } finally {
    fs.rmSync(path.dirname(output), { recursive: true, force: true });
  }
});

test('draft simulation assets are excluded while private deployment evidence retains source identity', () => {
  const space = temp('draft');
  const content = path.join(space, 'content');
  const output = path.join(space, 'dist-static');
  fs.cpSync(fixture, content, { recursive: true });
  const manifestPath = path.join(content, 'simulations', 'sim-beta', 'simulation.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.status = 'draft';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  try {
    const result = build(output, { contentRoot: content });
    assert.equal(result.catalog.simulations.some(item => item.id === 'sim-beta'), false);
    assert.equal(fs.existsSync(path.join(output, 'releases', result.catalog.release_id, 'content', 'simulations', 'sim-beta')), false);
    const sourceEvidence = JSON.parse(fs.readFileSync(path.join(output, 'deployment-evidence', 'source-index.json'), 'utf8'));
    assert.equal(sourceEvidence.source_index.some(item => item.id === 'sim-beta' && item.status === 'draft'), true);
  } finally {
    fs.rmSync(space, { recursive: true, force: true });
  }
});

test('bundle retains prior immutable releases and can reactivate an exact known-good release', () => {
  const space = temp('retention');
  const first = path.join(space, 'dist-first');
  const second = path.join(space, 'dist-second');
  const rolledBack = path.join(space, 'dist-rolled-back');
  const firstResult = build(first);
  const secondResult = build(second, {
    sourceCommit: '3333333333333333333333333333333333333333',
    previousBundleRoot: first
  });
  try {
    assert.deepEqual(secondResult.deploymentManifest.retained_release_ids, [firstResult.catalog.release_id]);
    assert.ok(fs.existsSync(path.join(second, 'releases', firstResult.catalog.release_id, 'catalog.json')));

    const rollbackResult = build(rolledBack, {
      sourceCommit: commit,
      previousBundleRoot: second
    });
    assert.equal(rollbackResult.deploymentManifest.active_release_id, firstResult.catalog.release_id);
    assert.deepEqual(rollbackResult.deploymentManifest.retained_release_ids, [secondResult.catalog.release_id]);
    assert.deepEqual(
      fs.readFileSync(path.join(rolledBack, 'catalog', 'v1', 'active.json')),
      fs.readFileSync(path.join(first, 'catalog', 'v1', 'active.json'))
    );
    assert.deepEqual(
      fs.readFileSync(path.join(rolledBack, 'releases', firstResult.catalog.release_id, 'catalog.json')),
      fs.readFileSync(path.join(first, 'releases', firstResult.catalog.release_id, 'catalog.json'))
    );
    assert.ok(fs.existsSync(path.join(rolledBack, 'releases', secondResult.catalog.release_id, 'catalog.json')));
  } finally {
    fs.rmSync(space, { recursive: true, force: true });
  }
});

test('deployment evidence reports human-readable changes by stable ID', () => {
  const space = temp('impact');
  const content = path.join(space, 'content');
  const first = path.join(space, 'dist-first');
  const second = path.join(space, 'dist-second');
  fs.cpSync(fixture, content, { recursive: true });
  const firstResult = build(first, { contentRoot: content });
  const manifestPath = path.join(content, 'simulations', 'sim-alpha', 'simulation.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.title = 'Renamed synthetic simulation';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  try {
    const secondResult = build(second, {
      contentRoot: content,
      sourceCommit: '3333333333333333333333333333333333333333',
      previousBundleRoot: first
    });
    const firstIndex = JSON.parse(fs.readFileSync(path.join(first, 'deployment-evidence', 'source-index.json'), 'utf8'));
    const secondImpact = JSON.parse(fs.readFileSync(path.join(second, 'deployment-evidence', 'change-impact.json'), 'utf8'));
    assert.equal(firstIndex.source_index.some(record => record.id === 'sim-alpha'), true);
    assert.deepEqual(secondImpact.change_impact.renamed, ['sim-alpha']);
    const summary = formatImpactSummary(secondResult.deploymentManifest, secondImpact);
    assert.match(summary, /\| renamed \| 1 \| `sim-alpha` \|/);
    assert.match(summary, /1 stable-ID operation\(s\) detected\./);
  } finally {
    fs.rmSync(space, { recursive: true, force: true });
  }
});

test('two static bundle builds are byte-identical', () => {
  const space = temp('reproducible');
  const first = path.join(space, 'dist-a');
  const second = path.join(space, 'dist-b');
  try {
    build(first);
    build(second);
    function allFiles(directory, base = directory) {
      const output = [];
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) output.push(...allFiles(full, base));
        else output.push(path.relative(base, full));
      }
      return output;
    }
    const files = allFiles(first).sort();
    assert.deepEqual(files, allFiles(second).sort());
    for (const relative of files) assert.deepEqual(fs.readFileSync(path.join(first, relative)), fs.readFileSync(path.join(second, relative)), relative);
  } finally {
    fs.rmSync(space, { recursive: true, force: true });
  }
});

test('bundle builder refuses to replace an arbitrary output directory', () => {
  const unsafe = path.join(root, 'unsafe-output');
  assert.throws(() => build(unsafe), /unsafe output directory/);
});
