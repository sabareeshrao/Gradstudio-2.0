import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileContent } from './lib/compiler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(root, 'tests', 'fixtures', 'valid', 'content');
const first = fs.mkdtempSync(path.join(os.tmpdir(), 'gradstudio-build-a-'));
const second = fs.mkdtempSync(path.join(os.tmpdir(), 'gradstudio-build-b-'));
try {
  const options = { repositoryRoot: root, contentRoot, sourceCommit: '0000000000000000000000000000000000000000' };
  compileContent({ ...options, outputRoot: first });
  compileContent({ ...options, outputRoot: second });
  for (const file of ['catalog.json', 'release-manifest.json', 'change-impact.json']) {
    const a = fs.readFileSync(path.join(first, file));
    const b = fs.readFileSync(path.join(second, file));
    if (!a.equals(b)) throw new Error(`${file} is not reproducible`);
  }
  console.log('Independent content builds are byte-identical.');
} finally {
  fs.rmSync(first, { recursive: true, force: true });
  fs.rmSync(second, { recursive: true, force: true });
}
