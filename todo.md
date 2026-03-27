# rune-lab — Architectural Refactor Plan

## "Derive Everything, Declare Nothing Redundant"

> v0.4.x → v0.5.0 | Principal Architect Spec | March 2026

---

## 0. Executive Summary

rune-lab is a Svelte 5 micro-framework for composable, plugin-driven UI
applications. Its kernel provides a registry, persistence, and context layer;
individual runes are self-contained feature modules that plug into that kernel.
The current architecture is correct in intent but carries three compounding
diseases inherited from Java-style TypeScript: parallel `IStore` interfaces that
drift from their concrete classes, manually-maintained `.d.ts` files that should
be compiler output, and redundant `plugin.ts` files that duplicate what `mod.ts`
should own. This plan eliminates all three by applying the same principle Rust's
type system enforces by default: **types are derived from data and structure,
never declared in parallel with them.** The result is a codebase where adding a
new rune requires touching exactly one file, where no type can drift from its
implementation, and where the kernel is small enough to fully understand in an
afternoon.

---

## 1. Context & Constraints

**Project:** rune-lab — Svelte 5, Deno, Vite/vite-plus, paraglide-js i18n,
TypeScript strict, published npm package

**Current version:** 0.4.1 — actively breaking on `just quality` with 6
svelte-check errors, 3 warnings

**Goals — "done" looks like:**

- `just quality` passes with zero errors and zero warnings (excluding
  auto-generated paraglide dir)
- `vp build` succeeds — CSS filename error resolved
- No `IStore` type exists anywhere in `src/`
- No handwritten `.d.ts` file exists in `src/`
- Each rune's plugin declaration lives in its `mod.ts` — no separate `plugin.ts`
- `theme`, `language`, `currency` stores are all instances of the same factory —
  not three separate classes
- Adding a new rune requires creating one directory with `mod.ts` + store(s) +
  components — nothing else

**Stack rules (non-negotiable):**

- Svelte 5 runes syntax (`$state`, `$derived`, `$effect`, `$props`)
- Deno-first with npm interop via `deno.json` workspaces
- `just quality` = `deno fmt` + `deno lint` + `deno check` + `svelte-check` —
  must stay green
- Kernel has zero UI dependencies — pure logic only
- Runes can depend on kernel, never on each other

**Out of scope:**

- paraglide auto-generated directory errors (correct by design, gitignored)
- i18n message content
- Adding new features (this is a refactor, not a feature sprint)

**Assumptions:**

- [ASSUMPTION] `plugin.ts` files currently export a single plugin descriptor
  object — merging into `mod.ts` is a re-export, not a logic change
- [ASSUMPTION] `kernel/persistence/createConfigStore.svelte.ts` already exists
  and is the intended factory — it just isn't being used by
  theme/language/currency stores yet
- [ASSUMPTION] The `.d.ts` files seen in the old `state/` structure were from
  the previous architecture and are already gone in the current `src/` structure
  — confirmed by the current tree showing no `.d.ts` in `src/`
- [ASSUMPTION] `money/types.ts` follows the same IStore pattern as
  `layout/types.ts` even though it isn't currently throwing errors (same
  structure, just hasn't been exercised in that code path yet)
- [ASSUMPTION] `monitor/src/mod.ts` is a stub — lowest priority

---

## 2. Architecture Overview

### The Mental Model: Kernel + Runes

The architecture is a hub-and-spoke where the kernel is the hub and runes are
the spokes. Runes never know about each other. The kernel never knows about
runes. `RuneProvider.svelte` is the composition root that wires them together at
runtime.

```
┌─────────────────────────────────────────────────────────┐
│                    RuneProvider.svelte                   │
│              (composition root — owns nothing)           │
└──────────────┬────────────────────────────┬─────────────┘
               │ registers via              │ provides context
               ▼                            ▼
┌─────────────────────┐        ┌────────────────────────────┐
│       KERNEL        │        │          RUNES             │
│                     │        │                            │
│  registry/          │        │  layout/                   │
│    definePlugin()   │◄───────│    mod.ts (plugin + API)   │
│    topological sort │        │    store.svelte.ts          │
│                     │        │    theme.svelte.ts  ──┐    │
│  persistence/       │        │    language.svelte.ts─┤    │
│    createConfigStore│◄───────│    currency (money)───┘    │
│    drivers (ls/idb) │        │                            │
│                     │        │  palettes/                 │
│  context/           │        │    mod.ts (plugin + API)   │
│    getStore(key)    │◄───────│    commands/store           │
│    setContext()     │        │    shortcuts/store          │
│                     │        │    notifications/store     │
│  tokens/            │        │                            │
│    CSS prop tokens  │        │  kythrill/                 │
│                     │        │    mod.ts (plugin + API)   │
│  actions/           │        │                            │
│    portal           │        │  plugins/money/            │
│    shortcut-listener│        │    mod.ts (plugin + API)   │
└─────────────────────┘        └────────────────────────────┘
         ▲
         │ auto-generated types (not handwritten)
         │
┌─────────────────────┐
│       i18n/         │
│  translations/*.json│
│  paraglide/ (gen)   │
└─────────────────────┘
```

