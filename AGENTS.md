# GradStudio 2.0 content repository instructions

These instructions apply to the entire sabareeshrao/Gradstudio-2.0 repository.

## Repository role

This public repository is the only source of truth for all **new** GradStudio educational content: categories, courses, sections, simulations, educational metadata, ordering, and publication state.

Do not copy or migrate old educational content from sabareeshrao/Gradstudio, old R2 objects, the experimental Gradstudio-Version-2.0 repository, backups, D1, or production. Create the new library from scratch only when the founder requests content.

The other repositories are:

- sabareeshrao/Gradstudio — application UI, backend/API, authentication, operational admin, and application Cloudflare configuration.
- sabareeshrao/Gradstudio-2.0-Admin — private requirements, master tracker, administration policy, and cross-repository decisions.

Do not move application UI or backend code into this repository. A simulation's own HTML/CSS/JS is educational content and belongs here; shared website navigation, branding, accounts, payments, and operational UI do not.

## Read before changing anything

1. Read this file and README.md. For all lesson creation, chat exports, appearance changes and GitHub Pages links, also read [docs/lesson-pages-handover.md](docs/lesson-pages-handover.md) and follow its rules (pure black page, dark gray cards, fidelity and deployment verification).
2. Read the current schema, validation, and workflow documentation once those files exist.
3. Check the private master implementation tracker and latest founder decision for any change involving architecture, schema, deployment, or repository boundaries.
4. Inspect Git status/current branch and preserve unrelated work.
5. Confirm the requested target by stable ID, not only by title, slug, folder, or display position.

## Content rules

- Git is canonical. Live assets and any D1 catalog are derived copies and must never become independently editable sources.
- IDs are globally unique, immutable identity. Rename, move, and reorder operations preserve IDs.
- Slugs, titles, folder names, parent relationships, display order, and publication state are editable metadata.
- References use stable IDs. Reject missing parents, duplicates, cycles, unsafe paths, and accidental unrelated reordering.
- Keep source deterministic and reproducible. Generated catalogs/releases must identify the source commit and schema/compiler version.
- Keep every change trackable and reversible through Git.
- Normal deletion means unpublish/retire and remove source in a reviewable commit; history remains available for rollback. Never delete operational student or customer records from this repository.
- Do not add credentials, deploy tokens, customer data, student progress, payment data, private analytics, or private administration details. This repository is public.
- Public content may be copied. Website access controls govern the GradStudio experience, not secrecy of this repository.
- Do not depend on GitHub Pages for production.
- Do not modify the existing GradStudio application repository as part of a content request unless the task explicitly includes a coordinated application change.
- Do not deploy or mutate Cloudflare production resources without explicit founder authorization. A content commit is not deployment authorization.

## Prompt-driven operations

For natural-language administration:

- **Create:** assign a new stable ID, add the manifest and assets, link the requested parent IDs, and set explicit publication state/order.
- **Rename:** change human-facing title/slug/path as requested; preserve ID and update validated references/redirect metadata if the contract requires it.
- **Move:** change the parent relationship and organizational path; preserve ID; verify no unrelated order changes.
- **Reorder:** change explicit order fields only for the smallest affected sibling set; use deterministic tie rules.
- **Update:** modify requested source/metadata and test the affected simulation.
- **Publish/unpublish:** change explicit publication metadata; never infer publication from a folder's existence.
- **Delete:** default to unpublish/retire, explain the Git-recoverable removal, and require explicit scope for any derived-production cleanup.

Report the exact files, stable IDs, validation result, commit/review link, deployment state, and rollback reference. Never claim a change is live merely because it is committed.

## Validation gates

Until scripts are implemented, do not invent or bypass them. The approved validation suite must cover:

- manifest JSON Schema and supported schema version;
- unique IDs/slugs and valid parent/reference graph;
- safe relative paths, case-collision detection, and file existence;
- deterministic ordering and catalog compilation;
- no secrets or prohibited operational data;
- HTML/CSS/JavaScript syntax and prohibited/unsafe behavior;
- asset links, size/count budgets, and content hashes;
- simulation browser smoke tests at desktop and mobile widths;
- accessibility and keyboard basics;
- iframe sandbox/CSP/postMessage contract compatibility;
- compiled release and catalog reproducibility.

A failed validation blocks publishing. Do not weaken tests or schemas to accommodate invalid content without an approved contract change.

## Delivery model

The intended deployment is an independent content Worker using Cloudflare Workers Static Assets, evaluated with a representative proof of concept before selection. The application Worker remains independently deployable and consumes a versioned content catalog/service. Versioned R2 synchronization is the fallback if measured static-asset constraints require it. GitHub Pages is not part of production.

Pull-request validation must not receive production secrets. Deployment must use trusted commits, least-privilege environment-specific credentials, concurrency control, immutable revisions, staging verification, and rollback. Production remains blocked until the private tracker's security and readiness gates pass and the founder explicitly authorizes it.

Delivery source paths:

- `scripts/build-static-bundle.mjs` and `scripts/lib/static-bundle.mjs` assemble deployable public files.
- `config/static-assets-policy.json` is the conservative repository bundle budget.
- `worker/src/index.js` applies cache, CORS, CSP, range, health, and safe-error behavior around the `ASSETS` binding.
- `wrangler.jsonc` contains local, development, and staging names only. Do not add a production environment before the approved cutover phase.
- `.github/workflows/content-validation.yml` is credential-free PR validation.
- `.github/workflows/content-staging.yml` is trusted-main staging automation and must remain gated by the GitHub `staging` environment variable `CLOUDFLARE_STAGING_ENABLED`.

Do not weaken `sandbox` or add `allow-same-origin`. Content contract v1 deliberately enforces `connect-src 'none'`; a non-empty `network_origins` manifest is sensitive/structural and remains blocked at runtime until an approved per-simulation CSP contract is implemented.

## Documentation maintenance

Update README.md and the relevant contract documentation whenever layout, schema, administration semantics, delivery behavior, or repository ownership changes. Keep examples synthetic until the founder requests the first real new content. Do not introduce legacy examples that could later be mistaken for approved content.
