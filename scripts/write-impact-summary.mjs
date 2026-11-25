import fs from 'node:fs';
import path from 'node:path';
import { formatImpactSummary } from './lib/impact-summary.mjs';

const manifestPath = path.resolve(process.argv[2] || 'dist-static/deployment-manifest.json');
const impactPath = path.resolve(process.argv[3] || path.join(path.dirname(manifestPath), 'deployment-evidence', 'change-impact.json'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const impact = JSON.parse(fs.readFileSync(impactPath, 'utf8'));
process.stdout.write(formatImpactSummary(manifest, impact));
