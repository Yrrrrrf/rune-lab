# rune-lab — MoneyDisplay Currency Issues
**Context:** Chimera real estate platform · Discovered 2026-03-15

---

## Background

`rune-lab` exposes a `MoneyDisplay` component and a `formatAmount` utility
backed by **Dinero.js**. Dinero.js is a precision money library that operates
exclusively in **minor units** (centavos, cents, pence — the smallest
indivisible unit of a currency). It never works with decimals.

Chimera's SurrealDB database stores property prices in **major units**
(pesos, dollars) as `decimal` fields:

```sql
DEFINE FIELD price ON property TYPE decimal ASSERT $value > 0dec;
-- e.g. price = 12900000dec  →  MX$12,900,000 pesos
```

These two conventions collide in three distinct ways, documented below.

---

## Bug 1 — SurrealDB `decimal` deserializes as a private-field object

### What happens

The SurrealDB JavaScript SDK v3 deserializes `decimal` fields not as
`number` or `string` but as a custom `Decimal` class instance with
**private fields**:

```javascript
// What arrives from the SDK after sanitize():
property.price = {
    #int:   12900000n,  // BigInt — private field
    #frac:  0n,         // BigInt — private field
    #scale: 1           // number — private field
}
```

Private class fields (prefixed with `#`) are **invisible to `for...in`**,
`Object.keys()`, `JSON.stringify()`, and spread operators. When the
repository's `sanitize()` method recursively copies the object, it sees an
empty `{}` because it uses `for...in`. The Decimal value is silently
destroyed.

### Why it matters for rune-lab

`MoneyDisplay` receives `amount={property.price}` which is now `{}`.
Dinero.js calls `Number({})` internally → `NaN` → throws:

```
[Dinero.js] Amount is invalid.
  at assert
  at onCreate
  at dinero
  at createMoney
  at formatAmount
  at MoneyDisplay.svelte
```

### The workaround applied in Chimera

Read all `decimal` fields from the **raw DB row before** `sanitize()` runs,
using `val.toString()` which the `Decimal` class does implement:

```typescript
private toNumber(val: any): number {
    if (val == null)              return 0;
    if (typeof val === 'number')  return val;
    if (typeof val === 'bigint')  return Number(val);
    return Number(val.toString()); // Decimal.toString() → "12900000"
}

protected toDomain(row: any): Property {
    const price = this.toNumber(row.price); // read BEFORE sanitize
    const p = this.sanitize<Property>(row); // sanitize destroys Decimal
    (p as any).price = price;               // restore coerced value
    return p;
}
```

### What rune-lab should do

`MoneyDisplay` and `formatAmount` should **guard against non-numeric input**
before passing to Dinero.js:

```typescript
// Proposed fix inside formatAmount / createMoney in rune-lab
function safeAmount(val: unknown): number {
    if (val == null)              return 0;
    if (typeof val === 'number')  return Number.isFinite(val) ? val : 0;
    if (typeof val === 'bigint')  return Number(val);
    if (typeof val === 'object')  return Number(val.toString?.() ?? 0);
    return Number(val) || 0;
}
```

This makes the component resilient to any numeric-like type, not just `number`.

---

## Bug 2 — Major unit vs minor unit mismatch (prices 100× too small)

### What happens

After Bug 1 is fixed and prices are correctly coerced to `number`, the
displayed prices are **100× smaller than expected**:

```
DB value:       12900000  (MX$12,900,000 pesos)
Displayed as:   MX$129,000.00
```

Every price is divided by 100.

### Why

Dinero.js **always** interprets `amount` as the **minor unit** of the
currency. For MXN, the minor unit is centavos (1 peso = 100 centavos).

So when `MoneyDisplay` receives `amount={12900000}` with `currency="MXN"`,
Dinero.js reads it as 12,900,000 centavos = MX$129,000.

The DB stores prices in **pesos** (major units). The two systems disagree on
what the number means.

### The workaround applied in Chimera

Multiply by 100 at the repository layer to convert major → minor units:

```typescript
if (p.price != null) (p as any).price = this.toNumber(row.price) * 100;
```

This is a **leaky workaround** — the domain model now carries centavos
instead of pesos, which is semantically wrong and will confuse any code that
reads `property.price` for non-display purposes (e.g. calculations,
comparisons, DB writes).

### What rune-lab should do

`MoneyDisplay` needs a `unit` prop that signals whether the amount is in
major or minor units:

```svelte
<!-- Current API (forces minor units) -->
<MoneyDisplay amount={12900000} currency="MXN" />
<!-- Renders: MX$129,000.00 ❌ -->

<!-- Proposed API -->
<MoneyDisplay amount={12900000} currency="MXN" unit="major" />
<!-- Renders: MX$12,900,000.00 ✓ -->

<MoneyDisplay amount={1290000000} currency="MXN" unit="minor" />
<!-- Renders: MX$12,900,000.00 ✓ (same result, different input) -->
```

