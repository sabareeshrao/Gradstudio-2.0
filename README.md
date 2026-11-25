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

Repository preparation is in progress. No educational content, production pipeline, or production deployment has been created yet.

Before adding content, the approved implementation must establish:

1. versioned schemas for course, section, category, and simulation manifests;
2. globally unique stable IDs that survive rename and move;
3. validation for references, order, safe paths, HTML/assets, accessibility, and browser behavior;
4. a compiled catalog and immutable release manifest;
5. isolated preview/staging and controlled production deployment;
6. rollback, provenance, and release verification.

## Intended source layout

The exact schema is intentionally not finalized in this first preparation commit. The approved direction is:

~~~text
content/
  categories/
  courses/
  sections/
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

Read [AGENTS.md](AGENTS.md) before making changes. No production deployment is authorized by this README or by a content commit.
