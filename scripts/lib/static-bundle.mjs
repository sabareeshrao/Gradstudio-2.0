import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { canonicalJson, compileContent } from './compiler.mjs';

const SCHEMA_FILES = [
  'asset-pack-v1.schema.json',
  'category-v1.schema.json',
  'course-v1.schema.json',
  'section-v1.schema.json',
  'simulation-v1.schema.json'
];

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function safeRelative(relative, label) {
  if (!relative || path.isAbsolute(relative) || relative.includes('\\')) throw new Error(`${label}: unsafe path ${relative}`);
  if (relative.split('/').some(part => !part || part === '.' || part === '..')) throw new Error(`${label}: unsafe path ${relative}`);
}

function safeOutputRoot(repositoryRoot, outputRoot) {
  const repository = path.resolve(repositoryRoot);
  const output = path.resolve(outputRoot);
  const temporary = path.resolve(process.env.TEMP || process.env.TMP || '/tmp');
  const allowedName = path.basename(output).startsWith('dist');
  const inRepository = output.startsWith(`${repository}${path.sep}`) && allowedName;
  const inTemporary = output.startsWith(`${temporary}${path.sep}`) && allowedName;
  if (!inRepository && !inTemporary) throw new Error(`refusing to replace unsafe output directory ${output}`);
  return output;
}

function copyFileVerified(source, destination, expected) {
  const buffer = fs.readFileSync(source);
  if (buffer.length !== expected.size || sha256(buffer) !== expected.sha256) {
    throw new Error(`${expected.path}: source changed after validation`);
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, buffer);
}

function readPreviousDeployment(previousBundleRoot) {
  if (!previousBundleRoot || !fs.existsSync(previousBundleRoot)) return null;
  const manifestPath = path.join(previousBundleRoot, 'deployment-manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  const previous = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (previous.contract !== 'gradstudio-content-deployment/v1' || previous.schema_version !== 1) {
    throw new Error('previous bundle has an unsupported deployment manifest');
  }
  const sourceIndexPath = path.join(previousBundleRoot, 'deployment-evidence', 'source-index.json');
  if (!fs.existsSync(sourceIndexPath)) return { manifest: previous, sourceIndex: [] };
  const evidence = JSON.parse(fs.readFileSync(sourceIndexPath, 'utf8'));
  if (evidence.contract !== 'gradstudio-content-source-index/v1' || evidence.schema_version !== 1 || !Array.isArray(evidence.source_index)) {
    throw new Error('previous bundle has an unsupported source-index evidence file');
  }
  return { manifest: previous, sourceIndex: evidence.source_index };
}

function copyRetainedReleases(previousBundleRoot, previousDeployment, releasesRoot, activeReleaseId, limit) {
  if (!previousBundleRoot || !previousDeployment || limit === 0) return [];
  const previous = previousDeployment.manifest;
  const candidates = [previous.active_release_id, ...(previous.retained_release_ids || [])]
    .filter((value, index, all) => value && value !== activeReleaseId && all.indexOf(value) === index)
    .slice(0, limit);
  const retained = [];
  for (const releaseId of candidates) {
    if (!/^rel-[0-9a-f]{12}-[0-9a-f]{12}$/.test(releaseId)) throw new Error(`invalid retained release ID ${releaseId}`);
    const source = path.join(previousBundleRoot, 'releases', releaseId);
    if (!fs.statSync(source, { throwIfNoEntry: false })?.isDirectory()) continue;
    fs.cpSync(source, path.join(releasesRoot, releaseId), { recursive: true, errorOnExist: true });
    retained.push(releaseId);
  }
  return retained;
}

function inventory(root) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`${full}: symbolic links are prohibited in deployment bundles`);
      if (entry.isDirectory()) visit(full);
      else {
        const buffer = fs.readFileSync(full);
        files.push({
          path: path.relative(root, full).split(path.sep).join('/'),
          size: buffer.length,
          sha256: sha256(buffer)
        });
      }
    }
  }
  visit(root);
  return files;
}

