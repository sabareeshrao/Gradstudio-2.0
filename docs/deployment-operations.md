# Content deployment operations

## Trust boundary

Pull-request validation has read-only repository permission and no deployment secret. Staging deployment runs only from the exact current `main` commit, in the GitHub `staging` environment, when `CLOUDFLARE_STAGING_ENABLED` equals `true`. A credential-free preflight job first resolves that environment-scoped variable and exports a boolean job output; only a second job gated on that output can reference the deployment secret. This avoids evaluating an environment variable before GitHub has attached the environment to a job. The workflow repeats the remote-main comparison immediately before deployment and serializes deployments.

The staging workflow has no production Worker name, route, zone, environment, or credential. `gradstudio-content-staging` must live in the separate **GradStudio Non-Production** Cloudflare account.

## Required GitHub environment configuration

Create the repository environment `staging` with:

- environment secret `CLOUDFLARE_API_TOKEN` — steady-state token scoped to the separate non-production account and Workers Scripts edit only;
- environment variable `CLOUDFLARE_ACCOUNT_ID` — separate non-production account ID;
- environment variable `CONTENT_PUBLIC_ORIGIN` — exact HTTPS origin of `gradstudio-content-staging`, with no trailing slash;
- environment variable `CONTENT_FRAME_ANCESTORS` — space-separated exact HTTPS application-staging origins;
- environment variable `CLOUDFLARE_STAGING_ENABLED` — keep `false` until the account, token, origin, and safeguards are verified; then set `true`.

Do not store the token as a repository variable or put it in `wrangler.jsonc`. Do not reuse the production account ID or any production token.

## Automated staging release

On a trusted push to `main`, the workflow:

1. verifies the checkout is still the exact remote-main commit;
2. validates non-production origin/account inputs without printing the token;
3. installs locked dependencies and runs all validation;
4. retrieves the newest unexpired bundle only when its originating staging run succeeded on `main`;
5. builds an immutable bundle for the exact source commit and retains up to two prior releases;
6. publishes a GitHub Actions summary of created, removed, updated, renamed, moved, reordered, published, unpublished, and retired stable IDs;
7. runs a credential-free Wrangler packaging proof;
8. stores the complete bundle, source index, and machine-readable change impact as 90-day GitHub evidence;
9. rechecks remote main;
10. deploys only `gradstudio-content-staging`;
11. verifies health, source commit, bundle digest, active release, and catalog contract.

A false, missing, or malformed gate value completes the preflight without starting the credentialed deployment job. A failed gate blocks deployment. Fork pull requests never execute this workflow and never receive the environment secret.

A retry of the same source commit reuses the prior verified change-impact evidence, excludes the active release from its own retention list, and produces the same deployment manifest and bundle digest byte-for-byte. Serialized staging concurrency plus exact remote-`main` checks before build and deployment prevent an older queued run from publishing over a newer commit.

## Routine and sensitive changes

Routine content changes are manifest/source edits that stay within existing schemas, capabilities, budgets, and published parent relationships. Once staging and production automation are authorized, validated routine changes may deploy automatically.

The following remain sensitive and require explicit review/authorization: workflow or Wrangler changes; token/permission/account/origin changes; schema or compiler semantics; Worker/CSP/sandbox/network capability changes; operational data access; production routes; initial production cutover; and destructive derived-content cleanup.

## Rollback

Before production cutover, rollback must be tested in staging. Two mechanisms are available:

1. Cloudflare Worker version rollback, which restores the previous Worker/Static Assets version.
2. Redeploying a retained, provenance-verified GitHub bundle artifact.

After rollback, run `scripts/verify-deployment.mjs` using the rolled-back commit and digest. Confirm both `/health/v1` and `/catalog/v1/active.json`, then run the browser matrix. Do not guess a release ID or hand-edit live assets.

The manual **Content staging rollback** workflow implements the retained-artifact path. It accepts a successful staging deployment run ID plus the exact source commit, release ID, and bundle digest recorded by that run. It checks that the source run succeeded on `main`, checks out that exact source revision, validates it, downloads only the named staging artifact, verifies every file/hash and both catalog copies, packages without credentials, and deploys only `gradstudio-content-staging`. A mismatched input or changed artifact fails before Wrangler receives credentials. This workflow has no production target and remains unavailable while `CLOUDFLARE_STAGING_ENABLED` is false.

## Manual staging evidence

Record for each staging proof: workflow run URL, source commit, active/retained release IDs, bundle digest, file count/bytes, largest file, upload duration, cache/range/header observations, browser/accessibility results, rollback result, and any Cloudflare limits or cost signals.
