# rune-lab v0.4.5 — Implementation Plan

**Date:** 2026-04-04 **Status:** ACTIVE DEVELOPMENT — no consumers, no backward
compatibility constraints

---

## 0. Executive Summary

v0.4.4 has three bugs that make the library unusable: `ResourceSelector`
infinite recursion from snippet name collision, `CurrencySelector` missing from
barrel exports, and `.d.ts` types collapsing to `never`. Beyond the crashes,
there's also an architectural gap — store changes (theme, language, currency)
are self-contained and provide no hook for the consuming project to react.
v0.4.5 fixes all three bugs, adds `onChange` to `ConfigStore`, wires it through
`RuneProvider` props, removes the broken internal `setLocale` call from
`LanguageSelector`, and adds CI guards so these bug classes can't recur.

**Exit criterion:** `just typecheck` produces only the 6 known Paraglide errors
(see §1.1). No new errors introduced.

---

## 1. Context & Constraints

- **Existing library**, active development, no published consumers to protect
- **Monorepo:** Single-package SvelteKit library — Svelte 5, TypeScript 5.9,
  Tailwind v4, DaisyUI v5, Vite 8, Bun
- **Build:** `@sveltejs/package` for dist, Paraglide for i18n, `deno fmt`
- **No backward compat required** — free to rename, restructure, change behavior
- **[ASSUMPTION]** Solo maintainer, hackathon pace
- **Out of scope:** New plugins, new components, performance work, backend

### 1.1 Known `just typecheck` Errors — DO NOT FIX

The following 6 errors appear in v0.4.4 and are **expected**. They are caused by
Paraglide's compiled output (`src/lib/i18n/paraglide/`) which ships its own
`.gitignore`. The generated `.js` files exist on disk after `paraglide compile`,
but `svelte-check` cannot see their type declarations because they are
gitignored and have no `.d.ts` files. These are NOT bugs — do not spend time
fixing them.

```
src/hooks.server.ts:2:37    — Could not find declaration for './lib/i18n/paraglide/server.js'
src/hooks.server.ts:5:41    — Binding element 'request' implicitly has 'any' type
src/hooks.server.ts:5:50    — Binding element 'locale' implicitly has 'any' type
src/hooks.ts:1:31           — Could not find declaration for './lib/i18n/paraglide/runtime.js'
ResourceSelector.svelte:4:33 — Could not find declaration for '../../../i18n/paraglide/messages.js'
LanguageSelector.svelte:4:31 — Could not find declaration for '../../../i18n/paraglide/runtime.js'
```

**Why they exist:** Paraglide compiles translation files into
`src/lib/i18n/paraglide/` with a `.gitignore` that excludes itself from version
control. The files are generated at build time (`just build` runs
`paraglide compile` first), so they exist at runtime but `svelte-check` runs in
a context where it treats gitignored paths as invisible. The `hooks.server.ts`
and `hooks.ts` files are the library's own SSR middleware — they reference the
compiled Paraglide output and inherit the missing-declaration errors.

**Exit criterion clarification:** `just typecheck` must produce exactly these 6
errors and no others. Any new error is a regression. Any reduction in these 6 is
a bonus but not required for v0.4.5.

---

## 2. Architecture Overview

```
Consumer Project
├── SvelteKit Router
├── Paraglide i18n (consumer's own compilation)
├── Custom CSS / DaisyUI
│
├── RuneProvider  ←── NEW: onThemeChange, onLanguageChange, onCurrencyChange
│   ├── LayoutPlugin
│   │   ├── LayoutStore
│   │   ├── ThemeStore   ←── ConfigStore with onChange()
│   │   └── LanguageStore ←── ConfigStore with onChange()
│   ├── PalettesPlugin
│   │   ├── CommandStore
│   │   ├── ShortcutStore
│   │   └── ToastStore
│   └── MoneyPlugin
│       ├── ExchangeRateStore
│       └── CurrencyStore ←── ConfigStore with onChange()
│
└── UI Components
    ├── ResourceSelector  ←── FIXED: no more snippet recursion
    ├── AppSettingSelector ←── FIXED: proper generic types
    ├── CurrencySelector  ←── FIXED: now exported
    ├── ThemeSelector, LanguageSelector
    └── MoneyDisplay, MoneyInput
```

### Affected Files

