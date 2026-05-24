---
name: sync-spec
description: Manually re-sync @tracore/sdk to a chosen api-vX.Y.Z without waiting for the api-released dispatch. Pins .api-version (and the lockstep version mirrors), downloads that spec from the public spec repo release asset, regenerates the client, and opens a draft needs-polish PR. Run locally in Claude Code. Mirrors sync.yml by hand; for off-cycle regeneration or recovery from a missed dispatch. Never merges.
disable-model-invocation: true
---

# sync-spec — manual off-cycle regeneration

`sync.yml` does this automatically on the `api-released` dispatch. Use this skill when you need to regenerate by hand: a missed dispatch, recovery, or pinning to a specific past version. It mirrors `sync.yml`'s steps and stops at a draft PR — never merges, never publishes.

## Hard rules

- Never edit `src/generated/` by hand — this skill regenerates it.
- Never merge the resulting PR; it goes through the `polish-sdk-pr` skill + human review like any regen PR.
- Keep the three API-contract-version mirrors in lockstep (`.api-version`, `src/version.ts`, `package.json#tracoreApiVersion`).

## Steps

1. **Choose the target** `api-vX.Y.Z` (a published release in the public spec repo `tracore-io/openapi`).

2. **Pin the contract version** (all three mirrors together):
   - `.api-version` -> `X.Y.Z`.
   - `src/version.ts` -> `export const API_VERSION = 'X.Y.Z';` (keep the header comment).
   - `package.json#tracoreApiVersion` -> `X.Y.Z`.

3. **Download the spec** from the public release asset:
   `https://github.com/tracore-io/openapi/releases/download/api-vX.Y.Z/openapi.yaml` -> `openapi.yaml` (gitignored).
   If the release published an `openapi.yaml.sha256` sidecar, download it and verify `sha256sum openapi.yaml` matches before proceeding; abort on mismatch.

4. **Regenerate**: `pnpm install` then `pnpm generate` (writes `src/generated/`). Then `pnpm build && pnpm typecheck && pnpm lint` — green only.

5. **Open a draft PR** on a branch (e.g. `regen/api-vX.Y.Z`), labeled `needs-polish`, titled `Regenerate from api-vX.Y.Z`, body = the canonical section-8.3 checklist (CI half checked). Set a default SemVer bump (minor if the API change was breaking while 0.x, else patch) — the `polish-sdk-pr` skill refines it.

6. **Stop.** Run `polish-sdk-pr` next, then a human reviews and merges.
