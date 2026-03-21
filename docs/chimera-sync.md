# rune-lab — Full Compatibility Analysis for Chimera
**rune-lab v0.2.3 · Chimera Explorer · Analyzed 2026-03-15**

---

## Quick Verdict

rune-lab is well-architected and will not need major surgery. The problems
are concentrated in one subsystem: **the money layer**. Everything else
(theme, language, persistence, cart, auth, toasts, commands) works correctly
with Chimera as-is. Fix the money issues and the rest is solid.

Issues are ranked: 🔴 crashes · 🟡 wrong behavior · 🟢 future gotcha

---

## 🔴 Critical — Will Crash

### C1 — `MoneyDisplay` has no null guard

**File:** `src/sdk/ui/src/lib/components/money/MoneyDisplay.svelte`

`amount` is typed as `number` — no `| null | undefined`. At runtime, when
a nullable field from SurrealDB is passed (e.g. `price_usd`, `price_per_sqm`
which are computed fields that return `NONE`/`null` when prerequisites are
missing), TypeScript does not catch it and Dinero.js throws immediately:

```
[Dinero.js] Amount is invalid.
  at MoneyDisplay.svelte (AiValuation)
```

The `formatted` derived block calls `formatAmount(amount, ...)` → 
`createMoney(amount, ...)` → `dinero({ amount, currency })` with no guard.

**Currently hitting this in Chimera:** `AiValuation.svelte` passes
`price_usd` and `price_per_sqm` which are `null` on any property that has
no area value or missing exchange rate.

**Fix needed in rune-lab:**
```typescript
// MoneyDisplayProps
amount: number | null | undefined;
fallback?: string; // what to render when amount is null/undefined/NaN

// In the formatted derived:
const formatted = $derived.by(() => {
    if (amount == null || !Number.isFinite(amount)) {
        return fallback ?? "—";
    }
    // ... rest of existing logic
});
```

---

### C2 — Custom currencies break `createMoney` silently

**Files:** `src/sdk/state/src/currency.svelte.ts` ·
`src/sdk/core/src/money/money.ts`

`CurrencyStore` supports `customCurrencies` via `addItems()`. But
`CURRENCY_MAP` in `money.ts` is a static object. If Chimera adds a custom
currency (e.g. a presale token, or a regional currency not in the default
list), it will appear in the store dropdown — the user can select it — but
then `createMoney(amount, customCode)` throws:

```
Error: Unknown currency code: XYZ. Add it to CURRENCY_MAP.
```

**This is a design gap:** the two registries (`CurrencyStore.available` and
`CURRENCY_MAP`) are independent and can diverge silently.

**Fix needed in rune-lab:**
```typescript
// In createCurrencyStore, after addItems():
// Also register new currencies with CURRENCY_MAP
export function registerCurrency(code: string, dineroDefinition: DineroCurrency<number>) {
    CURRENCY_MAP[code] = dineroDefinition;
}
```
Or make `createMoney` fall back to building a Dinero currency from the
store's `decimals` metadata instead of requiring a pre-registered object.

---

## 🟡 Wrong Behavior — No Crash But Incorrect

### W1 — Minor unit assumption throughout the money layer

**Files:** `money.ts` · `MoneyDisplay.svelte` · `MoneyInput.svelte` ·
`useMoney.ts`

Every function in the money subsystem assumes `amount` is in **minor units**
(centavos, cents). The JSDoc says it explicitly:
```typescript
/** Amount in minor units (e.g., 15000 = $150.00 for USD) */
amount: number;
```

Chimera's SurrealDB stores prices in **major units** (pesos):
```sql
price = 18500000dec  -- means MX$18,500,000 pesos
```

**Current workaround in Chimera:** multiply by 100 in `SurrealPropertyRepository.toDomain()`.
This is functional but semantically inverted — the domain model now stores
centavos instead of pesos, which is confusing for any non-display code.

**Side effects of the workaround:**
- `property.price = 1850000000` (1.85 billion centavos) — looks alarming in logs
- Any direct comparison like `property.price > 1000000` now needs to account for the ×100
- `price_per_sqm` and `price_usd` also need ×100 if displayed via `MoneyDisplay`
- Cart `priceExtractor: (p) => p.price` returns centavos, so cart totals are in centavos

