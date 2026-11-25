const OPERATIONS = ['created', 'removed', 'updated', 'renamed', 'moved', 'reordered', 'published', 'unpublished', 'retired'];

export function formatImpactSummary(manifest, impactEvidence) {
  if (manifest?.contract !== 'gradstudio-content-deployment/v1' || manifest.schema_version !== 1) {
    throw new Error('unsupported deployment manifest');
  }
  if (impactEvidence?.contract !== 'gradstudio-content-impact/v1' || impactEvidence.schema_version !== 1) {
    throw new Error('unsupported change-impact evidence');
  }
  if (impactEvidence.active_release_id !== manifest.active_release_id || impactEvidence.source?.commit !== manifest.source?.commit) {
    throw new Error('change-impact evidence does not match the deployment manifest');
  }
  const impact = impactEvidence.change_impact;
  if (!impact || OPERATIONS.some(operation => !Array.isArray(impact[operation]))) {
    throw new Error('deployment manifest has no valid change impact');
  }
  const lines = [
    '# GradStudio content release impact',
    '',
    `- Source commit: \`${manifest.source?.commit || 'unknown'}\``,
    `- Active release: \`${manifest.active_release_id}\``,
    `- Bundle digest: \`${manifest.bundle_digest_sha256}\``,
    '',
    '| Operation | Count | Stable IDs |',
    '| --- | ---: | --- |'
  ];
  let total = 0;
  for (const operation of OPERATIONS) {
    const ids = [...impact[operation]].sort();
    total += ids.length;
    lines.push(`| ${operation} | ${ids.length} | ${ids.length ? ids.map(id => `\`${id}\``).join(', ') : '—'} |`);
  }
  lines.push('', total === 0 ? 'No educational metadata changes were detected.' : `${total} stable-ID operation(s) detected.`);
  return `${lines.join('\n')}\n`;
}
