#!/usr/bin/env bash
# Verify the publishable package BEFORE it ships:
#   1. publint  - exports/main/module/types point at files the build actually emits
#                 and ESM/CJS resolution is correct (catches the 0.1.1 dist/index.mjs bug).
#   2. pack + import smoke - a real install of the tarball resolves via both
#                 CJS require() and ESM import().
# Run after `pnpm build` (expects dist/ to exist). Used by CI (on PRs) and by
# publish.yml (pre-publish gate), and runnable locally via `pnpm verify:package`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> publint (strict)"
npx --yes publint@latest --strict

echo "==> pack + import smoke (CJS require + ESM import)"
TARBALL="$ROOT/$(npm pack --silent | tail -1)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP" "$TARBALL"' EXIT
(
  cd "$TMP"
  npm init -y >/dev/null 2>&1
  npm install "$TARBALL" >/dev/null 2>&1
  node -e "if (!require('@tracore/sdk').TracoreClient) { throw new Error('CJS require: TracoreClient missing'); }"
  node --input-type=module -e "const m = await import('@tracore/sdk'); if (!m.TracoreClient) { throw new Error('ESM import: TracoreClient missing'); }"
)
echo "==> package verify passed (publint + ESM/CJS import)"