**Fix needed in rune-lab:**
```typescript
// Add a `unit` prop to MoneyDisplay and MoneyInput
unit?: "major" | "minor"; // default: "minor" for backward compat

// Internally, when unit="major":
const minorAmount = $derived(
    unit === "major"
        ? Math.round(amount * Math.pow(10, decimals))
        : amount
);
// use minorAmount for Dinero
```

---

### W2 — localStorage persisted currency overrides `defaultCurrency`

**File:** `src/sdk/state/src/currency.svelte.ts` (line ~1601)

```typescript
if (!resolvedDriver?.get("currency") && opts.defaultCurrency) {
    store.set(opts.defaultCurrency as any);
}
```

This only sets the default if there is **no persisted value**. On Chimera,
Chimera's `RuneProvider` config sets `defaultCurrency: "MXN"`. But if a
user previously visited and their localStorage has `currency = "CNY"` (from
any past session), the store initializes to CNY and their MXN property
prices are formatted under the wrong currency context.

**Evidence in logs:**
```
💰 Currency configured: {current: 'CNY'}
🌍 Language configured: {current: 'fr'}
```

This is correct per-user persistence behavior — but for a real estate app
where the property currency is always MXN, showing prices in CNY formatting
is confusing even if the underlying amount is technically the same number.

**Two separate concerns to fix:**

1. **Display currency vs. property currency:** `MoneyDisplay` in Chimera
   already passes `currency={property.currency}` explicitly, so the Dinero
   formatting uses MXN regardless of the store. The store's `current` is
   only the fallback. This is actually fine — the display is correct.

2. **The real problem:** There's no currency *conversion*. If the user
   switches to USD in the selector, they expect to see USD prices. But
   `MoneyDisplay` just reformats the MXN amount as if it were USD cents —
   it doesn't convert. A `MX$18,500,000` property would display as
   `$185,000.00 USD` instead of `~$961,000 USD`. This is misleading.

**Fix needed in rune-lab:**
`MoneyDisplay` needs an optional `exchangeRate` prop, or the currency store
needs a conversion layer. Alternatively, document clearly that the component
does NOT convert — it only reformats — so consumers can handle conversion
upstream before passing `amount`.

---

### W3 — `price_usd` and `price_per_sqm` not converted to minor units

**File:** Chimera's `SurrealPropertyRepository.ts`

The `toDomain` fix multiplies `price` by 100. But `price_usd` and
`price_per_sqm` are also monetary values displayed via `MoneyDisplay` in
`AiValuation.svelte` and `PropertyModalSidebar.svelte`. If they're not also
×100, they render at 1/100 of their correct value.

**Currently affected in Chimera:**
```typescript
// toDomain — MISSING ×100 on these:
if (p.price_usd     != null) (p as any).price_usd     = this.toNumber(row.price_usd);
if (p.price_per_sqm != null) (p as any).price_per_sqm = this.toNumber(row.price_per_sqm);
// ^ These need * 100 too if passed to MoneyDisplay
```

This is a consequence of W1. Once rune-lab adds `unit="major"`, all ×100
multipliers in Chimera can be removed.

---

## 🟢 Future Gotchas — Won't crash now but will bite later

### G1 — `apiUrl` format mismatch in `RuneProvider` config

**File:** Chimera's `+layout.svelte` RuneProvider config

```typescript
config={{
    apiUrl: "ws://localhost:8000/rpc",   // ← WebSocket URL
    apiHealthCheck: async () => infraStore.isReady,
}}
```

`ApiStore.init()` stores this as `this.url`. The `ApiMonitor.svelte`
component (if rendered) will display `ws://localhost:8000/rpc` as the API
URL — odd for a component that implies HTTP. Not a crash, but the
`ApiMonitor`'s connection indicator may behave unexpectedly in production
where HTTP and WS endpoints differ.

The `healthCheck` overrides the actual connectivity check so this is benign
right now. Just be aware if `ApiMonitor` is ever rendered in the agent app.

---

### G2 — `useMoney` composable inherits all of W1

**File:** `src/sdk/state/src/composables/useMoney.ts`

```typescript
function format(amount: number, currencyCode?: string): string {
    const money = createMoney(amount, code); // assumes minor units
    return formatMoney(money, locale, code);
}
```

