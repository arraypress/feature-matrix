/**
 * @arraypress/feature-matrix — TypeScript definitions.
 */

/** One row in the comparison table. Buyers declare an array of
 *  these and the builder applies them to the list of items. */
export interface FeatureRowDef<T> {
  /** Display label for the row. */
  feature: string;
  /** Pull the cell value for `item`. Return `undefined` / `null`
   *  to render the missing-value placeholder. */
  extract: (item: T, index: number) => unknown;
  /** Optional stable id (useful for React/Astro keys + tests). */
  key?: string;
  /** Per-row override for the missing-value placeholder. Falls
   *  back to the builder's `missing` option. */
  missing?: string;
  /** Optional post-transform applied to the extracted value
   *  before missing-value coalescing. Useful when extraction is
   *  shared but per-row presentation differs. */
  format?: (value: unknown, item: T, index: number) => unknown;
}

/** Output shape — one row per def, with values in input order. */
export interface FeatureRow {
  feature: string;
  key: string;
  values: unknown[];
}

export interface BuildFeatureMatrixOptions {
  /** Placeholder rendered when an extractor returns null/undefined.
   *  Default: `'—'` (em-dash). */
  missing?: string;
}

/**
 * Build a comparison-table row set from a list of items + row
 * definitions. Each definition runs once per item.
 */
export function buildFeatureMatrix<T>(
  items: T[],
  defs: FeatureRowDef<T>[],
  options?: BuildFeatureMatrixOptions,
): FeatureRow[];

/** Backwards-compatible alias for `buildFeatureMatrix`. */
export const buildComparisonRows: typeof buildFeatureMatrix;