### Core Domain vs Supporting Domains

**Core domain:** `kernel/registry` — the `definePlugin` builder and topological
sort. This is the heart of the framework. Everything else depends on it; it
depends on nothing.

**Supporting domains:**

- `kernel/persistence` — pluggable storage (localStorage, IndexedDB, memory)
- `kernel/context` — Svelte context bridge between kernel stores and components
- `runes/*` — feature domains, each fully self-contained

---

## 3. Design Patterns & Code Standards

### Pattern 1: Derive-Don't-Declare (Rust `type` alias philosophy)

**Applied to:** Every `types.ts` file across all runes.

**What:** A `types.ts` file contains only two categories of thing — data shape
types (plain objects, configs, events) and types **derived** from existing
structures via TypeScript's type operators (`typeof`, `Pick`, `ReturnType`,
`keyof`, indexed access). It contains zero re-declarations of anything that
already exists as a class or const.

**Why:** The `ILayoutStore` / `LayoutStore` drift is a direct consequence of
declaring the same shape twice. TypeScript's structural type system makes this
redundant. The class IS its own type. `types.ts` should be a derivation layer,
not a shadow-declaration layer.

**How it's applied:**

- `layout/types.ts` — contains `WorkspaceConfig`, `NavItem`, `LayoutEvent`. Does
  NOT contain `ILayoutStore`.
- `shortcuts/types.ts` — contains `ShortcutBinding`, `ScopeDefinition`. Does NOT
  contain `IShortcutStore`.
- `money/types.ts` — contains `MoneyAmount`, `ExchangeRate`. `CurrencyCode` is
  derived from `typeof CURRENCIES[number]['code']`, never declared manually.
- All const arrays use `as const` — types flow from data, never alongside it.

**At year 3:** New fields on a store automatically appear in all consumers —
zero maintenance. **At year 5:** New runes follow the same pattern by convention
— `types.ts` is always lean. **At year 10:** TypeScript's structural system is
the most stable part of the language — this pattern cannot become obsolete.

**Standards:**

- `grep -r "interface I[A-Z]" src/` must return empty — enforced as a fitness
  function in CI
- `types.ts` files must not import from `store.svelte.ts` of the same rune (data
  shapes are pre-store)
- Exception allowed: type aliases that use `ReturnType<typeof factory>` or
  `InstanceType<typeof Class>` are explicitly permitted because they derive, not
  declare

---

### Pattern 2: Generic Config Store Factory (Pattern 1 from ts-guide-patterns.md, adapted)

**Applied to:** `layout/theme.svelte.ts`, `layout/language.svelte.ts`,
`plugins/money/currency.svelte.ts`

**What:** A single `createConfigStore` factory in `kernel/persistence/` that
accepts a typed config object and returns a fully reactive Svelte 5 store class
instance. The three stores that currently each span ~80-100 lines of
near-identical code become three ~5-line declarations.

**Why:** Theme, language, and currency are structurally identical: a readonly
list of items, a current selection, persistence via a driver, set/get
operations. Writing this three times guarantees the implementations diverge over
time (they already have slightly different field names and error handling). The
factory collapses them to a single source of truth.

**How it's applied:**

- `kernel/persistence/createConfigStore.svelte.ts` (already exists) becomes the
  canonical factory
- It accepts:
  `{ items: readonly T[], idKey: keyof T, storageKey: string, driver: PersistenceDriver }`
- It returns an instance whose type is `ReturnType<typeof createConfigStore<T>>`
  — consumers use this derived type, never a manually written interface
