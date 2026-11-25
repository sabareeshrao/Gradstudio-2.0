# Content Worker and Static Assets proof

## Boundary

The Content Worker is an independently deployable, public, credential-free delivery service for validated GradStudio educational content. Git remains canonical. The Worker does not read GitHub at request time, query operational databases, make authorization decisions, or contain customer data.

`wrangler.jsonc` defines only local, `development`, and `staging` Workers. There is intentionally no production environment or route.

## Deployable tree

`node scripts/build-static-bundle.mjs --content content --output dist-static --source-commit <40-hex-sha> --content-base-url <https-origin>` creates:

~~~text
dist-static/
  catalog/v1/active.json
  deployment-manifest.json
  releases/<release-id>/
    catalog.json
    content/simulations/<id>/<declared published files>
    content/shared/<id>/<declared published files>
  schemas/*.json
~~~

The bundle excludes draft, unpublished, and retired simulation files. It can retain at most two prior immutable release trees from a verified previous bundle. The deployment manifest records the exact source commit, active and retained release IDs, hashes, sizes, file count, and deterministic bundle digest.

The repository policy currently caps a bundle at 19,000 files, 5 MiB per file, and 1 GiB total. The file-count limit leaves margin under the current Workers Free-plan Static Assets limit. Source simulation rules are more restrictive than Cloudflare's platform maximum.

## Request behavior

`worker/src/index.js` routes through the `ASSETS` binding first so the Worker can enforce headers and implement single byte ranges:

| Path | Cache behavior | Notes |
|---|---|---|
| `/catalog/v1/active.json` | revalidate every request | Mutable active pointer; public CORS |
| `/releases/<release-id>/*` | one year, immutable | Content-addressed release tree |
| `/schemas/*` | one hour, revalidate | Public contracts |
| `/deployment-manifest.json` | no cache | Public provenance; no credentials |
| `/health/v1` | no store | Active release, source commit, digest, file count |

Simulation HTML receives a CSP sandbox without `allow-same-origin`, a fail-closed `frame-ancestors` list, `connect-src 'none'`, no objects/base/child frames, no referrer, restrictive permissions, and cross-origin resource policy. Only exact HTTPS origins (or local HTTP origins for local development) are accepted in `CONTENT_FRAME_ANCESTORS`. Invalid values are discarded.

Contract v1 does not dynamically expand CSP from `capabilities.network_origins`. Adding network access is a structural security change, not a routine content edit.

Unknown paths return a small JSON 404. Unsupported methods return 405. A missing asset binding or invalid deployment manifest returns 503 without configuration detail. Public JSON supports credential-free CORS. The Worker implements a single byte range because direct Static Assets responses do not currently provide partial range responses.

## Local proof

~~~powershell
npm ci
npm run validate
node scripts/build-static-bundle.mjs --content content --output dist-static --source-commit 0000000000000000000000000000000000000000
npm run worker:dry-run
~~~

The dry run uses the exact locked Wrangler version and does not contact or mutate Cloudflare. Unit tests cover active/immutable cache controls, CSP/frame isolation, public CORS, ranges, health provenance, safe errors, publication filtering, rollback retention, budgets, and byte-identical bundles.

## Measurement still required

Local packaging is not a hosting selection. Staging must still measure upload time, deployed file count/bytes, largest-file behavior, cache headers, range behavior, cold/warm latency, rollback, and a representative multi-simulation browser run. Record those results before accepting Static Assets over versioned R2.

Cloudflare references used by this proof:

- <https://developers.cloudflare.com/workers/static-assets/binding/>
- <https://developers.cloudflare.com/workers/static-assets/routing/worker-script/>
- <https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/>
- <https://developers.cloudflare.com/workers/platform/limits/>