export function buildStaticBundle({ repositoryRoot, contentRoot, outputRoot, sourceCommit, contentBaseUrl, previousBundleRoot = null }) {
  const output = safeOutputRoot(repositoryRoot, outputRoot);
  const policy = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'config', 'static-assets-policy.json'), 'utf8'));
  const compilerOutput = path.join(output, '.compiler');
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(compilerOutput, { recursive: true });

  try {
    const previousDeployment = readPreviousDeployment(previousBundleRoot);
    const compiled = compileContent({
      repositoryRoot,
      contentRoot,
      outputRoot: compilerOutput,
      sourceCommit,
      contentBaseUrl,
      previousReleaseManifest: previousDeployment ? { source_index: previousDeployment.sourceIndex } : null
    });
    const releaseId = compiled.releaseManifest.release_id;
    const releaseRoot = path.join(output, 'releases', releaseId);
    fs.mkdirSync(releaseRoot, { recursive: true });
    fs.copyFileSync(path.join(compilerOutput, 'catalog.json'), path.join(releaseRoot, 'catalog.json'));

    const publicPrefixes = compiled.releaseManifest.source_index
      .filter(record => record.status === 'published' && ['simulation', 'asset-pack'].includes(record.kind))
      .map(record => `${path.posix.dirname(record.source_path)}/`);
    const publicAssets = compiled.releaseManifest.files.filter(asset => publicPrefixes.some(prefix => asset.path.startsWith(prefix)));
    for (const asset of publicAssets) {
      safeRelative(asset.path, 'release asset');
      copyFileVerified(
        path.join(contentRoot, ...asset.path.split('/')),
        path.join(releaseRoot, 'content', ...asset.path.split('/')),
        asset
      );
    }

    const activeRoot = path.join(output, 'catalog', 'v1');
    fs.mkdirSync(activeRoot, { recursive: true });
    fs.copyFileSync(path.join(compilerOutput, 'catalog.json'), path.join(activeRoot, 'active.json'));

    const schemasRoot = path.join(output, 'schemas');
    fs.mkdirSync(schemasRoot, { recursive: true });
    fs.copyFileSync(path.join(repositoryRoot, 'schemas', 'catalog-v1.schema.json'), path.join(schemasRoot, 'catalog-v1.json'));
    for (const schema of SCHEMA_FILES) fs.copyFileSync(path.join(repositoryRoot, 'schemas', schema), path.join(schemasRoot, schema.replace('.schema', '')));

    const evidenceRoot = path.join(output, 'deployment-evidence');
    fs.mkdirSync(evidenceRoot, { recursive: true });
    fs.writeFileSync(path.join(evidenceRoot, 'change-impact.json'), canonicalJson({
      contract: 'gradstudio-content-impact/v1',
      schema_version: 1,
      source: compiled.catalog.source,
      active_release_id: releaseId,
      change_impact: compiled.impact
    }));
    fs.writeFileSync(path.join(evidenceRoot, 'source-index.json'), canonicalJson({
      contract: 'gradstudio-content-source-index/v1',
      schema_version: 1,
      source: compiled.catalog.source,
      active_release_id: releaseId,
      source_index: compiled.releaseManifest.source_index
    }));

    fs.rmSync(compilerOutput, { recursive: true, force: true });
    const retainedReleaseIds = copyRetainedReleases(
      previousBundleRoot,
      previousDeployment,
      path.join(output, 'releases'),
      releaseId,
      policy.retained_previous_releases
    );

    const files = inventory(output);
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    const largest = files.reduce((largestFile, file) => file.size > largestFile.size ? file : largestFile, { path: null, size: 0 });
    if (files.length + 1 > policy.max_files) throw new Error(`bundle file count ${files.length + 1} exceeds policy limit ${policy.max_files}`);
    if (largest.size > policy.max_file_bytes) throw new Error(`${largest.path} exceeds policy file limit ${policy.max_file_bytes}`);
    if (totalBytes > policy.max_bundle_bytes) throw new Error(`bundle bytes ${totalBytes} exceed policy limit ${policy.max_bundle_bytes}`);

    const manifest = {
      contract: 'gradstudio-content-deployment/v1',
      schema_version: 1,
      environment_agnostic: true,
      active_release_id: releaseId,
      retained_release_ids: retainedReleaseIds,
      source: compiled.catalog.source,
      bundle_digest_sha256: sha256(canonicalJson(files)),
      file_count: files.length + 1,
      total_bytes: totalBytes,
      largest_file: largest,
      policy,
      public_asset_count: publicAssets.length,
      files
    };
    fs.writeFileSync(path.join(output, 'deployment-manifest.json'), canonicalJson(manifest));
    return { ...compiled, deploymentManifest: manifest };
  } catch (error) {
    fs.rmSync(output, { recursive: true, force: true });
    throw error;
  }
}
