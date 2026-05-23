import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFeatureMatrix, buildComparisonRows } from '../src/index.js';

// ── Sample data ────────────────────────────

const PLANS = [
  { name: 'Free', price: 0,  seats: 1,         storageGB: 1,   sla: null },
  { name: 'Pro',  price: 29, seats: 5,         storageGB: 50,  sla: '99.5%' },
  { name: 'Ent.', price: 99, seats: 'Unlim.',  storageGB: 500, sla: '99.95%' },
];

// ── Basic ──────────────────────────────────

describe('buildFeatureMatrix — basic', () => {
  it('returns one row per def', () => {
    const rows = buildFeatureMatrix(PLANS, [
      { feature: 'Price', extract: p => `$${p.price}/mo` },
      { feature: 'Seats', extract: p => p.seats },
    ]);
    assert.equal(rows.length, 2);
  });

  it('each row has feature + key + values in input order', () => {
    const rows = buildFeatureMatrix(PLANS, [
      { feature: 'Price', extract: p => p.price },
    ]);
    assert.equal(rows[0].feature, 'Price');
    assert.equal(rows[0].key, 'Price');           // defaults to feature
    assert.deepEqual(rows[0].values, [0, 29, 99]);
  });

  it('honours an explicit key', () => {
    const rows = buildFeatureMatrix(PLANS, [
      { feature: 'Price ($/mo)', extract: p => p.price, key: 'price' },
    ]);
    assert.equal(rows[0].key, 'price');
    assert.equal(rows[0].feature, 'Price ($/mo)');
  });

  it('passes the index to the extractor', () => {
    const indices = [];
    buildFeatureMatrix(PLANS, [
      { feature: 'X', extract: (_p, i) => { indices.push(i); return null; } },
    ]);
    assert.deepEqual(indices, [0, 1, 2]);
  });
});

// ── Missing values ─────────────────────────

describe('buildFeatureMatrix — missing values', () => {
  it('uses the default em-dash placeholder', () => {
    const rows = buildFeatureMatrix(PLANS, [
      { feature: 'SLA', extract: p => p.sla },
    ]);
    assert.deepEqual(rows[0].values, ['—', '99.5%', '99.95%']);
  });

  it('honours a global missing override', () => {
    const rows = buildFeatureMatrix(PLANS, [
      { feature: 'SLA', extract: p => p.sla },
    ], { missing: 'N/A' });
    assert.deepEqual(rows[0].values, ['N/A', '99.5%', '99.95%']);
  });

  it('per-row missing wins over global', () => {
    const rows = buildFeatureMatrix(PLANS, [
      { feature: 'SLA',   extract: p => p.sla, missing: 'Best effort' },
      { feature: 'Other', extract: () => null },
    ], { missing: 'N/A' });
    assert.equal(rows[0].values[0], 'Best effort');
    assert.equal(rows[1].values[0], 'N/A');
  });

  it('coalesces null AND undefined to placeholder', () => {
    const rows = buildFeatureMatrix(
      [{ a: 0 }, { a: null }, { a: undefined }, { a: false }, { a: '' }],
      [{ feature: 'A', extract: x => x.a }],
    );
    /* Falsy values that AREN'T null/undefined should pass through. */
    assert.deepEqual(rows[0].values, [0, '—', '—', false, '']);
  });
});

// ── Format hook ────────────────────────────

describe('buildFeatureMatrix — format hook', () => {
  it('applies format() to the extracted value', () => {
    const rows = buildFeatureMatrix(PLANS, [
      {
        feature: 'Price',
        extract: p => p.price,
        format: v => v === 0 ? 'Free' : `$${v}/mo`,
      },
    ]);
    assert.deepEqual(rows[0].values, ['Free', '$29/mo', '$99/mo']);
  });

  it('format() runs before missing-value coalescing', () => {
    const rows = buildFeatureMatrix(PLANS, [
      {
        feature: 'SLA',
        extract: p => p.sla,                          // returns null for free plan
        format: v => v ? `Uptime: ${v}` : undefined,  // null → undefined → '—'
      },
    ]);
    assert.deepEqual(rows[0].values, ['—', 'Uptime: 99.5%', 'Uptime: 99.95%']);
  });

  it('format() receives item + index', () => {
    const passed = [];
    buildFeatureMatrix(PLANS, [
      {
        feature: 'X',
        extract: p => p.name,
        format: (v, item, i) => { passed.push([v, item.name, i]); return v; },
      },
    ]);
    assert.deepEqual(passed, [
      ['Free', 'Free', 0],
      ['Pro',  'Pro',  1],
      ['Ent.', 'Ent.', 2],
    ]);
  });
});

// ── Edge cases ─────────────────────────────

describe('buildFeatureMatrix — edge cases', () => {
  it('returns empty array for empty defs', () => {
    assert.deepEqual(buildFeatureMatrix(PLANS, []), []);
  });

  it('returns rows with empty values arrays for empty items', () => {
    const rows = buildFeatureMatrix([], [
      { feature: 'Price', extract: p => p.price },
    ]);
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0].values, []);
  });

  it('throws on non-array items', () => {
    assert.throws(() => buildFeatureMatrix(null, []), /`items` must be an array/);
  });

  it('throws on non-array defs', () => {
    assert.throws(() => buildFeatureMatrix([], null), /`defs` must be an array/);
  });
});

// ── Backwards-compat alias ─────────────────

describe('buildComparisonRows alias', () => {
  it('is the same function as buildFeatureMatrix', () => {
    assert.strictEqual(buildComparisonRows, buildFeatureMatrix);
  });

  it('works identically', () => {
    const rows = buildComparisonRows(PLANS, [
      { feature: 'Seats', extract: p => p.seats },
    ]);
    assert.deepEqual(rows[0].values, [1, 5, 'Unlim.']);
  });
});

// ── Generic type usage (compile-only — TS) ──

describe('generic type signature', () => {
  it('works for arbitrary item types', () => {
    const fonts = [
      { name: 'Inter', glyphs: 1500, variable: true,  cost: 'free' },
      { name: 'Cooper', glyphs: 580, variable: false, cost: 49 },
    ];
    const rows = buildFeatureMatrix(fonts, [
      { feature: 'Glyphs',   extract: f => f.glyphs },
      { feature: 'Variable', extract: f => f.variable ? 'Yes' : 'No' },
      { feature: 'Price',    extract: f => f.cost === 'free' ? 'Free' : `$${f.cost}` },
    ]);
    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0].values, [1500, 580]);
    assert.deepEqual(rows[1].values, ['Yes', 'No']);
    assert.deepEqual(rows[2].values, ['Free', '$49']);
  });
});
