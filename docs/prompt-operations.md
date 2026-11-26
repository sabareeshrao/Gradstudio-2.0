# Prompt-driven content operations

Use stable IDs in every report. A successful commit is not a deployment claim.

## Create

Prompt: “Create a new simulation under course X, section Y as lesson 3, but keep it unpublished.”

1. Confirm parent stable IDs.
2. Assign a new globally unique `sim-...` ID.
3. Create the stable-ID directory, manifest, entry point and declared local assets.
4. Set `order: 3`, `status: unpublished`, empty network capabilities unless separately approved.
5. Validate schemas, references, sibling order/slug, runtime safety and reproducibility.
6. Report files, ID, status, impact and Git evidence.

## Rename

Change `title` and/or `slug`; preserve ID and stable directory. Add the old slug to `redirect_from` when links may exist. Do not reorder or move unless requested.

## Move

Change parent IDs while preserving the entity ID. For a simulation, `course_id` must match its target section's course. Resolve only the target sibling order; verify unrelated siblings are unchanged.

## Reorder

Change `order` only for the smallest affected sibling set. Orders must be unique within their parent. The impact report must list only intended stable IDs.

## Update

Change only requested manifest/source/assets. All simulation files must be declared. New network/runtime capabilities require structural/security review.

## Publish

Set `status: published` only when every ancestor is published and all validation passes. Publishing source does not authorize or prove a Cloudflare production release.

## Unpublish or retire

- Use `unpublished` for reversible temporary removal.
- Use `retired` for intentional end-of-life.

Keep source in Git unless explicit removal is requested. Never delete customer progress or operational records; they do not belong here.

## Remove source

Require the exact stable ID and confirm the desired status first. Prefer retire. If source removal is explicit, remove only that stable-ID directory, run reference/impact checks, and state that Git can restore it. Do not delete derived production assets without separate authorization.

## Required completion report

- natural-language request summary;
- stable IDs and exact files changed;
- impact categories;
- schema/compiler/tests result;
- commit/PR link;
- committed, staged and production states separately;
- rollback commit/release, if any;
- any sensitive approval or deployment still required.

For eligible routine content-only pull requests, the report may include an automatic merge and staging result after both validation workflows pass. Never request a manual merge for such a change. Changes to schemas, compilers, workflows, delivery code, permissions, or production still require the protected path.
