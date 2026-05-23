# @arraypress/feature-matrix

> Generic comparison-table builder. Declare what each row should
> show + how to extract the value, point the builder at your items,
> get back a flat row structure ready to render.

Useful for product comparison tables, pricing-plan grids, plugin /
font / course feature matrices — any "spec sheet" where columns
are items and rows are features.

## Install

```bash
npm install @arraypress/feature-matrix
```

## Use

```js
import { buildFeatureMatrix } from '@arraypress/feature-matrix';

const plans = [
  { name: 'Free', price: 0,  seats: 1,        storageGB: 1   },
  { name: 'Pro',  price: 29, seats: 5,        storageGB: 50  },
  { name: 'Ent.', price: 99, seats: 'Unlim.', storageGB: 500 },
];

const rows = buildFeatureMatrix(plans, [
  { feature: 'Price',   extract: p => p.price === 0 ? 'Free' : `$${p.price}/mo` },
  { feature: 'Seats',   extract: p => p.seats },
  { feature: 'Storage', extract: p => `${p.storageGB} GB` },
  { feature: 'SLA',     extract: p => p.sla, missing: 'Best effort' },
]);
```

Returns:

```ts
[
  { feature: 'Price',   key: 'Price',   values: ['Free', '$29/mo', '$99/mo'] },
  { feature: 'Seats',   key: 'Seats',   values: [1, 5, 'Unlim.'] },
  { feature: 'Storage', key: 'Storage', values: ['1 GB', '50 GB', '500 GB'] },
  { feature: 'SLA',     key: 'SLA',     values: ['Best effort', 'Best effort', 'Best effort'] },
]
```

Drop straight into any table component:

```astro
<table>
  <thead>
    <tr>
      <th>Feature</th>
      {plans.map(p => <th>{p.name}</th>)}
    </tr>
  </thead>
  <tbody>
    {rows.map(row => (
      <tr>
        <th>{row.feature}</th>
        {row.values.map(v => <td>{v}</td>)}
      </tr>
    ))}
  </tbody>
</table>
```

## API

### `buildFeatureMatrix(items, defs, options?)`

Returns `FeatureRow[]`. One row per def, with `values` in input
order.

### `FeatureRowDef<T>`

| Field      | Type                                              | Description |
|------------|---------------------------------------------------|-------------|
| `feature`  | `string`                                          | Row label.  |
| `extract`  | `(item: T, index: number) => unknown`             | Pull the cell value. Return `undefined`/`null` to use the missing placeholder. |
| `key`      | `string?`                                         | Stable id. Defaults to `feature`. Use when two rows have the same label or you need a React key.|
| `missing`  | `string?`                                         | Per-row placeholder override.  |
| `format`   | `(value, item, index) => unknown`                 | Optional post-transform applied to `extract()`'s result before missing-value coalescing. |

### Options

| Option    | Default | Description                                                   |
|-----------|---------|---------------------------------------------------------------|
| `missing` | `'—'`   | Placeholder rendered when an extractor returns null/undefined.|

## Patterns

### Boolean check / cross

```js
const rows = buildFeatureMatrix(plans, [
  { feature: 'Custom domain', extract: p => p.customDomain,
    format: v => v ? '✓' : '✗' },
]);
```

### Computed price formatting

```js
import { formatPrice } from '@arraypress/stripe-currencies';

const rows = buildFeatureMatrix(plans, [
  { feature: 'Price', extract: p => p.priceCents, format: v => formatPrice(v, 'USD') },
]);
```

### Different units per row, shared extractor

```js
const rows = buildFeatureMatrix(servers, [
  { feature: 'RAM',     extract: s => s.specs.ram_mb,    format: v => `${v / 1024} GB` },
  { feature: 'CPU',     extract: s => s.specs.cpu_cores, format: v => `${v} core${v === 1 ? '' : 's'}` },
  { feature: 'Storage', extract: s => s.specs.disk_gb,   format: v => `${v} GB SSD` },
]);
```

### Missing placeholder per row

```js
const rows = buildFeatureMatrix(plans, [
  { feature: 'API access',    extract: p => p.apiAccess,   missing: 'Read-only' },
  { feature: 'Custom roles',  extract: p => p.customRoles, missing: 'Owner only' },
  { feature: 'Audit log',     extract: p => p.auditLog,    missing: '30 days' },
]);
```

## TypeScript

Ships with `.d.ts`. The row definitions are generic over the item
type:

```ts
import {
  buildFeatureMatrix,
  type FeatureRowDef,
  type FeatureRow,
} from '@arraypress/feature-matrix';

interface Plan {
  name: string;
  price: number;
  seats: number | 'Unlimited';
}

const defs: FeatureRowDef<Plan>[] = [
  { feature: 'Price', extract: p => `$${p.price}/mo` },
  { feature: 'Seats', extract: p => p.seats },
];

const rows: FeatureRow[] = buildFeatureMatrix(plans, defs);
```

## License

MIT