| File                                                 | Change                                               |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `runes/layout/src/ResourceSelector.svelte`           | Rename internal snippets to break recursion          |
| `runes/plugins/money/src/mod.ts`                     | Add missing component exports                        |
| `runes/layout/src/AppSettingSelector.svelte`         | Replace `any` with generic `<T>`, fix button nesting |
| `kernel/src/persistence/createConfigStore.svelte.ts` | Add `onChange()` method                              |
| `RuneProvider.svelte`                                | Add callback props, wire to onChange                 |
| `runes/layout/src/LanguageSelector.svelte`           | Remove broken internal `setLocale` call              |
| `scripts/deploy.just`                                | Add type validation before publish                   |

---

## 3. Design Patterns & Standards

### 3.1 ResourceSelector — Snippet Rename

- **Problem:** Internal snippets named `triggerLabel` and `item` shadow the
  identically-named props. Svelte 5 lexical scoping makes
  `{@render triggerLabel(value)}` call itself instead of the prop.
- **Pattern:** Rename internal forwarding snippets to `_triggerLabel` / `_item`.
- **Convention going forward:** Internal forwarding snippets always use
  underscore prefix. This prevents the collision regardless of what prop names
  consumers choose.
- **Long-term protection:** If Svelte ever adds explicit prop-reference syntax
  (`{@render props.triggerLabel()}`), refactor to use it and drop the underscore
  convention.

### 3.2 CurrencySelector Export — Barrel Completeness

- **Problem:** `export *` from `.ts` files does not re-export `default` from
  `.svelte` files. `CurrencySelector.svelte` exists but has no
  `export { default as CurrencySelector }` in `mod.ts`.
- **Pattern:** Every `.svelte` component in a plugin must have an explicit
  `export { default as X }` in that plugin's `mod.ts`.
- **Enforcement:** Add a vitest test that scans all `.svelte` files under
  `src/lib/` and verifies each has a reachable export from the root `mod.ts`.
  Maintain an allowlist for intentionally internal-only components.

### 3.3 AppSettingSelector Types — Explicit Generics

- **Problem:** `$props<{ options: any[]; value: any; ... }>()` causes the build
  to emit `.d.ts` with props typed as `never`.
- **Pattern:** Define a named `interface AppSettingSelectorProps<T = unknown>`
  with `T` for options/value/snippets. Pass it to
  `$props<AppSettingSelectorProps<T>>()`.
- **Secondary fix:** The component nests `<button>` inside `<button>` in the
  mobile modal, producing invalid HTML and hydration warnings. Change inner
  elements to `<div role="button" tabindex="0">` with appropriate `onkeydown`
  handlers.
- **Enforcement:** Add a post-build script to `deploy.just` that greps
  `dist/**/*.d.ts` for `never` prop patterns and fails the build.

### 3.4 ConfigStore.onChange — Observer Pattern

- **Problem:** `ConfigStore.set()` updates internal state and persists, but
  provides no notification mechanism. Consumers must write fragile `$effect`
  watchers.
- **Pattern:** Add `onChange(callback: (newId, oldId) => void): () => void` to
  `ConfigStoreImpl`. The `set()` method calls all registered callbacks after
  updating `this.current`. Returns an unsubscribe function.
- **Safety:** Callbacks are wrapped in `try/catch` — a broken callback must not
  crash the store. Errors logged with `console.error` in DEV.
- **Contract:** Callbacks fire only on `set()`, never during construction or
  `setDriver()`.

### 3.5 RuneProvider Callbacks — Declarative Bridge

- **Problem:** Consumers have no declarative way to bridge rune-lab stores to
  their own systems (Paraglide, CSS, formatting).
- **Pattern:** `RuneProvider` gains `onThemeChange`, `onLanguageChange`,
  `onCurrencyChange` optional props. During init, it wires them to the
  respective store's `onChange()`. Cleanup via `onMount` return.
- **Contract:** Callbacks do NOT fire during initial mount — only on subsequent
  changes. Initial values are read from the store directly.

### 3.6 LanguageSelector — Remove Broken setLocale

- **Problem:** `LanguageSelector.svelte` imports `setLocale` from rune-lab's own
  Paraglide compilation. This is always wrong for consumers — they have their
  own Paraglide instance with different message bundles.
