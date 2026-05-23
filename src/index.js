/**
 * @arraypress/feature-matrix
 *
 * Generic comparison-table builder. Declare what each row of the
 * table should show — feature name + how to extract the value from
 * an item — and `buildFeatureMatrix()` applies the definitions to
 * your list of items.
 *
 * Useful for:
 *   - Product comparison tables (compare 2-4 SKUs side-by-side)
 *   - Pricing plan grids (Free / Pro / Enterprise)
 *   - Plugin / font / course feature matrices
 *   - Any "spec sheet" style table where each column is an item and
 *     each row is a feature
 *
 * The output is a flat array of rows shaped for table rendering —
 * one `feature` label + one value per item, in input order.
 *
 * Zero dependencies. Works in Node.js, Cloudflare Workers, Deno,
 * Bun, and browsers.
 *
 * @module @arraypress/feature-matrix
 */

/**
 * @template T
 * @typedef {Object} FeatureRowDef
 * @property {string} feature - Display label for the row.
 * @property {(item: T, index: number) => unknown} extract - Pull the cell value for `item`. Return `undefined` / `null` to render the missing-value placeholder.
 * @property {string} [key] - Optional stable id for the row (useful when consumers need to key React/Astro renders or write tests). Defaults to `feature` if omitted.
 * @property {string} [missing] - Per-row override for the missing-value placeholder. Falls back to the builder's `missing` option.
 * @property {(value: unknown, item: T, index: number) => unknown} [format] - Optional post-transform applied to the extracted value before missing-value coalescing. Useful when extraction is shared but per-row presentation differs.
 */

/**
 * @typedef {Object} FeatureRow
 * @property {string} feature - Display label.
 * @property {string} key - Stable id (defaults to `feature`).
 * @property {unknown[]} values - One value per input item, in input order.
 */

/**
 * @typedef {Object} BuildFeatureMatrixOptions
 * @property {string} [missing='—'] - Placeholder rendered when an extractor returns `undefined` / `null`. Per-row `missing` on a `FeatureRowDef` overrides this.
 */

/**
 * Build a comparison-table row set from a list of items + row
 * definitions.
 *
 * Each definition runs once per item. The returned `FeatureRow[]`
 * is ready for direct table rendering — one cell per item, in
 * input order, with missing values coalesced to the placeholder.
 *
 * @template T
 * @param {T[]} items
 * @param {FeatureRowDef<T>[]} defs
 * @param {BuildFeatureMatrixOptions} [options]
 * @returns {FeatureRow[]}
 *
 * @example
 * const rows = buildFeatureMatrix(
 *   [planFree, planPro, planEnterprise],
 *   [
 *     { feature: 'Price',    extract: p => `$${p.price}/mo` },
 *     { feature: 'Seats',    extract: p => p.seats ?? 'Unlimited' },
 *     { feature: 'Storage',  extract: p => `${p.storageGB} GB` },
 *     { feature: 'SLA',      extract: p => p.sla, missing: 'Best effort' },
 *   ],
 * );
 * // → [
 * //   { feature: 'Price',   key: 'Price',   values: ['$0/mo', '$29/mo', '$99/mo'] },
 * //   { feature: 'Seats',   key: 'Seats',   values: [1, 5, 'Unlimited'] },
 * //   ...
 * // ]
 */
export function buildFeatureMatrix(items, defs, options = {}) {
  if (!Array.isArray(items)) {
    throw new TypeError('[@arraypress/feature-matrix] `items` must be an array');
  }
  if (!Array.isArray(defs)) {
    throw new TypeError('[@arraypress/feature-matrix] `defs` must be an array');
  }

  const globalMissing = options.missing ?? '—';

  return defs.map((def) => {
    const rowMissing = def.missing ?? globalMissing;
    const values = items.map((item, i) => {
      const raw = def.extract(item, i);
      const value = def.format ? def.format(raw, item, i) : raw;
      return value === undefined || value === null ? rowMissing : value;
    });
    return {
      feature: def.feature,
      key: def.key ?? def.feature,
      values,
    };
  });
}

/**
 * Backwards-compatible alias. Newer code should prefer
 * `buildFeatureMatrix` — the rename reflects the broader scope.
 */
export const buildComparisonRows = buildFeatureMatrix;
