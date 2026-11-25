# ADR: Static Assets versus R2 for content delivery

- Status: **provisional; staging measurements required**
- Date: 2026-11-24
- Scope: public GradStudio 2.0 educational catalogs and simulation assets

## Decision under evaluation

Use a dedicated Cloudflare Worker with Workers Static Assets as the first production candidate. Retain versioned R2 publication as the fallback. Do not use GitHub Pages or request-time GitHub access.

## Why Static Assets is first

- one versioned Worker deployment can carry routing code and immutable public assets;
- asset requests are served through Cloudflare's asset binding without an application database;
- GitHub Actions can build one deterministic, provenance-recorded bundle;
- Worker-first routing can apply CSP/security/cache headers and single-range behavior;
- deployment and rollback remain independent of the application Worker.

## Current proof evidence

The synthetic two-simulation fixture produces 15 deployable files and 21,907 source bytes before the deployment-manifest bytes are added. Credential-free Wrangler 4.168.0 packaging succeeds locally. Unit tests pass for publication filtering, cache/CORS/security headers, range requests, safe 404/405/503 behavior, health provenance, deterministic output, and retention of prior release trees.

This evidence proves package shape only. It does not prove Cloudflare upload/runtime behavior, operational cost, or production suitability.

## R2 remains preferable if

- representative content approaches Static Assets file-count or per-file constraints;
- retaining active plus two directly addressable immutable releases is unreliable or operationally expensive;
- upload time or Worker version size makes routine changes slow;
- range/media behavior remains unsuitable after Worker-first handling;
- measured cost or rollback behavior is materially better with versioned R2 objects.

## Required staging comparison

Measure both candidates using the same representative bundle and record file count, total bytes, largest file, upload duration, release activation consistency, cache/range correctness, p50/p95 cold and warm retrieval, rollback time/result, retention behavior, and estimated monthly cost. The final ADR must cite run evidence and explicitly accept or reject R2. No production selection is made by this provisional ADR.