- **Fix:** Remove the `setLocale` import and call entirely. The component's
  existing `onchange` prop already fires when the language changes. Consumers
  use `RuneProvider`'s `onLanguageChange` to call their own `setLocale`.

### Code Standards

- Internal forwarding snippets: `_` prefix
- Store IDs: plain words (`theme`, `language`, `currency`)
- Plugin IDs: dot-namespaced (`rune-lab.layout`, `rune-lab.money`)
- All DEV logs: `[rune-lab]` prefix
- Dependency direction: `kernel ← layout ← palettes ← plugins/money` (never
  reverse)
- Callbacks: always `try/catch`, always return unsubscribe function

---

## 4. Component Map & Directory Structure

### Changed Components

**`ResourceSelector.svelte`** — Generic bridge between ConfigStore and
AppSettingSelector

- Rename `{#snippet triggerLabel}` → `{#snippet _triggerLabel}` and
  `{#snippet item}` → `{#snippet _item}`
- Inside each, `{@render triggerLabel(value)}` and `{@render item(option)}` now
  correctly reference the prop (no shadowing)

**`money/src/mod.ts`** — Money plugin barrel

- Add: `export { default as CurrencySelector } from "./CurrencySelector.svelte"`
- Add: `export { default as MoneyDisplay } from "./MoneyDisplay.svelte"`
- Add: `export { default as MoneyInput } from "./MoneyInput.svelte"`

**`AppSettingSelector.svelte`** — Generic dropdown/modal selector

- Replace all `any` types with generic `T` via a named props interface
- Fix nested `<button>` in mobile modal — use `<div role="button" tabindex="0">`
  instead

**`createConfigStore.svelte.ts`** — Core store factory

- `ConfigStore<T>` interface gains:
  `onChange(cb: (newId: unknown, oldId: unknown) => void): () => void`
- `ConfigStoreImpl` gains: private `#callbacks: Set<Function>`, `onChange()`
  method, callback invocation in `set()`

**`RuneProvider.svelte`** — Root provider

- Props interface gains: `onThemeChange?`, `onLanguageChange?`,
  `onCurrencyChange?`
- After store initialization, wire each callback to the corresponding store's
  `onChange()`
- Clean up subscriptions on unmount

**`LanguageSelector.svelte`** — Language picker

- Remove `import { setLocale } from "../../../i18n/paraglide/runtime.js"`
- Remove `setLocale(l.code as any)` call from the onclick handler
- The `onchange` prop and store `set()` remain — consumer bridges via
  `RuneProvider.onLanguageChange`

### New Files

**`kernel/src/registry/barrel-check.test.ts`** — Fitness function

- Scans `src/lib/**/*.svelte`, verifies each has a reachable export from
  `mod.ts`
- Allowlist for internal-only components

**`scripts/check-types.sh`** — Post-build validation

- Scans `dist/**/*.d.ts` for `never` prop types, fails if found

### Directory Tree (changes marked *)

```
rune-lab/
├── scripts/
│   ├── deploy.just              * (add check-types step)
│   └── check-types.sh           * (NEW)
├── src/lib/
│   ├── mod.ts
│   ├── RuneProvider.svelte      * (callback props)
│   ├── kernel/src/
│   │   ├── persistence/
│   │   │   └── createConfigStore.svelte.ts  * (onChange)
│   │   └── registry/
│   │       └── barrel-check.test.ts         * (NEW)
│   └── runes/
│       ├── layout/src/
│       │   ├── AppSettingSelector.svelte     * (generics + button fix)
│       │   ├── LanguageSelector.svelte       * (remove setLocale)
│       │   └── ResourceSelector.svelte       * (rename snippets)
│       └── plugins/money/src/
│           └── mod.ts                        * (add component exports)
```

---

## 5. Trade-off Analysis

### Snippet Fix Strategy

```
DECISION: How to fix ResourceSelector infinite recursion
OPTIONS CONSIDERED:
  A. Rename internal snippets (_triggerLabel, _item)
     — Pros: 2-line change, zero API impact, root cause fixed
     — Cons: Convention-based, not enforced by compiler
  B. Remove ResourceSelector, inline logic into each Selector
     — Pros: Eliminates forwarding entirely
     — Cons: Triples code duplication across Theme/Language/Currency selectors
  C. Pass snippets as regular props instead of slot snippets
     — Pros: Avoids scoping issue entirely
     — Cons: Changes the component API pattern used everywhere
CHOSEN: A
REASON: Minimal diff, fixes the exact problem, no duplication.
REVISIT IF: Svelte adds prop-qualified snippet references.
```

