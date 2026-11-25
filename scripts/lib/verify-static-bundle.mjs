import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { canonicalJson } from './compiler.mjs';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function inventory(root) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`${full}: symbolic links are prohibited in deployment bundles`);
      if (entry.isDirectory()) visit(full);
      else {
        const relative = path.relative(root, full).split(path.sep).join('/');
        if (relative === 'deployment-manifest.json') continue;
        const buffer = fs.readFileSync(full);
        files.push({ path: relative, size: buffer.length, sha256: sha256(buffer) });
      }
    }
  }
  visit(root);
  return files;
}

export function verifyStaticBundle({ bundleRoot, expectedSourceCommit, expectedReleaseId, expectedBundleDigest }) {
  const root = path.resolve(bundleRoot);
  if (!fs.statSync(root, { throwIfNoEntry: false })?.isDirectory()) throw new Error('bundle root is missing');
  const manifestPath = path.join(root, 'deployment-manifest.json');
  if (!fs.statSync(manifestPath, { throwIfNoEntry: false })?.isFile()) throw new Error('deployment manifest is missing');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.contract !== 'gradstudio-content-deployment/v1' || manifest.schema_version !== 1) throw new Error('unsupported deployment manifest');
  if (manifest.source?.commit !== expectedSourceCommit) throw new Error('deployment source commit does not match');
  if (manifest.active_release_id !== expectedReleaseId) throw new Error('active release ID does not match');
  if (manifest.bundle_digest_sha256 !== expectedBundleDigest) throw new Error('declared bundle digest does not match');
  const files = inventory(root);
  if (canonicalJson(files) !== canonicalJson(manifest.files)) throw new Error('bundle files do not match the deployment manifest');
  if (manifest.file_count !== files.length + 1) throw new Error('bundle file count does not match');
  if (sha256(canonicalJson(files)) !== manifest.bundle_digest_sha256) throw new Error('computed bundle digest does not match');
  const activeCatalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog', 'v1', 'active.json'), 'utf8'));
  if (activeCatalog.release_id !== expectedReleaseId || activeCatalog.source?.commit !== expectedSourceCommit) {
    throw new Error('active catalog provenance does not match');
  }
  const immutableCatalog = fs.readFileSync(path.join(root, 'releases', expectedReleaseId, 'catalog.json'));
  const activeCatalogBytes = fs.readFileSync(path.join(root, 'catalog', 'v1', 'active.json'));
  if (!immutableCatalog.equals(activeCatalogBytes)) throw new Error('active and immutable catalogs differ');
  return manifest;
}
