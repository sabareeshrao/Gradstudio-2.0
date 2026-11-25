import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileContent } from '../scripts/lib/compiler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, 'tests', 'fixtures', 'valid', 'content');
const sha = '1111111111111111111111111111111111111111';

function workspace() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gradstudio-content-test-'));
  const content = path.join(directory, 'content');
  fs.cpSync(fixture, content, { recursive: true });
  return { directory, content, output: path.join(directory, 'dist') };
}

function manifest(space, kind, id) {
  const plural = { category: 'categories', course: 'courses', section: 'sections', simulation: 'simulations' }[kind];
  return path.join(space.content, plural, id, `${kind}.json`);
}

function mutateJson(file, mutate) {
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  mutate(value);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function compile(space, previousReleaseManifest = null) {
  return compileContent({ repositoryRoot: root, contentRoot: space.content, outputRoot: space.output, sourceCommit: sha, previousReleaseManifest });
}

test('valid synthetic content compiles with immutable provenance and no legacy content', () => {
  const space = workspace();
  try {
    const result = compile(space);
    assert.equal(result.catalog.contract, 'gradstudio-content-catalog/v1');
    assert.equal(result.catalog.source.commit, sha);
    assert.deepEqual(result.catalog.simulations.map(item => item.id), ['sim-alpha', 'sim-beta']);
    assert.ok(result.catalog.simulations.every(item => item.release_path.includes(result.catalog.release_id)));
    assert.equal(JSON.stringify(result.catalog).includes('legacy'), false);
  } finally {
    fs.rmSync(space.directory, { recursive: true, force: true });
  }
});

test('independent compiles are byte-identical', () => {
  const first = workspace();
  const second = workspace();
  try {
    compile(first);
    compile(second);
    for (const file of ['catalog.json', 'release-manifest.json', 'change-impact.json']) {
      assert.deepEqual(fs.readFileSync(path.join(first.output, file)), fs.readFileSync(path.join(second.output, file)), file);
    }
  } finally {
    fs.rmSync(first.directory, { recursive: true, force: true });
    fs.rmSync(second.directory, { recursive: true, force: true });
  }
});

test('impact report classifies create, update, rename, move, reorder, publish, unpublish, and retire by stable ID', () => {
  function scenario(setupBaseline, mutateCurrent, expectedKey, expectedId = 'sim-alpha') {
    const space = workspace();
    try {
      if (setupBaseline) setupBaseline(space);
      const baseline = compile(space).releaseManifest;
      mutateCurrent(space);
      const current = compile(space, baseline);
      assert.deepEqual(current.impact[expectedKey], [expectedId], `${expectedKey} impact`);
      if (expectedId === 'sim-alpha') assert.ok(current.releaseManifest.source_index.some(item => item.id === expectedId));
    } finally {
      fs.rmSync(space.directory, { recursive: true, force: true });
    }
  }

  scenario(null, space => mutateJson(manifest(space, 'simulation', 'sim-alpha'), value => { value.description = 'Updated fixture description.'; }), 'updated');
  scenario(null, space => mutateJson(manifest(space, 'simulation', 'sim-alpha'), value => { value.title = 'Renamed Synthetic Simulation'; value.slug = 'renamed-synthetic'; value.redirect_from = ['synthetic-alpha']; }), 'renamed');
  scenario(null, space => mutateJson(manifest(space, 'simulation', 'sim-alpha'), value => { value.section_id = 'section-beta'; }), 'moved');
  scenario(null, space => mutateJson(manifest(space, 'simulation', 'sim-alpha'), value => { value.order = 3; }), 'reordered');
  scenario(space => mutateJson(manifest(space, 'simulation', 'sim-alpha'), value => { value.status = 'draft'; }), space => mutateJson(manifest(space, 'simulation', 'sim-alpha'), value => { value.status = 'published'; }), 'published');
  scenario(null, space => mutateJson(manifest(space, 'simulation', 'sim-alpha'), value => { value.status = 'unpublished'; }), 'unpublished');
  scenario(null, space => mutateJson(manifest(space, 'simulation', 'sim-alpha'), value => { value.status = 'retired'; }), 'retired');

  scenario(null, space => {
    const source = path.dirname(manifest(space, 'simulation', 'sim-alpha'));
    const target = path.join(space.content, 'simulations', 'sim-gamma');
    fs.cpSync(source, target, { recursive: true });
    const oldManifest = path.join(target, 'simulation.json');
    mutateJson(oldManifest, value => { value.id = 'sim-gamma'; value.title = 'Synthetic Gamma'; value.slug = 'synthetic-gamma'; value.order = 3; value.status = 'draft'; });
  }, 'created', 'sim-gamma');
});