### Consumer Callback Architecture

```
DECISION: How consumers react to store changes
OPTIONS CONSIDERED:
  A. Named props on RuneProvider (onThemeChange, onLanguageChange, onCurrencyChange)
     — Pros: Discoverable, typed, lifecycle-managed
     — Cons: Adding a new store means adding a new prop
  B. Generic map prop: onStoreChange: Record<string, callback>
     — Pros: Extensible without new props
     — Cons: Less discoverable, no per-store typing
  C. ConfigStore.onChange() only (no RuneProvider sugar)
     — Pros: Works anywhere, not tied to component tree
     — Cons: Consumer must manage cleanup manually
CHOSEN: A + C combined — RuneProvider props backed by ConfigStore.onChange()
REASON: Named props for the common case, onChange() for power users.
         No compat concerns since there are no consumers yet.
REVISIT IF: Store count exceeds 5 with callbacks, then switch to generic map.
```

### LanguageSelector setLocale Removal

```
DECISION: Keep or remove the internal setLocale call
OPTIONS CONSIDERED:
  A. Remove entirely — consumer bridges via onLanguageChange
     — Pros: Correct architecture, no wrong-Paraglide-instance bug
     — Cons: Requires consumer to wire setLocale manually
  B. Keep as fallback, add onchange as additional hook
     — Pros: "Works" for rune-lab's own demo app
     — Cons: Calls the wrong Paraglide in every consumer project
CHOSEN: A
REASON: No consumers to break. The internal call was always calling
        rune-lab's Paraglide, never the consumer's. It's a bug, not a feature.
```

### Type Fix Strategy

```
DECISION: How to prevent .d.ts props from collapsing to `never`
OPTIONS CONSIDERED:
  A. Explicit named interfaces for all component props
     — Pros: Guarantees correct emission regardless of compiler
     — Cons: More verbose
  B. Pin @sveltejs/package version
     — Pros: Quick
     — Cons: Fragile, blocks upgrades
CHOSEN: A + post-build validation script
REASON: Named interfaces fix the cause, script catches regressions.
```

---

## 6. Phased Implementation Plan

### Phase 1 — Fix the Three Crashes

**Goal:** `just typecheck` passes, no runtime errors on SSR or CSR.

**Components:**

1. ResourceSelector snippet rename (`_triggerLabel`, `_item`)
2. CurrencySelector + MoneyDisplay + MoneyInput barrel exports in
   `money/src/mod.ts`
3. AppSettingSelector: replace `any` with generic interface, fix `<button>`
   nesting

**Dependencies:** None — all three are independent.

**Exit criteria:**

- `just typecheck` → only the 6 known Paraglide errors (§1.1), no new errors
- `just build` → succeeds
- rune-lab demo app renders all three selectors in SSR without 500 errors
- `import { CurrencySelector } from "rune-lab"` resolves in a consumer vite
  project

**Risk:** The generic type on `AppSettingSelector` may need `as any` casts
removed from `ThemeSelector`, `LanguageSelector`, and `CurrencySelector` where
they pass stores. Verify all three after the change.

---

### Phase 2 — Store Bridge (onChange + RuneProvider Callbacks)

**Goal:** Consumer projects can declaratively react to theme/language/currency
changes.

**Components:**

1. `ConfigStore.onChange(callback)` — add to `ConfigStoreImpl`, call from
   `set()`
2. `RuneProvider` callback props — `onThemeChange`, `onLanguageChange`,
   `onCurrencyChange`
3. Remove `setLocale` from `LanguageSelector.svelte`

**Dependencies:** Phase 1 (types must be correct for callback props to be typed
correctly).

**Exit criteria:**

- `just typecheck` → only the 6 known Paraglide errors (§1.1), no new errors
- rune-lab demo app: passing `onThemeChange={(t) => console.log(t)}` to
  RuneProvider logs theme changes
- LanguageSelector: clicking a language fires `onchange` prop, does NOT call any
  `setLocale`
- Callbacks do NOT fire during initial mount
- Thrown callback does NOT crash the app (caught + logged in DEV)

