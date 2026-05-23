# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] — Unreleased

### Initial Release

- `buildFeatureMatrix(items, defs, options?)` — apply declarative
  row definitions to a list of items. Returns a flat
  `FeatureRow[]` ready for table rendering.
- `FeatureRowDef<T>` — `{ feature, extract, key?, missing?, format? }`.
  The buyer writes one entry per column they want to compare.
- Per-row + global `missing` placeholder (`'—'` by default).
- Optional `format(value, item, index)` post-transform for shared
  extraction + per-row presentation.
- Optional `key` for stable row ids (React/Astro `key={...}`).
- Backwards-compatible alias `buildComparisonRows` so existing
  call sites named after the WaveGrid theme's util keep working.

18 tests passing under Node's built-in runner. ESM-only, zero
dependencies.