- The `driver` parameter wires it into the kernel persistence system, not
  directly to `localStorage` (unlike the guide's naive example)
- `theme.svelte.ts`, `language.svelte.ts`, `currency.svelte.ts` become
  single-call files: `export const themeStore = createConfigStore({...})`

**At year 3:** Adding a new "config-style" store (e.g., timezone, date format)
takes 5 lines. **At year 5:** Swapping the persistence driver (e.g., moving to
IndexedDB) happens in one place. **At year 10:** The factory is a stable
abstraction — its interface is small and its behavior is well-tested once.

**Standards:**

- The factory must work with any `T` that has at least one string/number key
  field — generic constraint, not any-typed
- The factory must not use `localStorage` directly — always goes through
  `PersistenceDriver`
- Store instances created by the factory are typed via `ReturnType<>`, never via
  a manually written interface

---

### Pattern 3: Plugin Builder (Fluent Builder with Phantom Types, Pattern 8 from guide)

**Applied to:** `kernel/registry/` — the `definePlugin` function that every
rune's `mod.ts` calls.

**What:** `definePlugin` is a builder function (not a class — functions compose
better in Svelte 5 context) that accepts a plugin ID and returns a chainable
builder. Each step narrows the phantom type state. `build()` is only available
when required fields are present — enforced at compile time, not at runtime.

**Why:** Currently every `plugin.ts` manually constructs a plugin descriptor
object. The shape of that object is defined in `kernel/registry/types.ts`. If
the registry's required fields change, every `plugin.ts` silently breaks at
runtime rather than failing at compile time. The builder inverts this — the
registry exports a builder, and the plugin declarations use it. Shape
correctness is guaranteed by the builder's return type.

**How it's applied:**

- `kernel/registry/mod.ts` exports `definePlugin(id: string)` — the entry point
- The builder chain: `definePlugin(id).dependsOn([...]).stores([...]).build()` —
  `.build()` only available when all required fields are provided
- `stores([...])` accepts `RuneSlot[]` — the slot type is also defined in
  `kernel/registry/`
- The returned plugin descriptor's type is
  `ReturnType<typeof definePlugin(...).build>` — derived, not declared
- This type is what `kernel/registry/types.ts` exports as `RunePlugin` — one
  source of truth

**At year 3:** Adding a required field to plugins (e.g., a version string)
becomes a builder step — all plugins that don't set it get a compile error
immediately. **At year 5:** The builder pattern makes the plugin API
discoverable via autocomplete — no need to read documentation to know what a
plugin needs. **At year 10:** The phantom type approach is pure TypeScript — no
runtime overhead, no external dependency.

---

### Pattern 4: Ports & Adapters for Connection Factories

**Applied to:** `layout/connection-factory.ts`

**What:** Connection factory functions declare their input as the minimum
`Pick<Store, keys>` slice they actually need — not the full store class. This is
a Port (the minimum required interface) rather than a direct class dependency.

**Why:** The current error
`ILayoutStore is missing #storageNamespace, #initialized...` happens because
`ILayoutStore` tried to be a full-class interface and failed.
`Pick<LayoutStore, 'workspaces' | 'activeWorkspace'>` succeeds because it only
picks what the function actually reads. It's also independently testable — you
can pass a plain object that satisfies the pick type, no need to instantiate the
full store.

**How it's applied:**

- `createNavigationConnection` accepts
  `Pick<LayoutStore, 'workspaces' | 'activeWorkspace' | 'navigateTo'>`
- `createWorkspaceConnection` accepts
  `Pick<LayoutStore, 'workspaces' | 'activateWorkspace'>`
- The concrete `LayoutStore` class satisfies both picks automatically —
  structural typing
- Context getter `getLayoutStore()` returns `LayoutStore` directly — no
  interface needed

**Standards:**

- Every connection factory function's first parameter must be a `Pick<>` — never
  the full class
- Connection factories must not mutate their input — read-only by contract
- Testability requirement: every connection factory must be testable with a
  plain object literal that satisfies its `Pick` type

---

### Pattern 5: mod.ts as Module Boundary (Rust `mod.rs` / `pub use`)

**Applied to:** Every rune — eliminates `plugin.ts` files.

**What:** Each rune's `mod.ts` is its single public API surface. It exports
everything the outside world can see, and it also contains (or re-exports) the
plugin declaration. There is no separate `plugin.ts`.

**Why:** In Rust, `mod.rs` (or the module file) controls what is `pub`. The
module IS the API. Having a separate `plugin.ts` means the plugin descriptor
lives outside the module's own exports — it's a second public surface. When the
module changes, two files must be updated. Merging them into `mod.ts` makes the
module self-describing.

**How it's applied:**

- `runes/layout/src/mod.ts` exports all components, the store, utility types,
  AND defines/exports the layout plugin via `definePlugin(...).build()`
- `runes/palettes/src/mod.ts` same pattern
- `runes/kythrill/src/mod.ts` same pattern
- `runes/plugins/money/src/mod.ts` same pattern
- The plugin descriptor is the last thing defined in `mod.ts` — it imports from
  within the module and assembles the full description

**At year 3:** New rune = new directory with `mod.ts` — that's it. No mental
model to learn. **At year 5:** The public API surface of every rune is findable
in exactly one file — grep-friendly, documentation-friendly. **At year 10:**
This mirrors the module conventions of every major language. It will never feel
wrong.

**Standards:**

- No file named `plugin.ts` may exist in `src/` — enforced as a fitness function
- `mod.ts` must be the only file that imports from outside its own rune (i.e.,
  imports from `kernel/`)
- Internal files within a rune import from siblings, never from `mod.ts` of the
  same rune (no circular re-export)

---

## 4. Component Map & Directory Structure

### Proposed Target Structure

```
src/
├── mod.ts                          ← library public API (re-exports from kernel + runes)
├── RuneProvider.svelte             ← composition root (unchanged structurally)
│
├── i18n/                           ← (unchanged)
│   ├── message-resolver.ts
│   ├── message-resolver.test.ts
│   └── translations/*.json
│
├── kernel/
│   ├── deno.json
│   └── src/
│       ├── mod.ts                  ← kernel public API
│       │
│       ├── registry/               ← CORE DOMAIN
│       │   └── mod.ts              ← definePlugin() builder, RuneSlot, topological sort
│       │                             (was: mod.ts + plugin.ts + types.ts → one file)
│       │
│       ├── persistence/
│       │   ├── mod.ts              ← public API
│       │   ├── createConfigStore.svelte.ts  ← THE factory (most important file in kernel)
│       │   ├── drivers.ts          ← PersistenceDriver implementations
│       │   ├── drivers.test.ts
│       │   ├── provider.ts         ← PersistenceProvider context
│       │   ├── provider.test.ts
│       │   └── types.ts            ← PersistenceDriver interface, config shapes ONLY
│       │
│       ├── context/
│       │   ├── mod.ts              ← public API
│       │   ├── app.svelte.ts       ← AppStore (app-level reactive state)
│       │   ├── context.ts          ← context key constants
│       │   ├── stores.svelte.ts    ← store registry map
│       │   └── useRuneLab.ts       ← composable for consumers
│       │       (types.ts REMOVED — types derived from above, not declared separately)
│       │
│       ├── actions/
│       │   ├── portal.ts
│       │   └── shortcut-listener.ts
│       │
│       └── tokens/
│           └── props.ts            ← CSS custom property token definitions
│
└── runes/
    │
    ├── layout/
    │   ├── deno.json
    │   └── src/
    │       ├── mod.ts              ← exports ALL + plugin declaration (plugin.ts REMOVED)
    │       ├── store.svelte.ts     ← LayoutStore class (ILayoutStore REMOVED from types.ts)
    │       ├── theme.svelte.ts     ← createConfigStore({items: THEMES, ...})
    │       ├── language.svelte.ts  ← createConfigStore({items: LANGUAGES, ...})
    │       ├── types.ts            ← WorkspaceConfig, NavItem, LayoutEvent ONLY
    │       ├── connection-factory.ts ← Pick<LayoutStore,...> boundaries
    │       ├── portal.ts
    │       ├── APP_CONFIGURATIONS.ts
    │       └── *.svelte            ← (all components unchanged)
    │
    ├── palettes/
    │   ├── deno.json
    │   └── src/
    │       ├── mod.ts              ← exports ALL + plugin declaration (plugin.ts REMOVED)
    │       ├── commands/
    │       │   ├── store.svelte.ts ← CommandStore class
    │       │   ├── mod.ts          ← commands sub-API
    │       │   └── CommandPalette.svelte
    │       ├── shortcuts/
    │       │   ├── store.svelte.ts ← ShortcutStore class (sortedScopes lives HERE)
    │       │   ├── types.ts        ← ShortcutBinding, ScopeDefinition ONLY (IShortcutStore REMOVED)
    │       │   ├── useShortcuts.ts ← composable using Pick<ShortcutStore,...>
    │       │   ├── mod.ts
    │       │   └── ShortcutPalette.svelte
    │       └── notifications/
    │           ├── store.svelte.ts
    │           ├── bridge.ts
    │           ├── mod.ts
    │           ├── NotificationBell.svelte
    │           └── Toaster.svelte
    │
    ├── kythrill/
    │   ├── deno.json
    │   └── src/
    │       ├── mod.ts              ← exports ALL + plugin declaration (plugin.ts REMOVED)
    │       ├── app.svelte.ts       ← Kythrill app state
    │       └── Kythrill.svelte
    │
    └── plugins/
        ├── money/
        │   ├── deno.json
        │   └── src/
        │       ├── mod.ts          ← exports ALL + plugin declaration (plugin.ts REMOVED)
        │       ├── currency.svelte.ts  ← createConfigStore({items: CURRENCIES, ...})
        │       ├── exchange-rate.svelte.ts
        │       ├── types.ts        ← MoneyAmount, ExchangeRate + DERIVED CurrencyCode
        │       ├── money-primitive.ts
        │       ├── money.ts
        │       ├── strategies.ts
        │       ├── useMoney.ts     ← Pick<CurrencyStore,...> boundaries
        │       ├── useMoneyFilter.ts
        │       └── *.svelte
        └── monitor/
            ├── deno.json
            └── src/
                └── mod.ts          ← stub (unchanged)
```

### Component Responsibilities

**`kernel/registry/mod.ts`**

- Responsibility: Defines the plugin contract and provides `definePlugin`
  builder. Runs topological dependency sort at boot time.
- Exposes: `definePlugin`, `RuneSlot`, `RunePlugin` (derived type),
  `initializeStores`, `STORE_REGISTRY`
- Consumes: nothing — zero dependencies
- Must NOT: import from any rune, any UI library, or any persistence module

**`kernel/persistence/createConfigStore.svelte.ts`**

- Responsibility: Generic factory that produces reactive config stores wired to
  the persistence driver
- Exposes: `createConfigStore<T>(options)` — returns a typed store instance
- Consumes: `PersistenceDriver` from `persistence/types.ts`
- Must NOT: import from any rune, use `localStorage` directly, be
  Svelte-component-aware

**`kernel/context/`**

- Responsibility: Bridge between kernel store instances and Svelte component
  context
- Exposes: `getStore(key)`, `useRuneLab()`, context key constants
- Consumes: `kernel/registry`, `kernel/persistence`
- Must NOT: contain business logic, import from any rune

**`runes/layout/src/mod.ts`**

- Responsibility: Public API surface for the layout rune + plugin
  self-declaration
- Exposes: `LayoutStore`, `themeStore`, `languageStore`, all layout components,
  `layoutPlugin`
- Consumes: `kernel/registry`, `kernel/persistence`
- Must NOT: import from any other rune

**`runes/layout/src/types.ts`**

- Responsibility: Data shapes for the layout domain
- Exposes: `WorkspaceConfig`, `NavItem`, `LayoutEvent`
- Must NOT: re-declare any store shape, contain any `IXxx` interface

---

## 5. Trade-off Analysis

```
DECISION: How to expose store types to connection factories and composables
OPTIONS CONSIDERED:
  A. IStore interfaces — explicit contract, declared manually
     PROS: Familiar to Java/C# devs, explicit intent
     CONS: Proven to drift (already happened), private fields impossible to satisfy,
           doubles maintenance surface forever, TS structural typing makes it redundant
  B. Export concrete class, use it directly everywhere
     PROS: Zero drift, one source of truth, fully structural
     CONS: Exposes private fields nominally (though TS enforces access at compile time)
  C. Export class + Pick<> slice types per consumer boundary
     PROS: Minimal surface at each boundary, independently testable,
           zero drift (derived from class), no interface to maintain
     CONS: Slightly more verbose function signatures
CHOSEN: C for connection factories and composables, B for context getters
REASON: Context getters own the store — they return the full class. Connection factories
        and composables are adapters — they should only see what they need. Pick<>
        gives adapter-style isolation without any maintenance cost.
REVISIT IF: You ever need to support multiple concrete implementations of the same
            store concept (e.g., two different LayoutStore backends). At that point,
            introduce a formal interface. Not before.
```

```
DECISION: Where to declare the plugin descriptor
OPTIONS CONSIDERED:
  A. Separate plugin.ts per rune — current approach
     PROS: Explicit separation of concerns
     CONS: Two files to update per rune change, plugin declaration can get out of sync
           with what mod.ts actually exports, extra cognitive load
  B. Inline in mod.ts
     PROS: One file = one module = one place to look, mirrors Rust module convention,
           plugin declaration has direct access to everything exported by the module
     CONS: mod.ts becomes slightly longer
  C. Auto-generated plugin descriptor from mod.ts exports (macro-style)
     PROS: Zero boilerplate
     CONS: Requires a Vite plugin or Deno transform — significant complexity,
           fragile, hard to debug
CHOSEN: B — inline in mod.ts
REASON: The marginal increase in mod.ts length is worth eliminating a whole category
        of "two files out of sync" bugs. C is elegant in theory but the tooling cost
        is not justified at this scale.
REVISIT IF: The number of runes grows beyond ~20 and mod.ts files become unwieldy.
            At that point, consider a separate plugin.ts that imports from mod.ts
            (the reverse of today) — but the current direction should be tried first.
```

```
DECISION: createConfigStore factory — return type strategy
OPTIONS CONSIDERED:
  A. Return a class constructor (not an instance) — consumers call `new`
     PROS: Familiar OOP pattern
     CONS: Doesn't compose well with Svelte 5 rune initialization pattern,
           adds a call site every time
  B. Return an instance directly (module-level singleton)
     PROS: Works with Svelte 5 context model, `themeStore` just works
     CONS: Instance is created at module load time — must handle SSR carefully
  C. Return a factory function that creates an instance — consumers call it once
     PROS: Lazy initialization, testable, works with SSR
     CONS: One more call site per store
CHOSEN: B for config stores (theme/language/currency are singletons by nature),
        C for stores that need per-use instantiation
REASON: Theme, language, currency are application-level singletons. Returning the
        instance directly matches how themeStore is used throughout the codebase today.
        SSR guard (typeof window !== 'undefined') handles the SSR case inside the factory.
REVISIT IF: rune-lab ever needs to support multiple simultaneous instances of the
            same config (e.g., multi-tenant apps). At that point, option C for all.
```

```
DECISION: kernel/registry — collapse to single mod.ts vs keep types.ts
OPTIONS CONSIDERED:
  A. Single mod.ts — all registry types, definePlugin builder, topological sort
     PROS: One file to understand the entire registry contract
     CONS: Longer file (~150 lines estimated)
  B. Keep types.ts for type exports, mod.ts for runtime logic
     PROS: Separation matches the "types file" convention already in place
     CONS: Registry types are inseparable from the builder API — splitting them
           creates an artificial boundary that consumers have to cross to understand either
CHOSEN: A — single mod.ts for registry
REASON: The registry is the kernel's most important abstraction. It should be
        comprehensible in one file. ~150 lines is not too long. The types ARE the API
        — separating them into types.ts adds a hop for zero benefit.
REVISIT IF: Registry grows significantly (e.g., plugin versioning, hot-reload, remote
            plugin loading). At that point, split is justified.
```

```
DECISION: RuneProvider.svelte — plugin registration in reactive vs non-reactive scope
OPTIONS CONSIDERED:
  A. Fix warning with $derived — make plugins reactive
     PROS: Technically correct for Svelte 5 reactive model
     CONS: Plugins are NOT intended to change at runtime — making them reactive
           implies they could, which is misleading and could cause re-registration bugs
  B. Wrap loops in untrack()
     PROS: Suppresses the warning without structural change
     CONS: Suppressing a warning with untrack is a band-aid, not a fix
  C. Move registration to a non-reactive initialization block (onMount guard or
     effect with empty deps equivalent)
     PROS: Architecturally correct — initialization is a one-time side effect, not
           a reactive computation. Svelte 5 warning is telling you exactly this.
     CONS: Slight restructure of RuneProvider.svelte
CHOSEN: C
REASON: The Svelte compiler is right. Plugin registration is initialization, not
        reactivity. Treating it as reactive would be wrong even if it compiled cleanly.
        The fix is to align the code with the intent, not to silence the warning.
```

---

## 6. Phased Implementation Plan

### Phase 1 — Stop the Bleeding

**Goal:** `just quality` passes with zero errors. `vp build` succeeds. No
functional changes.

**Components to change:**

1. `package.json` — add `name` field (fixes CSS bundle error in vp build)
2. `layout/types.ts` — delete `ILayoutStore`, keep only data shapes
3. `kernel/context/` — change `getLayoutStore()` return type to `LayoutStore`
4. `layout/connection-factory.ts` — change parameter types to
   `Pick<LayoutStore, ...>`
5. `shortcuts/types.ts` — delete `IShortcutStore`, confirm `sortedScopes` on
   `ShortcutStore`
6. `shortcuts/store.svelte.ts` — add `sortedScopes` if missing
7. `RuneProvider.svelte` — move plugin registration loops to non-reactive init
   block
8. `CommandPalette.svelte` — add missing `Icon` import

**Dependencies:** None — this phase is self-contained.

**Exit criteria:** `just quality` output shows 0 errors, 0 warnings. `vp build`
exits 0.

**Risk flags:**

- [RISK] If `sortedScopes` doesn't exist on `ShortcutStore`, adding it may
  change the store's public API — verify the signature before adding
- [RISK] Changing `getLayoutStore()` return type may surface additional
  consumers that were relying on `ILayoutStore` — do a full grep before changing

---

### Phase 2 — Collapse the Config Stores

**Goal:** `theme.svelte.ts`, `language.svelte.ts`, `currency.svelte.ts` are all
`createConfigStore` calls. No three-way duplication.

**Components to change:**

1. `kernel/persistence/createConfigStore.svelte.ts` — verify it accepts a
   `PersistenceDriver` parameter and handles SSR guard
2. `layout/theme.svelte.ts` — replace class with
   `createConfigStore({items: THEMES, idKey: 'name', storageKey: 'rune-lab:theme', driver})`
   call
3. `layout/language.svelte.ts` — same pattern with `LANGUAGES`
4. `plugins/money/currency.svelte.ts` — same pattern with `CURRENCIES`
5. Update all consumers of the three stores — they now use the factory's return
   type (`ReturnType<typeof createConfigStore<Theme>>`) not a bespoke class type

**Dependencies:** Phase 1 must be complete.

**Exit criteria:**
`grep -r "class ThemeStore\|class LanguageStore\|class CurrencyStore" src/`
returns empty. `just quality` still clean. Existing tests for currency pass.

**Risk flags:**

- [HIGH RISK] If `createConfigStore` doesn't yet accept a `PersistenceDriver`,
  it needs to be extended before this phase — the kernel factory must wire to
  the driver system, not to `localStorage` directly
- [RISK] The three stores may have custom methods beyond get/set/current —
  inventory these before collapsing to ensure the factory covers them, or extend
  the factory

---

### Phase 3 — Kill plugin.ts Files

**Goal:** Every rune's plugin declaration lives in `mod.ts`. No separate
`plugin.ts` files exist.

**Components to change:**

1. `kernel/registry/mod.ts` — ensure `definePlugin` builder is exported and
   stable
2. `runes/layout/src/mod.ts` — append plugin declaration, delete `plugin.ts`
3. `runes/palettes/src/mod.ts` — append plugin declaration, delete `plugin.ts`
4. `runes/kythrill/src/mod.ts` — append plugin declaration, delete `plugin.ts`
5. `runes/plugins/money/src/mod.ts` — append plugin declaration, delete
   `plugin.ts`
6. Update `RuneProvider.svelte` imports — it imports plugins from rune `mod.ts`
   now

**Dependencies:** Phase 2 complete.

**Exit criteria:** `find src/ -name "plugin.ts" | wc -l` returns 0.
`just quality` clean. All existing tests pass.

**Risk flags:**

- [RISK] `RuneProvider.svelte` currently imports from `plugin.ts` paths — update
  all import paths carefully

---

### Phase 4 — Registry Consolidation

**Goal:** `kernel/registry/` is a single `mod.ts`. `plugin.ts` and `types.ts`
inside registry are collapsed.

**Components to change:**

1. Move content of `kernel/registry/plugin.ts` into `kernel/registry/mod.ts`
2. Move content of `kernel/registry/types.ts` into `kernel/registry/mod.ts`
   (only types not derivable from the builder remain)
3. Delete `kernel/registry/plugin.ts` and `kernel/registry/types.ts`
4. Update all import paths that referenced those files

**Dependencies:** Phase 3 complete.

**Exit criteria:** `kernel/registry/` contains only `mod.ts` and
`registry.test.ts`. `just quality` clean.

**Risk flags:**

- [RISK] Any external consumer of the npm package that imported from
  `@rune-lab/kernel/registry/types` will break — this is a minor breaking
  change, document in CHANGELOG

---

### Phase 5 — Fitness Functions

**Goal:** The architecture enforces itself. No manual review needed to catch
regressions.

**Components:**

1. Add to `justfile` quality recipe:
   `grep -r "interface I[A-Z]" src/ && echo "IStore interfaces found!" && exit 1 || echo "✓ No IStore interfaces"`
2. Add:
   `find src/ -name "plugin.ts" | grep -v scripts | wc -l | xargs -I{} test {} -eq 0 && echo "✓ No plugin.ts files" || (echo "plugin.ts files found!" && exit 1)`
3. `kernel/registry/registry.test.ts` — add a test that verifies topological
   sort output for a known dependency graph
4. Add `vp build` to the quality recipe so build errors are caught locally, not
   in CI

**Dependencies:** Phase 4 complete.

**Exit criteria:** `just quality` includes architectural fitness checks. Any
regression in architecture fails the quality gate.

---

## 7. Implementation Management

### Sequencing (Dependency Graph)

```
Phase 1 (unblock build)
  └── Phase 2 (factory collapse — needs clean base)
        └── Phase 3 (plugin.ts removal — needs stable mod.ts structure)
              └── Phase 4 (registry consolidation — last structural change)
                    └── Phase 5 (fitness functions — can only validate what's already clean)
```

**Critical path:** Phase 1 → Phase 2 → Phase 3. Everything else is sequential
cleanup.

### Breaking Changes

- [BREAKING] Removing `ILayoutStore` from exports — any external consumer using
  `import type { ILayoutStore }` will break at their compile step. Semver: minor
  version bump (v0.5.0), documented in CHANGELOG.
- [BREAKING] Removing `IShortcutStore` — same
- [BREAKING] Collapsing `kernel/registry/types.ts` — any consumer importing from
  that path breaks. Mitigate with a re-export shim for one version.
- [NON-BREAKING] `plugin.ts` → `mod.ts` consolidation — if `mod.ts` re-exports
  the plugin descriptor under the same name, this is import-path-only breaking,
  fixable with a one-line re-export

### Ownership

Since this appears to be a solo project:

- Phases 1–2 are high-priority, low-risk, do them first
- Phase 3 is moderate refactor, do it before adding any new rune
- Phases 4–5 are polish, do them before publishing v0.5.0

---

## 8. Validation & Testing Strategy

| Layer                     | Test type            | What it verifies                                                                       | Where                                          |
| ------------------------- | -------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Config store factory      | Unit test            | `createConfigStore` returns correct initial state, `set()` persists, `get()` retrieves | `kernel/persistence/createConfigStore.test.ts` |
| Registry topological sort | Unit test            | Plugins with deps sort correctly, circular deps throw                                  | `kernel/registry/registry.test.ts`             |
| Persistence drivers       | Unit test (existing) | localStorage and memory drivers behave identically                                     | `drivers.test.ts`                              |
| Store-to-context bridge   | Integration test     | `getLayoutStore()` returns the correct store instance                                  | `context/context.test.ts`                      |
| Connection factories      | Type-only test       | `Pick<LayoutStore,...>` satisfies factory parameter                                    | compile-time via `deno check`                  |
| Full plugin boot          | Integration test     | `RuneProvider` with real plugins initializes without error                             | `RuneProvider.test.ts` (new)                   |
| Architecture              | Fitness function     | No `IStore` interfaces, no `plugin.ts` files, no circular imports                      | `just quality` recipe                          |

### Architecture Fitness Functions (in `just quality` recipe)

These run on every `just quality` call — they enforce the architecture
automatically:

1. **No IStore interfaces:** `grep -r "interface I[A-Z]" src/` must return empty
2. **No plugin.ts files:** `find src/runes -name "plugin.ts"` must return empty
3. **No cross-rune imports:** Each rune's internal files must not import from
   sibling runes — verifiable via a simple deno lint custom rule or grep
4. **Build succeeds:** `vp build` as the last step of quality (not just
   type-checking)

### Local Dev Gate

Before any commit: `just quality` must pass. This now includes build. The
quality command is the contract.

---

## 9. Open Questions & Risks

1. **Does `createConfigStore` currently accept a `PersistenceDriver`
   parameter?** The file exists in `kernel/persistence/` but the factory as
   described in the ts-guide-patterns uses `localStorage` directly. If the
   driver parameter isn't there yet, Phase 2 requires a kernel change before the
   rune changes — this becomes the actual critical path blocker.

2. **What custom methods do the current theme/language/currency stores have
   beyond get/set/current?** Inventory before collapsing. If `themeStore` has a
   `resolveIcon()` method that doesn't belong in the generic factory, it needs
   to be either added as a factory option or composed on top of the factory
   result.

3. **Does `kythrill/src/app.svelte.ts` import `ILayoutStore`?** The kythrill
   rune has its own `app.svelte.ts` which suggests it may have UI state that
   knows about layout. If it imports `ILayoutStore`, removing that type in Phase
   1 will cascade. Grep before Phase 1.

4. **The `RuneProvider.svelte` warning about `plugins` state** — is `plugins`
   declared as `$props()` or `$state()`? The fix is different for each case.
   Confirm before Phase 1.

5. **`monitor/src/mod.ts` is a stub.** It's a registered workspace but has no
   stores or components. If it's placeholder, that's fine. If it's expected to
   be functional, it needs to be scoped before any architecture work to avoid it
   becoming a forgotten loose end.
