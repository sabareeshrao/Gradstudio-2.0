import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wrangler = path.join(repositoryRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const result = spawnSync(process.execPath, [wrangler, 'deploy', '--dry-run', '--env', 'development', '--outdir', 'dist-worker-dry-run'], {
  cwd: repositoryRoot,
  env: { ...process.env, XDG_CONFIG_HOME: path.join(repositoryRoot, '.wrangler-local') },
  stdio: 'inherit'
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