If any Chimera component uses `useMoney().format(property.price)` directly
instead of `<MoneyDisplay>`, and `property.price` is in the workaround
minor units (×100), it will work. But if someone refactors and removes the
×100 multiplier without also updating `useMoney` callers, prices will be
100× too small again. **The workaround creates a hidden contract** that
needs to be documented or eliminated.

---

### G3 — Cart `priceExtractor` returns centavos

**File:** Chimera's `+layout.svelte`

```typescript
cart: {
    priceExtractor: (p: any) => p.price,  // returns centavos after ×100 fix
    storageKey: "chimera:cart",
}
```

`CartStore` sums prices using `priceExtractor`. The total is in centavos.
When the cart total is displayed via `MoneyDisplay`, it will be correct
(100 centavos → display as pesos). But if the total is used anywhere for
business logic (e.g. "show properties under your budget"), the raw number
will be centavos and any hardcoded thresholds will be wrong by 100×.

---

### G4 — `AppStore.init()` is idempotent — config changes ignored

**File:** `src/sdk/state/src/app.svelte.ts`

```typescript
#initialized = false;
init(data: Partial<AppData>): void {
    if (this.#initialized) { /* silently ignored */ return; }
```

Chimera's RuneProvider wraps `init` in a `$effect`:
```typescript
$effect(() => { if (config.app) appStore.init(config.app); });
```

If `config.app` ever changes reactively (unlikely but possible in SSR or
when config is dynamic), the update is silently dropped after the first
render. Not a current problem but worth knowing.

---

### G5 — No currency in `CURRENCY_MAP` will throw, not gracefully degrade

Already documented as C2. Re-flagged here because Chimera's seed uses
presale properties and could in future support USD-priced properties or
other currencies. Any currency code that's in the DB but not in
`CURRENCY_MAP` will hard-crash `MoneyDisplay`.

**Current safe set:** USD, EUR, MXN, JPY, KRW, CNY, AED, GBP, CAD, BRL, INR.
**Chimera uses:** MXN (primary), USD (price_usd computed field). Both safe.
**Watch out for:** any `currency` field value in the DB that isn't in this list.

---

## Summary

| ID | Severity | Description | Affects Chimera now? |
|----|----------|-------------|----------------------|
| C1 | 🔴 Crash | No null guard in MoneyDisplay | Yes — AiValuation |
| C2 | 🔴 Crash | Custom currencies not in CURRENCY_MAP | No — not using custom currencies yet |
| W1 | 🟡 Wrong | Minor unit assumption everywhere | Yes — workaround applied (×100) |
| W2 | 🟡 Wrong | localStorage overrides defaultCurrency | Cosmetic — display uses explicit currency |
| W3 | 🟡 Wrong | price_usd / price_per_sqm not ×100 | Yes — AiValuation wrong values |
| G1 | 🟢 Gotcha | apiUrl is ws:// not http:// | Cosmetic — healthCheck overrides |
| G2 | 🟢 Gotcha | useMoney inherits W1 | If useMoney() is called directly |
| G3 | 🟢 Gotcha | Cart totals are in centavos | If cart used for business logic |
| G4 | 🟢 Gotcha | AppStore.init() ignores updates | If config is dynamic |
| G5 | 🟢 Gotcha | Unknown currency code throws | If new currencies added to DB |

---

## Minimal Fix List (what to change in rune-lab to unblock Chimera fully)

In priority order:

1. **Null guard in `MoneyDisplay`** — add `amount: number | null | undefined`
   and a `fallback` prop that renders `"—"` instead of throwing. Fixes C1.

2. **`unit` prop on `MoneyDisplay` and `MoneyInput`** — `"major" | "minor"`,
   defaulting to `"minor"` for backward compat. Fixes W1 and lets Chimera
   remove the `×100` workaround entirely. Also fixes W3 and G2 and G3.

3. **`fallback` prop on `MoneyDisplay`** — same as #1 but separated for
   clarity: a string shown when amount is null/undefined/NaN. Fixes C1.

Once those three are shipped, Chimera's `SurrealPropertyRepository.toDomain`
simplifies back to removing the `×100` multiplier, and `AiValuation` stops
crashing on null fields.
