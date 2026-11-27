# AI handover — lesson creation, GitHub Pages and appearance

Founder-approved working instructions, 2026-11-26. Read alongside [AGENTS.md](../AGENTS.md), [content contract](content-contract-v1.md), [prompt operations](prompt-operations.md), and [deployment operations](deployment-operations.md). These rules govern new lessons and updates, including idea cards, theory cards, application knowledge, interview lessons and simulations.

## Rule 1 — Correct repository and file location

Canonical repository: https://github.com/sabareeshrao/Gradstudio-2.0 (default branch: main).

Create every new lesson at:

~~~text
content/simulations/sim-<unique-stable-id>/
  index.html
  simulation.json
  <declared local CSS, JS, images or other assets, when needed>
~~~

Do not publish new lessons to Gradstudio, Gradstudio-Version-2.0 or Testing-Ui-Simulations as the canonical destination. Do not create loose duplicate HTML files at the repository root. Do not overwrite an existing lesson unless requested. Inspect the existing course/section manifests, stable IDs, slugs and sibling orders before assigning metadata. Use the requested category; if no category is specified, use the most relevant existing course/section or the existing Latest Additions category (cat-latest-additions) for a new uncategorized export. Preserve identity and unrelated lessons. Use a safe unique stable ID and declare all local assets.

Example manifest (illustrative; inspect existing IDs and order before writing):

~~~json
{
  "schema_version": 1,
  "kind": "simulation",
  "id": "sim-example-idea",
  "title": "Example — Idea-Based Learning",
  "slug": "example-idea",
  "order": 100,
  "status": "published",
  "access": {"display": "open"},
  "course_id": "course-machine-learning",
  "section_id": "section-machine-learning",
  "entrypoint": "index.html",
  "assets": [],
  "capabilities": {"network_origins": []}
}
~~~

Use published status for a requested public lesson only when ancestors are published and validation passes. Draft/unpublished content must not be represented as published. GitHub Pages is public and does not enforce application catalog status or entitlements; do not place private information in this repository.

## Rule 2 — GitHub Pages links

Pages is a public preview, not GradStudio production. The existing deployment builds main. Settings: https://github.com/sabareeshrao/Gradstudio-2.0/settings/pages (Deploy from a branch, main, / (root)). Do not change hosting, workflow, security or production settings merely to create a lesson.

Always give the direct lesson URL, not only the repository or PR:

~~~text
https://sabareeshrao.github.io/Gradstudio-2.0/content/simulations/<stable-id>/
~~~

For example:

- GPU idea cards: https://sabareeshrao.github.io/Gradstudio-2.0/content/simulations/sim-gpu-idea-driven/
- Source: https://github.com/sabareeshrao/Gradstudio-2.0/blob/main/content/simulations/sim-gpu-idea-driven/index.html

Use the actual entrypoint if it is not index.html. When checking stale content, add ?v=<actual-merged-commit-sha> to the direct URL; a cache-busting parameter does not itself prove deployment. Do not invent a Pages path before checking the committed location.

## Rule 3 — Exact background palette

The founder explicitly corrected the earlier mistake: **only the PAGE is pure black; CARDS must NOT be pure black**.

| Element | Dark mode |
|---|---|
| Page, html, body and outer reading area | #000000 |
| Main lesson card / article / panel | #212121 |
| Neutral secondary panel / nested content surface | #2B2B2B |
| Card border | #424242 |
| Primary text | #ECECEC |
| Secondary text / caption | #B4B4B4 |

No brownish, blue-tinted or shaded page black, no fog/gradient on the page, and no black cards. Distinguish neutral UI surfaces from educational diagram colors, active/idle states, syntax highlighting and warning/error/success accents. Do not globally recolor SVG fills or stateful components. Maintain the existing light-mode contract: white page and cards, dark readable text, suitable light secondary surfaces; respond to prefers-color-scheme including in the app iframe. Do not force dark mode over the user's selected light mode.

Reference CSS (adapt selectors to actual markup; place after conflicting rules or consolidate existing CSS; do not duplicate IDs):

