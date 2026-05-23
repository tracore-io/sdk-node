---
name: polish-sdk-pr
description: Complete the human-judgement half of an SDK regeneration PR. Run locally in Claude Code inside an SDK repo (sdk-node / sdk-python / sdk-go / sdk-php) after the api-released pipeline opens a draft "Regenerate from api-vX.Y.Z" PR labeled needs-polish. Writes examples, helpers, README refresh, CHANGELOG, and a migration guide (breaking only), confirms the version bump, then flips the PR to ready-for-review. Never merges, never publishes.
disable-model-invocation: true
---

# polish-sdk-pr — finish an SDK regen PR

The `api-released` pipeline (in `tracore-io/tracore`) regenerates the client and opens a **draft** PR titled `Regenerate from api-vX.Y.Z`, labeled `needs-polish`. CI has done all the free mechanical work — codegen, version pin, mock tests. This skill does the half a machine should not: prose and judgement. It runs **locally on the maintainer's Claude subscription**, inside the SDK repo.

This is the canonical source. It is synced read-only into each SDK repo at `.claude/skills/polish-sdk-pr/SKILL.md` by `sync-sdk-skill.yml`. Edit only the copy in `tooling/sdk-skills/polish-sdk-pr/SKILL.md` in the monorepo; never hand-edit the synced copies.

## Hard rules

- **Never merge.** Review and merge are human acts.
- **Never publish.** Publishing is a separate human-triggered `workflow_dispatch`.
- **Never edit generated code.** Files under the generated dir (`src/generated/` | `tracore/generated/` | `internal/generated/` | `src/Generated/`) carry a `DO NOT EDIT` header and are owned by codegen. Extend only the hand-written ergonomic layer.
- **Stay inside the open draft PR's branch.** Do not open new PRs, retarget, or rebase onto unrelated work.
- Match the repo's existing style, naming, and idioms. Read neighbouring code before writing.
- No emojis anywhere — code, comments, examples, README, CHANGELOG, PR notes.

## 0. Orient

Before changing anything:

1. Find the open draft PR titled `Regenerate from api-vX.Y.Z` (the one labeled `needs-polish`). If none, stop and say so.
2. Read its body: the `§8.3` checklist (CI half checked) and the `diff_summary` carried from the release dispatch (`client_payload.diff_summary`). If the body lacks the diff summary, read the release notes for `api-vX.Y.Z` in `tracore-io/tracore`.
3. Read `.api-version` and the manifest to confirm the pinned API version and the default version bump CI wrote.
4. Skim the generated dir to learn the new/changed surface, and the hand-written ergonomic layer to learn the existing patterns (resource grouping, polling helper, pagination helper, typed errors, top-level `extract`).

Determine `breaking` from the PR (the `api:`-style classification / the dispatch `breaking` flag). It changes two things: the migration-guide item becomes required, and the version-bump expectation (see step 5).

## 1. Examples for new and changed endpoints

For every endpoint added or changed in `diff_summary`, add or update a runnable example in the repo's examples location (match where existing examples live). Mirror the ergonomic contract — call through the resource group (`client.workspaces`, `.schemas`, `.documents`, `.runs`, `.webhooks`, `.environments`, `.user`), not the raw generated client. Keep examples idiomatic for the language. Do not invent endpoints that are not in the spec.

## 2. Extend helpers only where the pattern fits

If a change naturally extends an existing helper (polling, pagination, typed-error normalization, the top-level `extract` convenience), extend it following the established pattern. Do **not** invent new abstractions, new helper families, or speculative generality. When the existing pattern does not fit cleanly, leave a brief note in the PR rather than forcing it — helper ergonomics for scaffold repos are deferred until they graduate to published.

## 3. Refresh the README if examples went stale

If the README's quickstart or examples reference endpoints, fields, or signatures the regen changed, update them so they type-check / run against the current generated client and `api.tracore.io`. Leave the README untouched if nothing it shows changed.

## 4. CHANGELOG entry from diff_summary

Add a CHANGELOG entry for this version derived from `diff_summary`: group as Added / Changed / Removed / Fixed, human-readable, referencing the pinned `api-vX.Y.Z`. Keep it terse and factual.

## 5. Confirm or adjust the version bump

CI wrote a **default** bump: `major` if breaking (at >= 1.0) else `minor`. Reconcile against reality:

- **Pre-1.0 reconciliation:** while the SDK is `0.x`, a breaking API change maps to a **minor** bump (the `0.x` breaking lever), not major. The major rule takes effect at `>= 1.0`. (See the repo's CONTRIBUTING.)
- The skill may refine `minor` <-> `patch` for helper-only or doc-only changes that carry no new generated surface.
- Confirm the manifest version field and the pinned `tracore api_version` agree with `.api-version`.

## 6. Migration guide (breaking releases only)

If the release is breaking, add a migration guide (in the repo's docs/migration location) with concrete **before / after** snippets for each breaking change drawn from `diff_summary`. Skip this entirely for additive releases.

## 7. Flip the PR to ready

Only after steps 1-6:

1. Check the boxes in the PR body's "To do" half, each with a brief note on what was done (or why it was skipped — e.g. "no README examples affected").
2. Swap the label `needs-polish` -> `ready-for-review`.
3. Mark the draft PR **ready for review**.
4. Leave a short summary comment listing what changed and the confirmed version bump.

Then stop. A human reviews and merges; a human triggers publish. **The skill never merges and never publishes.**

## Canonical draft-PR checklist (spec section 8.3)

CI fills the left ("Done") half before the PR opens; this skill fills the right ("To do") half.

```
Done by CI (free, no AI):        To do (polish skill, local subscription):
[x] .api-version pinned          [ ] examples for new/changed endpoints
[x] spec downloaded              [ ] extend helpers if the pattern fits
[x] codegen ran                  [ ] refresh README if examples are stale
[x] mock tests pass              [ ] CHANGELOG entry from diff_summary
[x] default version bump set     [ ] confirm/adjust version bump
                                 [ ] migration guide (breaking releases only)
```