**Risk:** The rune-lab demo app (`src/routes/LabHeader.svelte`) uses
`LanguageSelector` which currently auto-calls `setLocale`. After removal, the
demo app's language switch will update the store but not the HTML `lang`
attribute. Fix the demo app's `+layout.svelte` to pass `onLanguageChange` to
`RuneProvider`.

---

### Phase 3 — CI Guards

**Goal:** These bug classes cannot recur.

**Components:**

1. Barrel completeness test (`barrel-check.test.ts`)
2. Post-build type validation (`check-types.sh`)
3. `deploy.just` updated: `build → test → check-types → fmt → publish`

**Dependencies:** Phases 1 and 2 complete.

**Exit criteria:**

- `just quality` (fmt + lint + typecheck + test) → passes
- Removing a barrel export causes test failure
- Introducing `any` props that collapse to `never` causes build failure
- `just deploy` is blocked if any step fails

**Risk:** The barrel test may flag internal helper components. Add an allowlist
with a comment explaining each exclusion.

---

## 7. Implementation Management

### Dependency Graph

```
1a: ResourceSelector fix    ─┐
1b: CurrencySelector export ─┼─► Phase 1 done
1c: AppSettingSelector types ─┘
                               │
                               ▼
2a: ConfigStore.onChange()   ─┐
2b: RuneProvider callbacks   ─┼─► Phase 2 done
2c: LanguageSelector cleanup ─┘
                               │
                               ▼
3a: Barrel test              ─┐
3b: Type validation script   ─┼─► v0.4.5 done
3c: Deploy pipeline update   ─┘
```

### Critical Path

`1c (types)` → `2b (RuneProvider props)` — callback props can't be typed
correctly until the generic fix lands.

### Integration Points (Watch Carefully)

1. **AppSettingSelector generic ↔ all Selectors** — ThemeSelector,
   LanguageSelector, and CurrencySelector all use AppSettingSelector (via
   ResourceSelector). The generic `T` must flow correctly. Test all three after
   the type fix.

2. **ConfigStore.onChange ↔ set() timing** — The callback must fire AFTER
   `this.current` is updated AND after persistence. Verify the order:
   `this.current = id` → `this.#driver.set(...)` →
   `callbacks.forEach(cb => cb(id, old))`.

3. **Demo app LanguageSelector** — After removing `setLocale`, update the demo's
   `+layout.svelte` to wire `onLanguageChange` so the demo still works.

---

## 8. Validation & Testing Strategy

| Layer                  | Test                          | What it verifies                                                      |
| ---------------------- | ----------------------------- | --------------------------------------------------------------------- |
| ResourceSelector       | Unit (testing-library/svelte) | Renders without recursion, snippets forward correctly                 |
| CurrencySelector       | Import test                   | `import { CurrencySelector } from "rune-lab"` resolves                |
| AppSettingSelector     | `just typecheck`              | Props are not `never`, no `<button>` nesting warnings                 |
| ConfigStore.onChange   | Unit (vitest)                 | Fires on set, not on init, unsubscribe works, thrown callbacks caught |
| RuneProvider callbacks | Unit                          | Props wire to onChange, cleanup on unmount                            |
| Barrel completeness    | Fitness function (vitest)     | All public .svelte files have exports                                 |
| Type correctness       | Fitness function (shell)      | No `never` props in dist                                              |

### Local Dev Validation

Run before every commit:

1. `just typecheck` → only the 6 known Paraglide errors (§1.1), no new errors
2. `just test` → all tests pass
3. `just build` → dist generates
4. Open demo app, click all three selectors, verify no SSR 500s

---

## 9. Open Questions & Risks

| Question                                                                            | Recommendation                                                                                                                     |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Should `onChange` also fire when `setDriver()` loads a persisted value?             | No — `setDriver` is initialization, not user action. Keep callbacks for `set()` only.                                              |
| The `AppSettingSelector` `<button>` nesting — `<div role="button">` or restructure? | Use `<div role="button" tabindex="0" onkeydown>` for the inner items. Simpler than restructuring.                                  |
| Should the barrel test be in vitest or a standalone script?                         | vitest — it's already configured, runs with `just test`.                                                                           |
| `MoneyDisplay` and `MoneyInput` — are they also missing from exports?               | [ASSUMPTION] Yes, they likely are. The barrel test in Phase 3 will confirm. Add all three component exports in Phase 1 to be safe. |
