# Rune Lab — Implementation Context

> Code-level context for any model picking up this work. Pairs with
> `PROJECT_MANIFEST.md` (the why). This document reflects a direct read of
> `src/packages/{core,ui,plugins/{layout,palettes}}` as of the
> `rune-lab--src-packages-20260715` snapshot. `i18n` and `observer` were not
> included in that snapshot and are not covered here. Section 6 is the part you
> came for if you asked "do I have all checks?" — read it before touching
> anything.

---

## 1. Stack & libraries

- **Runtime / tooling:** Deno workspace (`deno.json` per package, `imports`
  maps, `workspace:*` specifiers), Vite for the app build, `vite-plus/test` as
  the test runner/assertion library alongside `@std/assert` in core.
- **DI / effects:** `effect` (npm:effect@^3) — `Context.GenericTag` for service
  identity, `Layer`/`Layer.effect`/`Layer.provideMerge`/`Layer.merge` for
  composition, `ManagedRuntime` to run the assembled environment, `Schema` for
  runtime validation/decoding/encoding, `SubscriptionRef` + `Stream` for the
  reactive primitive under state cells, `Effect.addFinalizer`/scoped layers for
  disposal.
- **UI:** Svelte 5 (runes: `$state`, `$derived.by`, `$props`,
  `svelte/reactivity`'s `createSubscriber`), DaisyUI + Tailwind v4 for styling,
  `esm-env` for `BROWSER`/`DEV` flags (never `typeof window` checks directly).
- **Domain libs (palettes):** `hotkeys-js` for shortcut binding.
- **Domain libs (i18n, referenced but out of snapshot):** Paraglide/inlang-style
  message resolution (`project.inlang/settings.json`, a `createMessageResolver`
  helper), a Dinero-adjacent money primitive layer.

## 2. Repository shape (as it exists, not as planned)

```
src/packages/
├─ core/            @rune-lab/core — framework-free kernel + forge
├─ ui/               @rune-lab/svelte — the Svelte adapter (note: package name is
│                    "svelte", not "ui"; imported everywhere as @rune-lab/svelte)
└─ plugins/
   ├─ layout/        @rune-lab/layout
   └─ palettes/      @rune-lab/palettes — also currently houses a nested,
                     separately-idd "theme" plugin (see §6.C)
```

`i18n` and `observer` exist elsewhere in the real tree but weren't part of this
review's input.

## 3. Patterns actually implemented (with real anchors)

### 3.1 The forge — declarative plugin spec → interpreted kernel wiring

`core/src/forge/{define-plugin,define-slot,define-settings,descriptors}.ts`
define the spec vocabulary: a `SlotSpec` has `create` (a factory receiving
`{config, persistence, stores}`), optional `config` (an Effect `Schema`),
`persist` (`boolean | string[]`), `dependsOn`, `expose`. `definePlugin`
normalizes a spec into a `ForgedPlugin` and derives, per slot, a
`SlotDescriptor` (`{slotName, contextKey, accessorName}`) via `descriptors.ts`'s
pure functions — `getAccessorName` (`get${Capitalized}Store`) and
`getContextSymbol` (`Symbol.for('rl:${pluginId}:${slotName}')`). **Note:**
`definePlugin` currently supports **two input shapes** simultaneously — the new
`{slots}` format and a legacy `{stores: StoreRegistryEntry[]}` format inherited
from a pre-forge design — detected at runtime by which key is present. This
dual-mode is a live migration seam, not an accident; see §6.B for which plugins
are actually on which side of it.

`core/src/kernel/wiring.ts`'s `compileEnvironment` is where specs become an
executable Effect environment: plugin-level topological sort over `requires`
(throwing a named "missing requirement" error before sorting, and a named
circular-dependency error from `utils/graph.ts`'s shared `topologicalSort`),
then per-slot normalization (legacy stores and new slots are merged into one
`NormalizedSlot[]` list), then slot-level topological sort over `dependsOn`
(with dotted `otherPlugin.slot` syntax for cross-plugin deps, validated against
that plugin's declared `requires`), then one `Layer.effect` per slot assembled
via `Layer.provideMerge` into a single environment, run through
`ManagedRuntime`. **This part is real, correct, load-bearing work** — it
faithfully implements the plugin-level-dependency and
namespaced-persistence-handle design: when `slot.persist` is truthy, the handle
passed into `create` is prefixed `rl:<pluginId>:<slotName>:`; when falsy, it's
an isolated in-memory driver. A store's `dispose()` method, if present, is
registered as a scoped Effect finalizer automatically.

### 3.2 The dual state model — forged slots vs. "standard cells"

Alongside the forge, `core/src/cells/cells.ts` defines a **fixed, hardcoded**
`RuneLabCells` shape:
`{theme: string, language: string, currency: string, contributions: Record<string, readonly unknown[]>}`.
These are not slots — they're bootstrapped directly into every kernel via
`makeStateCellsLayer({theme:"light", language:"en", currency:"USD", contributions:{}})`
inside `compileEnvironment`, independent of any plugin. `StateCell`
(`cells/define-cell.ts`) wraps a `SubscriptionRef`, batches change notification
through `queueMicrotask` (coalescing synchronous multi-set bursts into one
listener pass), and exposes `get/set/subscribe/getVersion` — the exact shape the
manifesto describes as the reactive primitive runes were chosen to consume
directly.

Persistence for these three cells is **not** routed through the per-slot
`persist:`/namespaced-handle mechanism in §3.1 — it's a separate, hardcoded
path: `kernel/kernel.ts`'s `loadPersistedCells` reads a literal
`["theme", "language", "currency"]` key list on boot, and
`kernel/lifecycle.ts`'s `setCellLifecycle` checks
`nameStr === "theme" || "language" || "currency"` before writing back. Two
persistence mechanisms exist side by side, deliberately or not (see §6.A).

### 3.3 Fail-loud context accessors, generated

`ui/src/provider/context.ts`'s
`createAccessor<T>(contextKey, accessorName, storeName, pluginName)` returns a
closure wrapping `getContext` that throws a specific, actionable message on
`undefined`. `ui/src/define/plugin-kit.ts`'s `createPluginKit` walks a
`ForgedPlugin`'s descriptors and calls `createAccessor` once per exposed slot,
returning `{plugin, accessors}` where `accessors` is typed via a mapped type
keyed by the template-literal `get${Capitalize<K>}Store` pattern — the exact
"spec → typed accessors" derivation the forge was designed to produce, and it
does. `ui/src/accessors.test.ts` exercises the fail-loud message shape for eight
accessors across layout/theme/palettes (see §6.D for a problem with _how_ that
test imports its subjects).

### 3.4 Ports & Adapters split for ConfigStore

`core/src/config/config-store.ts` (`ConfigStoreImpl`) is a plain, framework-free
keyed-item store with a `PersistenceDriver` port.
`ui/src/persistence/createConfigStore.svelte.ts` (`ReactiveConfigStoreImpl`)
wraps it, mirroring `current`/`available` into `$state` and re-syncing on the
vanilla store's `onChange`. This is a clean, correctly-executed instance of the
"generic logic in core, reactive skin in ui" decision — genuinely matches the
intended design, not a partial migration.

### 3.5 Settings — schema interpreter with a custom-field escape hatch

`core/src/forge/define-settings.ts` validates and freezes a `SettingsSchema`
(`{id, label, icon?, fields[]}`) via an Effect `Schema.Struct`, each field
carrying a `target` union (`cell` | `store` | `callback`).
`ui/src/settings/SettingsFields.svelte` is the one generic renderer: it
interprets `select/toggle/text/number/range/color` primitives directly and
mounts a `custom` field's component with a normalized
`{value, commit, disabled, metadata}` contract — faithful to the
Strategy-pattern decision in the completion spec. Settings contributions are
auto-collected: any plugin spec with a `settings` field gets pushed into a
`settingsSections` contribution automatically inside `kernel.ts`'s
`extractInitialContributions`.

## 4. Naming & style conventions observed

- **Symbols:** `Symbol.for('rl:<pluginId>:<slotName>')` is the _derived_ (forge)
  scheme. Legacy stores use `Symbol.for('rl:<storeId>')` (no plugin id segment)
  unless a `contextKey` is explicitly given in the `StoreRegistryEntry`.
- **File suffix `.svelte.ts`** marks a file that uses runes (`$state`, etc.) — a
  real, consistently-followed signal for "this needs the Svelte compiler,"
  distinct from plain `.ts` logic files.
- **Factory naming:** `create<Noun>Store(ctx: SlotContext)` for slot factories;
  `get<Noun>Store()` for the generated accessor. Consistent across layout,
  theme, i18n (per the accessors test), palettes.
- **Private state:** `#privateField` class fields (not TS `private`) throughout
  — `ConfigStoreImpl`, `AppStore`, `ReactiveConfigStoreImpl`.
- **Schema fallback pattern:** a repeated `withFallback(schema, fallback)`
  helper (`Schema.transform` from `Schema.Unknown`, catching decode failure and
  returning a fallback instead of throwing) appears **twice**, near-identically,
  in `core/src/cells/schemas.ts` and `core/src/plugin/schemas.ts` — see §6.A.
- **`deno.json` shape:** every package declares `name` (`@rune-lab/<ring>`),
  `version`, `exports: {".": "./src/mod.ts"}`, an `imports` map for its own
  third-party deps (not hoisted to a root), and core additionally sets
  `publish.exclude: ["**/*.test.ts"]`.
- **Overload-based dual API:** `definePlugin` is one function with two call
  signatures (new spec vs. legacy `RunePlugin`) rather than two named functions
  — consistent with "one door in, branch internally" as the transition strategy.

## 5. Influences, explicitly

- **`logic_tracer`'s `impl_enum_token!` macro** — the direct model for the
  forge: declare data once, derive behavior. Named by the project owner as the
  reference point for what "less boilerplate, cool DX" should feel like in
  TypeScript without an actual macro system.
- **Effect-TS idioms** — `Context.Tag`/`GenericTag` for service identity,
  `Layer` composition, `Schema` for both validation and encode/decode
  round-tripping (persistence uses `Schema.encodeSync`/`decodeUnknownSync`
  directly against cell schemas), scoped finalizers for disposal. The kernel's
  shape (topological layer assembly, `ManagedRuntime`) is idiomatic Effect, not
  a bespoke DI container.
- **Ports & Adapters / Hexagonal** — `PersistenceDriver`, `LocaleAdapter`,
  `TextMeasurer` are all narrow port interfaces in `core/src/ports/`, with
  concrete adapters (localStorage/session/cookie drivers, a fake text measurer
  for tests) supplied at the edges.
- **Svelte 5 runes-first** — no legacy Svelte stores (`writable`/`derived`)
  anywhere in the reviewed code; reactivity is either native runes or the
  `createSubscriber`-based bridge in `use-cell.svelte.ts`.

## 6. The honest state — what's wired, what isn't, verified by reading the code

This is not a criticism of intent — the shape being built toward is right, and
large pieces of it (§3.1, §3.3, §3.4, §3.5) are genuinely, correctly
implemented. What follows is what a careful trace of the actual call paths turns
up. Organized by theme, in rough order of how much they'd bite first.

### A. Two generations of the same subsystem coexist, unremoved

- `core/src/plugin/manifest.ts` (`RunePlugin`, `StoreRegistryEntry`, a second
  `definePlugin`/`resolvePlugins`) and `core/src/plugin/schemas.ts`
  (`ThemeSchema`/`LanguageSchema`/`CurrencySchema`/`getCellSchema`) are
  near-byte-duplicates of `core/src/cells/schemas.ts` and functionally
  superseded by `forge/define-plugin.ts`. `plugin/schemas.ts`'s exports carry
  `// fallow-ignore-next-line unused-export` suppression comments — meaning a
  prior fallow run already flagged these as dead, and the response was to
  suppress the warning rather than delete the file. That's worth reversing:
  delete, don't suppress.
- `core/src/services/layers.ts`'s `createStoreLayer` (+ `getPersistenceDriver`,
  `resolveStoreDependencies`, `registerStoreFinalizer`) is a complete second
  implementation of the same per-store `Layer.effect` assembly that
  `kernel/wiring.ts`'s `compileEnvironment` now does inline. Nothing in the
  current kernel path calls `createStoreLayer` — it's dead, not just duplicated.
- `core/src/registry/registry.ts` keeps a module-level `GLOBAL_STORES` singleton
  (`registerStore`/`getRegisteredStore`/`clearRegistry`) explicitly labeled "for
  backward compatibility." The current kernel builds its own per-instance store
  map through Effect context and never touches this registry. A global singleton
  for per-kernel-instance data is also exactly the pattern the "factories, not
  singletons" principle (manifest §7) rules out — worth deleting rather than
  migrating.
- `ui/src/persistence/provider.ts` defines a complete alternate context
  mechanism (`DRIVER_CONTEXT_KEY`, `setDriverContext`, `getDriverContext`) that
  **`RuneProvider.svelte` never calls** — the provider sets
  `RUNE_LAB_CONTEXT.persistence` directly instead. `getDriverContext()` would
  throw for every real caller today; it's dead API surface with its own passing
  unit tests (`provider.test.ts` tests `resolveDriver` in isolation, which does
  work — but the context-setting half is unreachable in practice).
- `ui/src/{app.svelte.ts, cells.svelte.ts, context.ts}` are one-line re-export
  shims (`export * from "./reactivity/app.svelte.ts"`, etc.) sitting next to the
  real files they re-export, presumably for import-path backward compatibility.
  Worth a deliberate decision (keep as a stable public path, or delete and
  update the few internal importers) rather than leaving both silently.

### B. The forge migration is real but partial, and the biggest boilerplate offender hasn't moved

`layout/src/plugin.ts` and `palettes/src/theme/plugin.ts` are on the new `slots`
format and get everything the forge promises — generated accessors, namespaced
persistence, no hand-written symbol table. But `palettes/src/mod.ts`'s
`PalettesPlugin` — commands, shortcuts, toasts, the actual majority of the
palettes domain — is still **100% on the legacy `stores: [...]` format**:
hand-written `contextKey: PALETTES_CONTEXT.commands`, hand-called
`createAccessor(key, "getCommandStore()", "CommandStore", "PalettesPlugin")`
three times over, `noPersistence: true` flags set by hand. This is the exact
ritual the forge exists to delete, still present verbatim in the plugin that
most needed it gone.

### C. Plugin identity has fragmented beyond the planned four

The manifest's target is one plugin id per domain (`rune-lab.layout`,
`rune-lab.palettes`, `rune-lab.i18n`, `rune-lab.observer`). What's actually
registered as of this snapshot:

- `rune-lab.layout` (as planned)
- `rune-lab.theme` — a **separate** plugin, spec'd independently, physically
  living at `plugins/palettes/src/theme/`, i.e., nested inside the palettes
  package folder despite being its own plugin id. It also reaches out of its own
  package tree via relative imports
  (`../../../i18n/src/lang/message-resolver.ts`, `../../../i18n/src/mod.ts`)
  rather than importing i18n by package specifier — a sideways,
  filesystem-coupled dependency between two plugins with no `requires`
  declaration mediating it, and one that will break the moment the package
  layout changes shape (which the completion spec's restructuring is about to
  do).
- `rune-lab.palettes` (legacy format, per §B)
- A `MoneyPlugin` distinct from `rune-lab.i18n` — inferred from
  `accessors.test.ts`'s expected error text
  (`getCurrencyStore() found no CurrencyStore.*MoneyPlugin`, vs.
  `getLanguageStore()...rune-lab\.i18n`). Money and lang were meant to be one
  plugin, two sub-domains; right now they appear to be two plugins.

Net effect: an app registering "the four plugins" today would actually need to
know about theme and money as separately-named entities, which contradicts the
"plugins own their domain, cleanly" pitch this whole redesign is built on.

### D. Concrete bugs found by tracing context-key derivation end to end

- `SlotSpec` (`define-slot.ts`) has no `contextKey` field.
  `layout/src/plugin.ts`'s `layout` slot and `palettes/src/theme/plugin.ts`'s
  `theme` slot both pass one anyway (`contextKey: Symbol.for("rl:layout")`,
  `contextKey: Symbol.for("rl:theme")`) — this compiles or doesn't depending on
  how strictly the generic inference in `definePlugin`'s new-format overload
  performs excess-property checking (worth confirming with `deno check`), but
  either way it's **inert**: `define-plugin.ts` always derives the real context
  key from `getContextSymbol(pluginId, slotName)`, ignoring any `contextKey` on
  the slot spec. The actual runtime key is `rl:rune-lab.layout:layout` and
  `rl:rune-lab.theme:theme` — not the hand-written symbols, and not what
  `layout/src/mod.ts`'s exported
  `LAYOUT_CONTEXT = {layout: Symbol.for("rl:layout")}` claims. Anything
  consuming `LAYOUT_CONTEXT.layout` directly gets a symbol nothing is ever set
  under.
- `RuneProvider.svelte` imports `{createAppStore, RUNE_LAB_CONTEXT}` from
  `"./mod.ts"` — its own package barrel, which in turn exports `RuneProvider`
  itself (`export { default as RuneProvider } from "./RuneProvider.svelte"`).
  That's a direct `RuneProvider.svelte → mod.ts → RuneProvider.svelte` cycle, in
  the single most central file in `ui` — the exact pattern the "nothing imports
  its own `mod.ts`" rule (manifest §7) exists to prevent, currently present in
  the file everything else depends on.
- `layout/src/plugin.ts`'s `text` slot declares
  `dependsOn: ["theme", "language"]`. `wiring.ts` resolves any undotted
  dependency as **local to the same plugin** (`rl:rune-lab.layout:<dep>`) — but
  layout has no `theme` or `language` slot; those are global cells, not slots,
  in a completely different part of the kernel. Slot-graph validation
  (`slotIdSet.has(depId)`) only skips this for `isLegacy` slots with un-prefixed
  deps; `text` is a new-format slot, so this check does not skip it. Registering
  `LayoutPlugin` with its `text` slot exercised should throw
  `Missing dependency: Slot "rl:rune-lab.layout:text" depends on "rl:rune-lab.layout:theme", which is not registered`
  at kernel compile time.
- `PalettesPlugin`'s legacy `commands` store declares
  `dependsOn: ["app", "api", "toast", "theme", "language", "currency"]`. In the
  legacy path, unregistered undotted deps skip _validation_, but they still get
  resolved at runtime via `Context.GenericTag<unknown>(depId)` and `yield*`ed
  inside the store's `Layer.effect`. None of `app`, `api`, `theme`, `language`,
  `currency` are registered as Effect-tagged stores anywhere in the current
  wiring (theme/language/currency are cells, not store tags; `app` is created
  separately by `RuneProvider` via `createAppStore()` and never added to
  kernel/Effect context; `api` doesn't exist at all in this codebase). If
  `PalettesPlugin` is registered with its `commands` store actually
  instantiated, this should fail at boot — `Layer.provideMerge`'s overall
  requirement type is being force-cast to `never`
  (`ManagedRuntime.make(env as Layer.Layer<any, any, never>)`), which suppresses
  the type error TypeScript would otherwise raise here, at the cost of pushing
  the failure to runtime. This reads like scaffolding from a design that
  predates the current kernel and was never updated.
- `SettingsFields.svelte`'s store-target resolver does a **double lookup** —
  `rl:<pluginId>:<storeId>` then falls back to `rl:<storeId>` — which exists
  specifically to paper over the mismatch above, and it still doesn't fully
  work: it derives `pluginId` from `field.id.split(".")[0]`, but
  `layout/src/settings.ts`'s one live field has `id: "preset"` (no dot), so
  `parts[0]` is `"preset"` itself, treated as if it were a plugin id. Neither
  lookup produces the real key (`rl:rune-lab.layout:layout`). The one settings
  field currently wired end-to-end (the layout preset selector) is very likely
  not resolving to its store today — worth confirming by actually opening the
  settings modal in the running lab.
- `RuneProvider.svelte` sets `settingsSections` context **once**, synchronously,
  from `kernel.getContributions("settingsSections")` at initial render — not
  `$derived`. A plugin contributing settings after first mount won't appear
  without a full remount; probably fine for now (all contributions are currently
  static at boot) but worth knowing before it's relied on dynamically.

### E. Ring/boundary violations

- `ui/src/accessors.test.ts` imports directly, by relative path, from
  `../../plugins/{i18n,layout,palettes}/src/**` — ui's own test suite reaches
  forward into plugin source, inverting the `core ← ui ← plugins` direction the
  whole architecture is built on, and bypassing the `@rune-lab/*` specifiers
  entirely. Understandable as a pragmatic integration test, but it should live
  in an app/integration-test location, not inside `ui/src/`.
- `palettes/src/theme/store.svelte.ts`'s reach into `../../../i18n/src/...`
  (§6.C) is the same class of violation at the plugin-to-plugin level.
- `ui/src/mod.ts` does `export * from "@rune-lab/core"` — a deliberate
  convenience (plugin authors get core's vocabulary through one door) but it
  means grepping "which package was this imported from" no longer tells you
  which ring owns a given export. Worth keeping as a _named_ decision (it's
  defensible) rather than an implicit one — document it, and keep the boundary
  check based on ui's own source files rather than its re-export surface.

### F. What's genuinely solid (for balance)

- The new-format slot pipeline in `wiring.ts` — plugin-level `requires` sort,
  cross-plugin `dependsOn` validation against `requires`, namespaced persistence
  handles — is correct, tested-shape work matching the spec exactly.
- The vanilla/reactive `ConfigStore` split is a clean Ports & Adapters
  implementation, not a partial one.
- `SettingsFields.svelte`'s primitives-interpreter-plus-custom-escape-hatch is
  faithfully built.
- The fail-loud accessor pattern is real, consistent, and has a real (if
  mis-located) test proving the message shape across every plugin checked.
- Topological sort with cycle detection is small, correct, and properly shared
  between plugin-level and slot-level ordering — no duplicated graph logic.

## 7. How to use this document going forward

Before extending any subsystem above, check whether §6 already names a problem
in it — fixing wiring while adding features multiplies the diff for no reason.
The recommended order: resolve §6.A (delete the dead generation) and §6.D's
context-key/dependency bugs first, since they're prerequisites for anything else
to be _testable_ against a real kernel; then reconcile §6.C (collapse theme into
layout, money+lang into one i18n plugin) as part of the already-planned
per-plugin work orders; §6.B (finish migrating `PalettesPlugin` off the legacy
format) is exactly what `plugin-refactor-layout-palettes.md` already specifies —
this document just confirms it's still pending, not partially done. Run the
check-loop guide's fast loop (`just check`, boundary grep) before and after
touching any of this.
