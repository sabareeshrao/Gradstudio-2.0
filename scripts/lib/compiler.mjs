import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const CONTRACT = 'gradstudio-content-catalog/v1';
const COMPILER = { name: '@gradstudio/content-compiler', version: '1.0.0' };
const KINDS = ['asset-pack', 'category', 'course', 'section', 'simulation'];
const PLURAL = { 'asset-pack': 'shared', category: 'categories', course: 'courses', section: 'sections', simulation: 'simulations' };
const MANIFEST_NAME = { 'asset-pack': 'asset.json', category: 'category.json', course: 'course.json', section: 'section.json', simulation: 'simulation.json' };
const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,
  /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/,
  /\bCLOUDFLARE_API_TOKEN\s*[:=]\s*(?!\$\{\{)[^\s<]+/i,
  /\b(?:password|secret|access[_-]?token|api[_-]?key)\s*[:=]\s*["'][^"']{12,}["']/i
];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`${full}: symbolic links are prohibited in content source`);
    if (entry.isDirectory()) output.push(...walk(full));
    else output.push(full);
  }
  return output;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  }
  return value;
}

export function canonicalJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${file}: invalid JSON (${error.message})`);
  }
}

function validators(repositoryRoot) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const result = {};
  for (const kind of KINDS) {
    const schema = readJson(path.join(repositoryRoot, 'schemas', `${kind}-v1.schema.json`));
    result[kind] = ajv.compile(schema);
  }
  return result;
}

function manifestFiles(contentRoot) {
  return walk(contentRoot).filter(file => Object.values(MANIFEST_NAME).includes(path.basename(file)));
}

function assertSafeRelative(relative, label) {
  if (!relative || path.isAbsolute(relative) || relative.includes('\\')) throw new Error(`${label}: unsafe path ${relative}`);
  const parts = relative.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) throw new Error(`${label}: unsafe path ${relative}`);
}

function scanSecrets(text, label) {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) throw new Error(`${label}: prohibited credential signature`);
  }
}

function formatAjv(errors = []) {
  return errors.map(error => `${error.instancePath || '/'} ${error.message}`).join('; ');
}

function parentKey(record) {
  if (record.kind === 'asset-pack') return 'root';
  if (record.kind === 'category') return record.parent_id || 'root';
  if (record.kind === 'course') return `${record.category_id}:${record.parent_course_id || 'root'}`;
  if (record.kind === 'section') return record.course_id;
  return record.section_id;
}

function assertUniqueSiblingValues(records, field) {
  const values = new Map();
  for (const record of records) {
    if (record[field] === undefined) continue;
    const key = `${record.kind}:${parentKey(record)}:${String(record[field]).toLowerCase()}`;
    if (values.has(key)) throw new Error(`${record.source_path}: duplicate sibling ${field} with ${values.get(key)}`);
    values.set(key, record.source_path);
  }
}

function assertAcyclic(records, parentField, kind) {
  const byId = new Map(records.filter(record => record.kind === kind).map(record => [record.id, record]));
  for (const record of byId.values()) {
    const seen = new Set([record.id]);
    let parent = record[parentField];
    while (parent) {
      if (seen.has(parent)) throw new Error(`${record.source_path}: ${kind} parent cycle detected`);
      seen.add(parent);
      parent = byId.get(parent)?.[parentField] || null;
    }
  }
}

function extractLocalReferences(html) {
  const refs = [];
  for (const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) refs.push(match[1]);
  return refs;
}

function scanHtml(html, record, simulationDirectory) {
  const label = record.source_path;
  if (!/^\s*<!doctype html>/i.test(html) || !/<html[^>]+lang\s*=/i.test(html) || !/<title>[^<]+<\/title>/i.test(html) || !/<main\b/i.test(html)) {
    throw new Error(`${label}: HTML must include doctype, html lang, non-empty title, and main landmark`);
  }
  const forbidden = [
    [/<script(?![^>]*\bsrc\s*=)[^>]*>/i, 'inline script'],
    [/\son[a-z]+\s*=/i, 'inline event handler'],
    [/<(?:iframe|object|embed|applet|base)\b/i, 'forbidden active element'],
    [/<meta[^>]+http-equiv\s*=\s*["']?refresh/i, 'meta refresh'],
    [/document\.cookie/i, 'cookie access'],
    [/\beval\s*\(/i, 'eval'],
    [/\bwindow\.(?:parent|top)\b|\b(?:parent|top)\.(?:document|location|frames)\b/i, 'parent browsing-context access'],
    [/<form[^>]+action\s*=\s*["'](?:https?:|\/\/)/i, 'external form action']
  ];
  for (const [pattern, reason] of forbidden) if (pattern.test(html)) throw new Error(`${label}: unsafe HTML (${reason})`);

  for (const reference of extractLocalReferences(html)) {
    if (/^(?:#|data:|blob:|mailto:|tel:)/i.test(reference)) continue;
    if (/^(?:https?:|\/\/)/i.test(reference)) throw new Error(`${label}: external asset reference ${reference}`);
    const clean = reference.split(/[?#]/)[0];
    if (!clean) continue;
    assertSafeRelative(clean, label);
    const target = path.resolve(simulationDirectory, clean);
    if (!target.startsWith(`${path.resolve(simulationDirectory)}${path.sep}`) || !fs.existsSync(target)) {
      throw new Error(`${label}: missing local asset ${clean}`);
    }
  }
}

function scanJavaScript(source, record) {
  const label = record.source_path;
  try {
    new vm.Script(source, { filename: label });
  } catch (error) {
    throw new Error(`${label}: JavaScript syntax error (${error.message})`);
  }
  const forbidden = [
    [/document\.cookie/i, 'cookie access'],
    [/\beval\s*\(/i, 'eval'],
    [/\bnew\s+Function\s*\(/i, 'dynamic function'],
    [/\bwindow\.(?:parent|top)\b|\b(?:parent|top)\.(?:document|location|frames)\b/i, 'parent browsing-context access']
  ];
  for (const [pattern, reason] of forbidden) if (pattern.test(source)) throw new Error(`${label}: unsafe JavaScript (${reason})`);
  if (record.capabilities.network_origins.length === 0 && /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*(?:\(|\b)/.test(source)) {
    throw new Error(`${label}: network API used without an allowed origin`);
  }
  for (const match of source.matchAll(/["'](https:\/\/[^"']+)["']/g)) {
    const origin = new URL(match[1]).origin;
    if (!record.capabilities.network_origins.includes(origin)) throw new Error(`${label}: network origin is not allowlisted (${origin})`);
  }
}

function scanCss(source, record) {
  const label = record.source_path;
  const compact = source.replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  for (const character of compact) {
    if (character === '{') depth += 1;
    if (character === '}') depth -= 1;
    if (depth < 0) throw new Error(`${label}: CSS syntax has an unmatched closing brace`);
  }
  if (depth !== 0) throw new Error(`${label}: CSS syntax has unmatched braces`);
  if (/@import\s+(?:url\()?\s*["']?https?:|url\(\s*["']?https?:|expression\s*\(|javascript:/i.test(compact)) {
    throw new Error(`${label}: unsafe or external CSS reference`);
  }
}

function scanSvg(source, record) {
  if (/<script\b|\son[a-z]+\s*=|\b(?:href|src)\s*=\s*["'](?:https?:|\/\/)|javascript:/i.test(source)) {
    throw new Error(`${record.source_path}: unsafe SVG content`);
  }
}

function validateAssetPackFiles(record, manifestPath, contentRoot) {
  const directory = path.dirname(manifestPath);
  const declaredFolded = new Map();
  for (const relative of record.files) {
    assertSafeRelative(relative, record.source_path);
    const lower = relative.toLowerCase();
    if (declaredFolded.has(lower)) throw new Error(`${record.source_path}: case-colliding shared assets ${relative} and ${declaredFolded.get(lower)}`);
    declaredFolded.set(lower, relative);
  }
  const existing = walk(directory)
    .filter(file => path.basename(file) !== 'asset.json')
    .map(file => path.relative(directory, file).split(path.sep).join('/'));
  for (const relative of existing) if (!record.files.includes(relative)) throw new Error(`${record.source_path}: undeclared shared file ${relative}`);
  for (const relative of record.files) if (!existing.includes(relative)) throw new Error(`${record.source_path}: declared shared file missing ${relative}`);

  let total = 0;
  return existing.sort().map(relative => {
    const full = path.join(directory, ...relative.split('/'));
    const buffer = fs.readFileSync(full);
    total += buffer.length;
    if (buffer.length > 5 * 1024 * 1024 || total > 25 * 1024 * 1024) throw new Error(`${record.source_path}: shared asset size budget exceeded`);
    const source = buffer.toString('utf8');
    scanSecrets(source, `${record.source_path}:${relative}`);
    if (relative.endsWith('.css')) scanCss(source, record);
    if (relative.endsWith('.svg')) scanSvg(source, record);
    return { path: path.relative(contentRoot, full).split(path.sep).join('/'), sha256: sha256(buffer), size: buffer.length };
  });
}

function validateSimulationFiles(record, manifestPath, contentRoot) {
  const directory = path.dirname(manifestPath);
  assertSafeRelative(record.entrypoint, record.source_path);
  for (const asset of record.assets || []) assertSafeRelative(asset, record.source_path);

  const declared = new Set([record.entrypoint, ...(record.assets || [])]);
  const declaredFolded = new Map();
  for (const relative of declared) {
    const lower = relative.toLowerCase();
    if (declaredFolded.has(lower)) throw new Error(`${record.source_path}: case-colliding declared assets ${relative} and ${declaredFolded.get(lower)}`);
    declaredFolded.set(lower, relative);
  }
  const existing = walk(directory)
    .filter(file => path.basename(file) !== 'simulation.json')
    .map(file => path.relative(directory, file).split(path.sep).join('/'));
  const folded = new Map();
  for (const relative of existing) {
    const lower = relative.toLowerCase();
    if (folded.has(lower)) throw new Error(`${record.source_path}: case-colliding assets ${relative} and ${folded.get(lower)}`);
    folded.set(lower, relative);
    if (!declared.has(relative)) throw new Error(`${record.source_path}: undeclared simulation file ${relative}`);
  }
  for (const relative of declared) if (!existing.includes(relative)) throw new Error(`${record.source_path}: declared file missing ${relative}`);
  if (existing.length > 500) throw new Error(`${record.source_path}: simulation exceeds 500 files`);

  let total = 0;
  for (const relative of existing) {
    const full = path.join(directory, ...relative.split('/'));
    const size = fs.statSync(full).size;
    total += size;
    if (size > 5 * 1024 * 1024) throw new Error(`${record.source_path}: asset exceeds 5 MiB (${relative})`);
    const source = fs.readFileSync(full);
    scanSecrets(source.toString('utf8'), `${record.source_path}:${relative}`);
    if (relative === record.entrypoint) scanHtml(source.toString('utf8'), record, directory);
    if (relative.endsWith('.js')) scanJavaScript(source.toString('utf8'), record);
    if (relative.endsWith('.css')) scanCss(source.toString('utf8'), record);
  }
  if (total > 25 * 1024 * 1024) throw new Error(`${record.source_path}: simulation exceeds 25 MiB`);

  return existing.map(relative => {
    const full = path.join(directory, ...relative.split('/'));
    const buffer = fs.readFileSync(full);
    return {
      path: path.relative(contentRoot, full).split(path.sep).join('/'),
      sha256: sha256(buffer),
      size: buffer.length
    };
  });
}

export function loadAndValidateContent({ repositoryRoot, contentRoot }) {
  const validate = validators(repositoryRoot);
  const files = manifestFiles(contentRoot);
  const records = [];
  const byId = new Map();
  const manifestPaths = new Map();

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    scanSecrets(raw, file);
    const manifest = readJson(file);
    if (!KINDS.includes(manifest.kind)) throw new Error(`${file}: unknown manifest kind`);
    if (!validate[manifest.kind](manifest)) throw new Error(`${file}: schema validation failed (${formatAjv(validate[manifest.kind].errors)})`);
    const relative = path.relative(contentRoot, file).split(path.sep).join('/');
    if (byId.has(manifest.id)) throw new Error(`${relative}: duplicate global ID also used by ${byId.get(manifest.id).source_path}`);
    const expected = `${PLURAL[manifest.kind]}/${manifest.id}/${MANIFEST_NAME[manifest.kind]}`;
    if (relative !== expected) throw new Error(`${relative}: manifest path must be ${expected}`);
    const record = { ...manifest, source_path: relative, manifest_sha256: sha256(canonicalJson(manifest)) };
    byId.set(record.id, record);
    manifestPaths.set(record.id, file);
    records.push(record);
  }

  for (const record of records) {
    if (record.kind === 'category' && record.parent_id && byId.get(record.parent_id)?.kind !== 'category') throw new Error(`${record.source_path}: missing category parent ${record.parent_id}`);
    if (record.kind === 'course') {
      if (byId.get(record.category_id)?.kind !== 'category') throw new Error(`${record.source_path}: missing category ${record.category_id}`);
      if (record.parent_course_id) {
        const parent = byId.get(record.parent_course_id);
        if (parent?.kind !== 'course') throw new Error(`${record.source_path}: missing parent course ${record.parent_course_id}`);
        if (parent.category_id !== record.category_id) throw new Error(`${record.source_path}: parent course belongs to a different category`);
      }
    }
    if (record.kind === 'section' && byId.get(record.course_id)?.kind !== 'course') throw new Error(`${record.source_path}: missing course ${record.course_id}`);
    if (record.kind === 'simulation') {
      const course = byId.get(record.course_id);
      const section = byId.get(record.section_id);
      if (course?.kind !== 'course') throw new Error(`${record.source_path}: missing course ${record.course_id}`);
      if (section?.kind !== 'section') throw new Error(`${record.source_path}: missing section ${record.section_id}`);
      if (section.course_id !== record.course_id) throw new Error(`${record.source_path}: section/course relationship mismatch`);
      for (const assetId of record.shared_asset_ids || []) {
        if (byId.get(assetId)?.kind !== 'asset-pack') throw new Error(`${record.source_path}: missing shared asset pack ${assetId}`);
      }
    }
  }

  assertAcyclic(records, 'parent_id', 'category');
  assertAcyclic(records, 'parent_course_id', 'course');
  assertUniqueSiblingValues(records, 'order');
  assertUniqueSiblingValues(records, 'slug');

  for (const record of records.filter(record => record.status === 'published')) {
    const ancestors = [];
    if (record.kind === 'category' && record.parent_id) ancestors.push(record.parent_id);
    if (record.kind === 'course') ancestors.push(record.category_id, ...(record.parent_course_id ? [record.parent_course_id] : []));
    if (record.kind === 'section') ancestors.push(record.course_id);
    if (record.kind === 'simulation') ancestors.push(record.course_id, record.section_id);
    if (record.kind === 'simulation') ancestors.push(...(record.shared_asset_ids || []));
    for (const id of ancestors) if (byId.get(id)?.status !== 'published') throw new Error(`${record.source_path}: published record has unpublished ancestor ${id}`);
  }

  const assets = [];
  for (const record of records.filter(record => record.kind === 'simulation')) {
    assets.push(...validateSimulationFiles(record, manifestPaths.get(record.id), contentRoot));
  }
  for (const record of records.filter(record => record.kind === 'asset-pack')) {
    assets.push(...validateAssetPackFiles(record, manifestPaths.get(record.id), contentRoot));
  }

  records.sort((a, b) => a.kind.localeCompare(b.kind) || parentKey(a).localeCompare(parentKey(b)) || a.order - b.order || a.id.localeCompare(b.id));
  assets.sort((a, b) => a.path.localeCompare(b.path));
  return { records, assets };
}

function publicRecord(record, releaseId) {
  const { manifest_sha256, source_path, redirect_from = [], ...manifest } = record;
  const output = { ...manifest, source_path, manifest_sha256 };
  if (redirect_from.length) output.redirect_from = redirect_from;
  if (record.kind === 'asset-pack') output.release_base_path = `releases/${releaseId}/content/${path.dirname(source_path)}/`;
  if (record.kind === 'simulation') output.release_path = `releases/${releaseId}/content/${path.dirname(source_path)}/${record.entrypoint}`;
  return output;
}

export function buildImpact(previousIndex = [], currentIndex = []) {
  const before = new Map(previousIndex.map(item => [item.id, item]));
  const after = new Map(currentIndex.map(item => [item.id, item]));
  const impact = { created: [], removed: [], updated: [], renamed: [], moved: [], reordered: [], published: [], unpublished: [], retired: [] };
  for (const [id, current] of after) {
    const previous = before.get(id);
    if (!previous) { impact.created.push(id); continue; }
    if (previous.title !== current.title || previous.slug !== current.slug || previous.source_path !== current.source_path) impact.renamed.push(id);
    const parentFields = ['parent_id', 'category_id', 'parent_course_id', 'course_id', 'section_id'];
    if (parentFields.some(field => (previous[field] || null) !== (current[field] || null))) impact.moved.push(id);
    if (previous.order !== current.order) impact.reordered.push(id);
    if (previous.status !== current.status) {
      if (current.status === 'published') impact.published.push(id);
      if (current.status === 'unpublished') impact.unpublished.push(id);
      if (current.status === 'retired') impact.retired.push(id);
    }
    if (previous.manifest_sha256 !== current.manifest_sha256 && ![...impact.renamed, ...impact.moved, ...impact.reordered, ...impact.published, ...impact.unpublished, ...impact.retired].includes(id)) impact.updated.push(id);
  }
  for (const id of before.keys()) if (!after.has(id)) impact.removed.push(id);
  for (const values of Object.values(impact)) values.sort();
  return impact;
}

export function compileContent({ repositoryRoot, contentRoot, outputRoot, sourceCommit, contentBaseUrl = 'https://content.invalid' , previousReleaseManifest = null }) {
  if (!/^[0-9a-f]{40}$/i.test(sourceCommit)) throw new Error('source commit must be a 40-character hexadecimal SHA');
  const { records, assets } = loadAndValidateContent({ repositoryRoot, contentRoot });
  const sourceIndex = records.map(record => ({ ...record }));
  const sourceDigest = sha256(canonicalJson({ records: sourceIndex, assets }));
  const releaseId = `rel-${sourceCommit.slice(0, 12).toLowerCase()}-${sourceDigest.slice(0, 12)}`;
  const published = records.filter(record => record.status === 'published');
  const catalogPayload = {
    '$schema': `${contentBaseUrl.replace(/\/$/, '')}/schemas/catalog-v1.json`,
    contract: CONTRACT,
    schema_version: 1,
    release_id: releaseId,
    source: { repository: 'sabareeshrao/Gradstudio-2.0', commit: sourceCommit.toLowerCase() },
    compiler: COMPILER,
    content_base_url: `${contentBaseUrl.replace(/\/$/, '')}/releases/${releaseId}/`,
    shared_assets: published.filter(item => item.kind === 'asset-pack').map(item => publicRecord(item, releaseId)),
    categories: published.filter(item => item.kind === 'category').map(item => publicRecord(item, releaseId)),
    courses: published.filter(item => item.kind === 'course').map(item => publicRecord(item, releaseId)),
    sections: published.filter(item => item.kind === 'section').map(item => publicRecord(item, releaseId)),
    simulations: published.filter(item => item.kind === 'simulation').map(item => publicRecord(item, releaseId))
  };
  const catalogSha256 = sha256(canonicalJson(catalogPayload));
  const catalog = { ...catalogPayload, catalog_sha256: catalogSha256 };
  const catalogText = canonicalJson(catalog);
  const releaseManifest = {
    contract: 'gradstudio-content-release/v1',
    schema_version: 1,
    release_id: releaseId,
    source: catalog.source,
    compiler: COMPILER,
    source_digest_sha256: sourceDigest,
    catalog_file_sha256: sha256(catalogText),
    source_index: sourceIndex,
    files: assets
  };
  const previousIndex = previousReleaseManifest?.source_index || [];
  const impact = buildImpact(previousIndex, sourceIndex);

  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, 'catalog.json'), catalogText);
  fs.writeFileSync(path.join(outputRoot, 'release-manifest.json'), canonicalJson(releaseManifest));
  fs.writeFileSync(path.join(outputRoot, 'change-impact.json'), canonicalJson(impact));
  return { catalog, releaseManifest, impact };
}

export function scanRepositoryContent(repositoryRoot) {
  const excluded = new Set(['.git', 'node_modules', 'dist', 'dist-current']);
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (excluded.has(entry.name)) continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else files.push(full);
    }
  }
  visit(repositoryRoot);
  for (const file of files) {
    if (fs.statSync(file).size > 2 * 1024 * 1024) continue;
    const relative = path.relative(repositoryRoot, file).split(path.sep).join('/');
    scanSecrets(fs.readFileSync(file, 'utf8'), relative);
  }
}
