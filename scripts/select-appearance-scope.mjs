import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export function selectAppearanceScope(paths) {
  const changed = [...new Set(paths.map(value => value.replaceAll('\\', '/')).filter(Boolean))].sort();
  if (!changed.length) return { scope: 'none', ids: [] };

  const ids = new Set();
  for (const file of changed) {
    const simulation = file.match(/^content\/simulations\/([^/]+)\//);
    if (simulation) {
      ids.add(simulation[1]);
      continue;
    }
    if (/^content\/(categories|courses|sections)\//.test(file)) continue;
    if (/^content\/shared\//.test(file)) return { scope: 'full', ids: [] };
    return { scope: 'full', ids: [] };
  }
  return ids.size ? { scope: 'changed', ids: [...ids].sort() } : { scope: 'none', ids: [] };
}

function changedPaths(base, head) {
  if (![base, head].every(value => /^[0-9a-f]{40}$/i.test(value || ''))) throw new Error('base and head must be full Git SHAs');
  return execFileSync('git', ['diff', '--name-only', '--no-renames', base, head], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const full = process.argv.includes('--full');
  const result = full ? { scope: 'full', ids: [] } : selectAppearanceScope(changedPaths(process.env.APPEARANCE_BASE_SHA, process.env.APPEARANCE_HEAD_SHA));
  console.log(`Appearance validation scope: ${result.scope}${result.ids.length ? ` (${result.ids.join(', ')})` : ''}`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `scope=${result.scope}\nids=${result.ids.join(',')}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\nAppearance validation scope: **${result.scope}**${result.ids.length ? ` for ${result.ids.map(id => `\`${id}\``).join(', ')}` : ''}.\n`);
}
