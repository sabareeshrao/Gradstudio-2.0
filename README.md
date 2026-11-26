# GradStudio 2.0 educational content

This public repository is the source of truth for all **new** GradStudio simulations, courses, sections, categories, educational metadata, ordering, and publication state.

The library starts fresh. Do not copy or migrate the legacy educational catalog, old R2 simulations, or fallback data from the existing application.

## Repository role

The GradStudio product uses three coordinated repositories:

- [sabareeshrao/Gradstudio](https://github.com/sabareeshrao/Gradstudio) — website UI, backend/API, operational admin surfaces, and application Cloudflare infrastructure.
- **sabareeshrao/Gradstudio-2.0** — this public educational-content repository.
- sabareeshrao/Gradstudio-2.0-Admin — private requirements, implementation tracking, policies, and cross-repository administration documentation.

GitHub is the authoring source of truth. Production will use a deployed, immutable copy of validated content rather than GitHub Pages or request-time GitHub access. Cloudflare Workers Static Assets is the first delivery mechanism to evaluate; versioned R2 publishing remains a fallback if measured limits require it.

## Current status

The fresh Git-authored library, deterministic compiler, immutable Workers Static Assets bundle, independent content Worker, isolated Cloudflare staging deployment, rollback workflow, application catalog adapter, and browser appearance validation are implemented. Staging serves only new content from this repository; no legacy educational catalog was migrated. Routine content pull requests are eligible for trusted automatic merging and staging dispatch only after both credential-free validation workflows pass.

Production remains unchanged and unauthorized. Before production publishing, the project must finish the documented staging regression/rollback evidence, reconcile the private readiness tracker, and receive a separate founder authorization naming the exact application and content releases.

## Intended source layout

The v1 source contract is documented in [docs/content-contract-v1.md](docs/content-contract-v1.md):

~~~text
content/
  categories/<stable-id>/category.json
  courses/<stable-id>/course.json
  sections/<stable-id>/section.json
  shared/<stable-id>/asset.json
  simulations/
    <stable-simulation-id>/
      simulation.json
      index.html
      assets/
schemas/
scripts/
tests/
.github/workflows/
~~~

Folder names are organizational. Manifest IDs are identity. Renaming or moving a folder must not change the corresponding stable ID.

## Administration model

ChatGPT/Codex connected to GitHub will be the founder's everyday content administrator. Natural-language requests will create, update, rename, move, reorder, publish, unpublish, and retire content through normal Git changes. Validation and eligible routine deployment will be automated after the security, environment, schema, and pipeline gates in the private master tracker are complete.

Use unpublish/retire plus Git history for normal removal. Never place credentials, customer records, student progress, payments, private analytics, access tokens, or administrative secrets in this public repository.

Read [AGENTS.md](AGENTS.md) before making changes. For AI lesson authoring, GitHub Pages preview links, exact dark-mode palette and chat-to-HTML fidelity, follow the [lesson creation and Pages handover](docs/lesson-pages-handover.md). For daily natural-language operations, follow [docs/prompt-operations.md](docs/prompt-operations.md). Validate locally with `npm ci && npm run validate`.

The delivery implementation is documented in [docs/static-assets-worker.md](docs/static-assets-worker.md), and staging/release controls are documented in [docs/deployment-operations.md](docs/deployment-operations.md).

No production deployment is authorized by this README or by a content commit.
