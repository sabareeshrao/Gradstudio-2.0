import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { compileContent } from './lib/compiler.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
function value(name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}

const contentRoot = path.resolve(repositoryRoot, value('--content', 'content'));
const outputRoot = path.resolve(repositoryRoot, value('--output', 'dist'));
const sourceCommit = value('--source-commit', process.env.GITHUB_SHA || '');
const contentBaseUrl = value('--content-base-url', 'https://content.invalid');
const baseManifestPath = value('--base-manifest', null);
const previousReleaseManifest = baseManifestPath ? JSON.parse(fs.readFileSync(path.resolve(baseManifestPath), 'utf8')) : null;

const result = compileContent({ repositoryRoot, contentRoot, outputRoot, sourceCommit, contentBaseUrl, previousReleaseManifest });
console.log(`Compiled ${result.releaseManifest.release_id}: ${result.catalog.simulations.length} published simulation(s).`);
