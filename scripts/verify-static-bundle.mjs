import path from 'node:path';
import { verifyStaticBundle } from './lib/verify-static-bundle.mjs';

function value(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) throw new Error(`${name} is required`);
  return process.argv[index + 1];
}

const manifest = verifyStaticBundle({
  bundleRoot: path.resolve(value('--bundle')),
  expectedSourceCommit: value('--source-commit'),
  expectedReleaseId: value('--release-id'),
  expectedBundleDigest: value('--bundle-digest')
});
console.log(`Verified rollback bundle ${manifest.active_release_id} from ${manifest.source.commit}.`);