Internally, when `unit="major"`, multiply `amount` by the currency's
`exponent` (MXN = 2, so × 100) before passing to Dinero.js.

Alternatively, expose a `toMinorUnit(amount, currency)` utility function so
callers can convert explicitly with full awareness of what they're doing.

---

## Bug 3 — `null` / `undefined` monetary fields crash the component

### What happens

Properties that don't have `price_usd` or `price_per_sqm` (e.g. properties
where the exchange rate lookup returned nothing, or area is null) crash
`AiValuation.svelte` because `MoneyDisplay` receives `null` or `undefined`
and Dinero.js throws the same `Amount is invalid` error.

The crash happens specifically in `AiValuation.svelte` which computes
estimated values from `price_usd` and `price_per_sqm` — both are **computed
fields** in SurrealDB that return `NONE` when the prerequisites are missing.

### Affected computed fields

```sql
-- price_per_sqm: NONE if constructed_area_sqm is null
DEFINE FIELD price_per_sqm ON property COMPUTED
    IF constructed_area_sqm != NONE { price / constructed_area_sqm } ELSE { NONE };

-- price_usd: NONE if exchange_rate row is missing
DEFINE FIELD price_usd ON property COMPUTED
    IF (SELECT VALUE rate FROM exchange_rate
        WHERE currency_from = $parent.currency AND currency_to = 'USD'
        LIMIT 1)[0] != NONE { ... } ELSE { NONE };
```

`NONE` in SurrealDB serializes as `null` in the JS SDK. When `null` reaches
`MoneyDisplay`, Dinero.js crashes.

### What rune-lab should do

`MoneyDisplay` must treat `null`, `undefined`, `NaN`, and `0` as displayable
states, not crash states:

```svelte
<!-- Proposed behavior -->
<MoneyDisplay amount={null}      currency="MXN" />  → renders "—" or "$0.00"
<MoneyDisplay amount={undefined} currency="MXN" />  → renders "—"
<MoneyDisplay amount={NaN}       currency="MXN" />  → renders "—"
```

Add a `fallback` prop for the null/undefined/NaN case:

```svelte
<MoneyDisplay amount={property.price_usd} currency="USD" fallback="N/A" />
```

---

## Summary Table

| Bug | Root cause | Current workaround | Proper rune-lab fix |
|-----|-----------|-------------------|---------------------|
| 1 — Decimal object | SurrealDB v3 SDK uses private class fields | Read raw before `sanitize()`, use `.toString()` | Guard in `safeAmount()` before Dinero.js |
| 2 — 100× scale | Dinero.js expects minor units, DB stores major | Multiply by 100 in repository `toDomain` | Add `unit="major"/"minor"` prop to `MoneyDisplay` |
| 3 — null crash | SurrealDB `NONE` → JS `null`, no guard | `toNumber()` returns `0` for null | `fallback` prop + null guard before Dinero.js |

---

## Ideal Future API

```svelte
<!--
  MoneyDisplay — proposed contract:

  amount:   number | null | undefined — in major OR minor units
  currency: ISO 4217 string
  unit:     "major" (default) | "minor"
  fallback: string shown when amount is null/undefined/NaN (default "—")
  compact:  boolean — use compact notation for large amounts (1.2M)
-->

<MoneyDisplay
    amount={property.price}
    currency={property.currency}
    unit="major"
    fallback="Precio no disponible"
    compact={true}
/>
<!-- MX$12.9M -->

<MoneyDisplay
    amount={property.price_usd}
    currency="USD"
    unit="major"
    fallback="—"
/>
<!-- USD 671,400.00 or "—" if null -->
```

---

## Files Affected in Chimera

| File | Change needed when rune-lab is fixed |
|------|--------------------------------------|
| `sdk/infrastructure/src/surrealdb/repositories/SurrealPropertyRepository.ts` | Remove `* 100` multiplier from `toDomain`, remove pre-sanitize reads if rune-lab guards internally |
| `sdk/ui/src/components/property/AiValuation.svelte` | Remove null guards once `MoneyDisplay` handles null natively |
| `sdk/ui/src/components/property/PropertyModalSidebar.svelte` | Same |
| Any component using `MoneyDisplay` with a nullable field | Remove manual null checks |

---

## Related

- Dinero.js docs on minor units: https://dinerojs.com/docs/getting-started/concept
- SurrealDB JS SDK Decimal type: check SDK source for `Decimal` class `toString()` implementation
- ISO 4217 currency exponents: MXN=2, USD=2, JPY=0 (no minor unit), KWD=3
