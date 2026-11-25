import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileContent } from '../scripts/lib/compiler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, 'tests', 'fixtures', 'valid', 'content');
const sha = '2222222222222222222222222222222222222222';

function workspace() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gradstudio-negative-'));
  const content = path.join(directory, 'content');
  fs.cpSync(fixture, content, { recursive: true });
  return { directory, content, output: path.join(directory, 'dist') };
}

function file(space, relative) { return path.join(space.content, ...relative.split('/')); }
function json(space, relative, mutate) {
  const target = file(space, relative);
  const value = JSON.parse(fs.readFileSync(target, 'utf8'));
  mutate(value);
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

async function rejects(name, mutate, pattern) {
  await test(name, () => {
    const space = workspace();
    try {
      mutate(space);
      assert.throws(() => compileContent({ repositoryRoot: root, contentRoot: space.content, outputRoot: space.output, sourceCommit: sha }), pattern);
    } finally {
      fs.rmSync(space.directory, { recursive: true, force: true });
    }
  });
}

await rejects('duplicate sibling slug is rejected', space => json(space, 'simulations/sim-beta/simulation.json', value => { value.slug = 'synthetic-alpha'; }), /duplicate sibling slug/);
await rejects('duplicate global ID is rejected', space => { fs.cpSync(file(space, 'simulations/sim-alpha'), file(space, 'simulations/sim-copy'), { recursive: true }); }, /duplicate global ID/);
await rejects('duplicate sibling order is rejected', space => json(space, 'simulations/sim-beta/simulation.json', value => { value.order = 1; }), /duplicate sibling order/);
await rejects('negative order is rejected', space => json(space, 'simulations/sim-beta/simulation.json', value => { value.order = -1; }), /schema validation failed/);
await rejects('missing parent is rejected', space => json(space, 'sections/section-alpha/section.json', value => { value.course_id = 'course-missing'; }), /missing course/);
await rejects('missing shared asset pack is rejected', space => json(space, 'simulations/sim-alpha/simulation.json', value => { value.shared_asset_ids = ['asset-missing']; }), /missing shared asset pack/);
await rejects('locked display without entitlement is rejected', space => json(space, 'simulations/sim-alpha/simulation.json', value => { value.access = { display: 'locked' }; }), /schema validation failed/);
await rejects('path traversal is rejected', space => json(space, 'simulations/sim-alpha/simulation.json', value => { value.entrypoint = '../index.html'; }), /schema validation failed/);
await rejects('case-colliding assets are rejected', space => json(space, 'simulations/sim-alpha/simulation.json', value => { value.assets.push('APP.js'); }), /case-colliding declared assets/);
await rejects('unsupported schema version is rejected', space => json(space, 'courses/course-synthetic/course.json', value => { value.schema_version = 2; }), /schema validation failed/);
await rejects('missing declared file is rejected', space => { fs.rmSync(file(space, 'simulations/sim-alpha/app.js')); }, /declared file missing/);
await rejects('undeclared file is rejected', space => { fs.writeFileSync(file(space, 'simulations/sim-alpha/extra.js'), 'const extra = true;\n'); }, /undeclared simulation file/);
await rejects('credential signature is rejected', space => {
  const fakeCredential = `ghp_${'a'.repeat(36)}`;
  fs.writeFileSync(file(space, 'simulations/sim-alpha/app.js'), `const token = '${fakeCredential}';\n`);
}, /prohibited credential signature/);
await rejects('inline malicious script is rejected', space => { fs.appendFileSync(file(space, 'simulations/sim-alpha/index.html'), '<script>alert(1)</script>'); }, /unsafe HTML \(inline script\)/);
await rejects('external script is rejected', space => { fs.writeFileSync(file(space, 'simulations/sim-alpha/index.html'), '<!doctype html><html lang="en"><head><title>Unsafe</title></head><body><main>Unsafe</main><script src="https://evil.example/x.js"></script></body></html>'); }, /external asset reference/);
await rejects('network API without capability is rejected', space => { fs.writeFileSync(file(space, 'simulations/sim-alpha/app.js'), "fetch('https://example.test/data');\n"); }, /network API used without an allowed origin/);
await rejects('network API outside the allowlist is rejected', space => {
  json(space, 'simulations/sim-alpha/simulation.json', value => { value.capabilities.network_origins = ['https://allowed.example']; });
  fs.writeFileSync(file(space, 'simulations/sim-alpha/app.js'), "fetch('https://other.example/data');\n");
}, /network origin is not allowlisted/);
await rejects('malformed CSS is rejected', space => { fs.writeFileSync(file(space, 'simulations/sim-alpha/styles.css'), '.card { color: red;\n'); }, /CSS syntax has unmatched braces/);
await rejects('external CSS is rejected', space => { fs.writeFileSync(file(space, 'simulations/sim-alpha/styles.css'), '@import "https://evil.example/x.css";\n'); }, /unsafe or external CSS reference/);
await rejects('unsafe shared SVG is rejected', space => {
  const directory = file(space, 'shared/asset-synthetic-icons');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  fs.writeFileSync(path.join(directory, 'asset.json'), `${JSON.stringify({ schema_version: 1, kind: 'asset-pack', id: 'asset-synthetic-icons', title: 'Synthetic Icons', order: 2, status: 'published', files: ['icon.svg'] }, null, 2)}\n`);
}, /unsafe SVG content/);
await rejects('missing HTML accessibility structure is rejected', space => { fs.writeFileSync(file(space, 'simulations/sim-alpha/index.html'), '<html><body>No structure</body></html>'); }, /HTML must include doctype/);

test('symbolic-link assets cannot escape a content directory', t => {
  const space = workspace();
  try {
    const outside = path.join(space.directory, 'outside.txt');
    const link = file(space, 'simulations/sim-alpha/linked.txt');
    fs.writeFileSync(outside, 'outside content\n');
    try {
      fs.symlinkSync(outside, link, 'file');
    } catch (error) {
      if (error.code === 'EPERM' || error.code === 'EACCES') {
        t.skip('Local platform does not permit creating test symlinks; Linux CI executes this assertion.');
        return;
      }
      throw error;
    }
    json(space, 'simulations/sim-alpha/simulation.json', value => { value.assets.push('linked.txt'); });
    assert.throws(
      () => compileContent({ repositoryRoot: root, contentRoot: space.content, outputRoot: space.output, sourceCommit: sha }),
      /symbolic links are prohibited/
    );
  } finally {
    fs.rmSync(space.directory, { recursive: true, force: true });
  }
});

await rejects('course parent cycle is rejected', space => {
  const secondDirectory = file(space, 'courses/course-second');
  fs.mkdirSync(secondDirectory, { recursive: true });
  const firstPath = 'courses/course-synthetic/course.json';
  json(space, firstPath, value => { value.parent_course_id = 'course-second'; });
  const second = JSON.parse(fs.readFileSync(file(space, firstPath), 'utf8'));
  second.id = 'course-second';
  second.title = 'Synthetic Course Second';
  second.slug = 'synthetic-course-second';
  second.order = 2;
  second.parent_course_id = 'course-synthetic';
  fs.writeFileSync(path.join(secondDirectory, 'course.json'), `${JSON.stringify(second, null, 2)}\n`);
}, /course parent cycle detected/);
