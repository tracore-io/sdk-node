# Changelog

All notable changes to the Tracore TypeScript SDK are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this SDK follows
SemVer. Each entry notes the Tracore API contract version (`api-vX.Y.Z`) it was
built from.

## 0.2.0 — api-v0.6.0

### Added

- `client.extractAsync`: fire-and-forget extract returning the API's 202 accepted
  envelope (`ExtractAcceptedResponse`: `runId` + `pending`) with no follow-up GET,
  so webhook-driven consumers never lose the id of a live run (tracore#36).
- `ERROR_CODES` constant object (+ `ErrorCode` type): client-side synthetic codes
  (`TRANSPORT`, `CONFIG`, `POLLING_TIMEOUT`) plus the server `error.code`
  vocabulary, so retry/breaker layers never restate code strings by hand
  (tracore#38).
- `TracoreError` keeps the underlying error reachable via the standard
  `Error#cause` for failures that never produced an HTTP response (tracore#39).
- Re-exported contract types `ApiErrorCode`, `WebhookEventType`, and
  `WebhookPayload` (typed webhook delivery body) from the regenerated client
  (tracore#38, tracore#40).

### Fixed

- API error responses were being swallowed: the error normalizer expected an
  `err.body` wrapper while the generated client returns the raw
  `{ error: { code, message, details } }` body, so every API failure surfaced as
  a generic 500 "An unexpected error occurred" with no `code`. Errors now carry
  the real HTTP status, `code`, `message`, and `details`.

### Changed

- **Status semantics.** `TracoreError.status` is `0` for failures that never
  produced an HTTP response (network/decoding), with `code` set to
  `ERROR_CODES.TRANSPORT`. Previously such failures surfaced as status 500 or as
  raw non-`TracoreError` exceptions. Callers matching `status >= 500` for retry
  decisions should match `code === ERROR_CODES.TRANSPORT` or `status === 0`
  instead.
- Poll-loop exhaustion now throws status `0` with code
  `ERROR_CODES.POLLING_TIMEOUT` instead of a fabricated HTTP 408. Callers
  matching on `status === 408` must switch to the code.
- Regenerated from api-v0.6.0: the generated types include the `ApiErrorCode` and
  `WebhookPayload` schemas, and `Run.confidence` is declared `format: double`
  (tracore#37, tracore#40).
- `client.extract` documents that retrying it is not idempotent (billed POST +
  follow-up GET); use `client.extractAsync` when you only need the run id.

## 0.1.2 — api-v0.5.0

Fixed ESM entry (`exports.import` / `module` now point at `dist/index.js`).
`0.1.1` is deprecated on npm for the same reason.

## 0.1.0 — api-v0.5.0

Initial release: generated client + ergonomic layer (resource groups, polling,
typed errors, top-level `extract`).
