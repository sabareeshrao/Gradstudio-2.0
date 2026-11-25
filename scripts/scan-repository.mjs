import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanRepositoryContent } from './lib/compiler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
scanRepositoryContent(root);
console.log('Repository credential-signature scan passed.');
