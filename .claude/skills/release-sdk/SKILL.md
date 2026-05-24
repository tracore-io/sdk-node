---
name: release-sdk
description: Cut and publish a release of @tracore/sdk from the sdk-node repo. Determines the SemVer bump (major if the API change since the last release was breaking, minor while 0.x; else minor/patch), updates the CHANGELOG and package.json version, confirms the API contract version is current, builds and verifies green, tags, and publishes via the provenance CI workflow. Run locally in Claude Code on the maintainer's machine. Never publishes a dirty tree, unreviewed work, or from a non-main ref.
disable-model-invocation: true
---

# release-sdk — cut and publish @tracore/sdk

Turn a reviewed, merged state of `main` into a published npm release. Publishing yields npm **provenance**, which requires CI/OIDC, so the actual `npm publish` runs in a workflow, never on a laptop.

> **Publishing is NOT wired yet.** `.github/workflows/publish.yml` (a `workflow_dispatch` action with `id-token: write` for provenance), the `@tracore` npm org, and the `NPM_TOKEN` secret are a separate, deferred "enable publishing" task. Until those exist, complete steps 0-5 (the local, reviewable half) and STOP at step 6 — do not attempt a laptop publish. This skill documents the intended end-to-end flow so it is ready the moment publishing is wired.

## Hard rules

- **Never publish a dirty tree.** `git status` must be clean.
- **Never publish unreviewed work.** Release only from a merged, reviewed `main`.
- **Never publish from a non-`main` ref.** Releases come from `main` only.
- **Deprecate, never unpublish** a bad release (`npm deprecate`); publish a fixed version instead.
- Never edit `src/generated/`. Never hand-edit the synced `polish-sdk-pr` skill.

## 0. Preflight

1. On `main`, up to date with origin, working tree clean (`git status`).
2. `pnpm install`, then `pnpm build && pnpm typecheck && pnpm lint` — all green. Stop if anything fails.
3. Confirm the regen PR(s) feeding this release are merged and were reviewed.

## 1. Determine the SemVer bump

- **major** if the API change since the last SDK release was **breaking** — but while the SDK is pre-1.0 (`0.x`), "breaking" maps to a **minor** bump (the 0.x breaking lever; major takes effect at >= 1.0).
- **minor** for additive API changes or new SDK helpers.
- **patch** for bugfixes / doc-only changes with no new surface.

Determine "breaking since last release" from the merged regen PR(s) (the `breaking` flag / migration guide) and the API changelog between the previous and current `.api-version`.

## 2. Confirm the API contract version is current

- `.api-version`, `src/version.ts` (`API_VERSION`), and `package.json#tracoreApiVersion` must all agree (they are kept in lockstep by `sync.yml`). If they drift, stop and reconcile via the regen flow — do not hand-fix.
- Remember: this API contract version is distinct from the SDK package version you are about to bump.

## 3. Update CHANGELOG + package.json version

1. Add a CHANGELOG entry for the new version (Added / Changed / Removed / Fixed), referencing the `api-vX.Y.Z` contract.
2. Set `package.json#version` to the new SemVer (`npm version <level> --no-git-tag-version`).

## 4. Build + verify green

- `pnpm build && pnpm typecheck && pnpm lint` again after the version/CHANGELOG edits. Green only.

## 5. Tag

- Commit the version + CHANGELOG change on `main`, then create an annotated tag `vX.Y.Z` (the SDK package version, distinct from the API `api-vX.Y.Z` tag). Push the tag.

## 6. Publish (CI, provenance)

- Trigger `.github/workflows/publish.yml` via `workflow_dispatch` for the pushed tag. It runs `npm publish --access public --provenance` under `@tracore` with the `NPM_TOKEN` secret and `id-token: write`.
- **Do NOT run `npm publish` from a laptop** — laptop publishes cannot produce provenance.
- After publish: verify `npm i @tracore/sdk@X.Y.Z` installs and the provenance badge shows on npmjs.com.

Stop here. Publishing is the final human act; this skill prepares and triggers it but never bypasses review or the provenance workflow.