~~~css
:root {
  color-scheme: light dark;
  --bg: #ffffff;
  --card: #ffffff;
  --panel: #ffffff;
  --surface: #f5f5f5;
  --soft: #f5f5f5;
  --text: #171717;
  --muted: #626262;
  --line: #dedede;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #000000;
    --card: #212121;
    --panel: #212121;
    --surface: #2b2b2b;
    --soft: #2b2b2b;
    --text: #ececec;
    --muted: #b4b4b4;
    --line: #424242;
  }
}
html, body { background: var(--bg); color: var(--text); }
main { background-color: var(--bg); }
.card { background: var(--card); border: 1px solid var(--line); }
~~~

This is a palette contract, not a mandate to rewrite layout or introduce extra boxes. Respect the original lesson structure. For an appearance-only update, preserve the existing HTML body, diagram geometry, text, scripts and assets unless a specific correction is requested.

## Rule 4 — Chat-to-HTML fidelity

Reproduce the actual final chat lesson, not a simplified reinterpretation. Preserve every requested card, heading, paragraph break, caption, code block, color, SVG shape, path, arrowhead, dotted connector, opacity, label, position and original interaction. Keep the original diagram viewBox and geometry; do not replace orthogonal lines with diagonal lines, omit arrows, or redraw figures from memory. Preserve text and diagram proportions, compact spacing, readable typography and responsive single-column layout. Avoid bulky cards, giant diagrams, extra progress indicators, prompt transcripts, assistant commentary and unnecessary labels. Title the page with the topic. Keep code highlighting and keyboard behavior intact. Static original cards remain static; interactive originals must remain functional. For GradStudio content, scripts belong in declared local JS files: no inline scripts, inline event handlers, external network dependencies or sandbox weakening. Do not claim pixel-perfect parity if the original or a rendered comparison is unavailable.

## Rule 5 — Idea-Based Learning

When the founder asks how many idea cards, propose the count and sequence first. On "Create", build the agreed count as a continuous first-principles invention journey: original problem → initial idea → experiment → limitation → next improvement → transferable engineering principle. Recreate why the technology would be invented instead of starting with definitions or a feature list. Use compact, meaningful SVG experiments and beginner-friendly explanations; distinguish a logical reinvention from documented historical fact. Preserve the chat lesson exactly when exporting. Do not silently create additional lessons or categories.

## Rule 6 — Completion and verification

1. Read AGENTS.md and this handover. Inspect the actual repository and target source before editing.
2. Create or update the lesson and manifest on a review branch. Preserve unrelated work and stable IDs. Confirm exact card, diagram and interaction counts against the original chat.
3. Run the current content validation and appearance workflows. Use the existing routine content auto-merge path for eligible content-only PRs; do not bypass checks. Do not weaken validation to hide a failure. Structural changes require the protected review path.
4. Verify desktop and mobile, light and dark. In dark mode, inspect computed styles separately for body (#000000), ordinary lesson cards (#212121) and applicable neutral secondary surfaces (#2b2b2b). In light mode verify the white reading surface and legibility. Check actual SVG geometry and interactive behavior, not only screenshot dimensions or card counts. A page-background-only test is not proof that card backgrounds match.
5. Confirm the exact merged main SHA and successful Pages build/deployment for that revision. Check the live direct URL returns the lesson (not a 404 or GitHub source page), and when possible confirm the served HTML and rendered card palette. Use a versioned URL or hard refresh to diagnose caching. If live rendering is not accessible, explicitly state that limitation; a successful build alone does not prove visual fidelity.
6. Give direct clickable Pages URL(s) for every requested lesson, source/PR links, validation status, merged commit, and Pages status. Distinguish committed, merged, deployed and visually verified. Never tell the founder a page is live or matches the chat without evidence. Do not claim production deployment; it requires separate authorization.

## Copyable handover prompt

Read and follow https://github.com/sabareeshrao/Gradstudio-2.0/blob/main/docs/lesson-pages-handover.md and the repository AGENTS.md. Create the requested lesson in the canonical content/simulations/sim-<stable-id>/ directory with its manifest and declared local assets. Preserve all chat content, visual fidelity and interactions. Dark mode: page #000000, cards #212121, secondary panels #2B2B2B; support the existing light mode. Validate, merge through the approved workflow, verify GitHub Pages deployment and give the direct lesson URL with truthful status. Do not modify production.
