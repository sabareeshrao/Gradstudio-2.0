# GradStudio content source contract v1

This repository contains only new educational source. The current `content/` library is empty; files under `tests/fixtures/` are synthetic validation fixtures and are never publishable content.

## Source layout

~~~text
content/
  categories/<cat-id>/category.json
  courses/<course-id>/course.json
  sections/<section-id>/section.json
  shared/<asset-id>/
    asset.json
    <declared public assets>
  simulations/<sim-id>/
    simulation.json
    index.html
    <declared local assets>
~~~

The stable ID directory and manifest filename are fixed. Rename changes `title`/`slug` and optionally adds the prior slug to `redirect_from`; identity never changes.

## Manifest types

Every manifest has `schema_version: 1`, a `kind`, immutable globally unique `id`, human-facing `title` and `slug`, explicit non-negative integer `order`, and explicit `status`.

| Kind | ID prefix | Parent fields | Schema |
|---|---|---|---|
| Category | `cat-` | optional `parent_id` | `schemas/category-v1.schema.json` |
| Course | `course-` | `category_id`, optional `parent_course_id` | `schemas/course-v1.schema.json` |
| Section | `section-` | `course_id` | `schemas/section-v1.schema.json` |
| Simulation | `sim-` | `course_id`, `section_id` | `schemas/simulation-v1.schema.json` |
| Shared asset pack | `asset-` | none; simulations use `shared_asset_ids` | `schemas/asset-pack-v1.schema.json` |

References always use IDs. Category/course parent cycles, missing parents, section/course mismatch, duplicate sibling slugs/orders, duplicate IDs, and unsupported schema versions fail validation.

Courses, sections and simulations carry explicit `access.display` metadata: `open` or `locked`. Locked items require an `entitlement_key`. This metadata controls the GradStudio user experience; it does not make public source/assets secret or authorize a user. Application APIs remain responsible for entitlements and operational access decisions.

## Publication lifecycle

- `draft`: source under construction; absent from public catalog.
- `published`: present in public catalog only when all ancestors are also published.
- `unpublished`: temporarily removed from public catalog, retained in Git/source.
- `retired`: intentionally withdrawn; retained in Git/source and reported distinctly.

Normal delete prompts mean unpublish or retire. Removing source is Git-recoverable but requires an explicit request; derived production cleanup is separately authorized.

## Simulation runtime contract

`entrypoint` and every `assets` item must be safe relative paths inside the stable simulation directory. Every file must be declared, exist, and have no case collision. Limits are 500 files, 5 MiB per file, and 25 MiB per simulation.

The v1 validator rejects:

- inline scripts and inline event handlers;
- external asset/script/form references;
- iframes, object/embed/applet/base and meta refresh;
- cookie or parent/top browsing-context access;
- `eval`/dynamic functions;
- undeclared network APIs when `capabilities.network_origins` is empty;
- unsafe paths, missing/undeclared files, credential signatures, and JavaScript syntax errors.
- symbolic links, so declared assets cannot resolve outside their content directory.

`network_origins` defaults to an empty list and accepts HTTPS origins only. Adding a non-empty capability is structural/sensitive review work and does not itself change the Content Worker CSP until the release architecture explicitly supports it.

## Deterministic compilation

~~~powershell
npm ci
npm test
node scripts/compile-content.mjs --content content --output dist --source-commit <40-hex-commit>
~~~

Outputs:

- `catalog.json`: published entities, immutable release ID/base URL, source commit, compiler version, source paths and manifest hashes.
- `release-manifest.json`: all source records including non-public statuses, source digest, catalog file hash, and every simulation asset hash/size.
- `change-impact.json`: created, removed, updated, renamed, moved, reordered, published, unpublished and retired stable IDs compared with `--base-manifest` when supplied.

The release ID is derived from source commit plus deterministic source digest. Independent builds of the same source/commit must be byte-identical. Generated `dist/` is a CI/release artifact, not tracked authoring source.

`catalog_sha256` hashes the canonical catalog payload before that field is added, avoiding a self-referential digest. `catalog_file_sha256` in the release manifest hashes the final catalog bytes.

## Version policy

Additive optional fields may remain schema v1. Field removal/rename, semantic/type change, ID rule change, publication behavior change, or security-capability change requires new schemas and an approved compatibility plan. Old content is not migrated; future schema changes apply only to new-source manifests in this repository.

## Validation boundary

Pull requests receive read-only repository permission and no deployment secret. Validation compiles synthetic fixtures and the actual library, runs negative security/graph/path fixtures, proves reproducibility, scans content/schema credential signatures, and audits locked dependencies. There is no deployment job yet.
