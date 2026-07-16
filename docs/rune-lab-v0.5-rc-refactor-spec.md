# Rune Lab v0.5 RC — Refactor Spec

> Scope: the exact changes assumed in the RC structure diagram (2026-07-16). One
> work package per concern; each is independently verifiable and lands as its
> own commit series. Companions: `PROJECT_MANIFEST.md` (the why),
> `known-issues-backlog.md` (the raw findings), the RC structure diagram (the
> target shape). Observer is **out of scope** — excluded from build and gates,
> untouched.
>
> Convention used throughout: **DELETE** = remove file/symbol entirely (git
> remembers), **MOVE** = relocate with import updates, **CHANGE** = in-place
> edit. Every operation names the real current symbol, verified against the
> 2026-07-15 source snapshot.

---

## 0. Decisions locked (veto now or they're final)

- **D1 — Four plugin ids, exactly.** `rune-lab.layout`, `rune-lab.palettes`,
  `rune-lab.i18n` (+ parked `rune-lab.observer`). `rune-lab.theme` and the
  standalone money plugin id are deleted, not deprecated. `v0_5-overview.md` §1
  is superseded by this spec.
- **D2 — Theme is layout's domain.** Theme slot, `createThemeStore`, and
  `ThemeSelector` move from `palettes/src/theme/` into layout. Theme names
  render from raw DaisyUI identifiers; layout does NOT import i18n's
  `createMessageResolver`. Localized theme names, if wanted later, are the app's
  job (wrap layout's raw names with i18n at the consumer level).
- **D3 — Language and money are i18n's domain, one plugin id.** `language`
  becomes a persisted slot on `rune-lab.i18n`. `LanguageSelector` and
  `CurrencySelector` live in i18n.
- **D4 — The standard cells die.** `theme` / `language` / `currency` stop being
  hardcoded kernel cells (`RuneLabCells`) and become ordinary `persist: true`
  slots on their owning plugins. One persistence path: namespaced slot handles.
  Persisted keys therefore change (`theme` → `rl:rune-lab.layout:theme` etc.);
  per manifest §7 we do **not** migrate old localStorage values — pre-1.0, users
  re-pick their theme once.
- **D5 — Cross-plugin slot references use dotted ids.** `dependsOn` entries that
  cross a plugin boundary are written `"<pluginId>.<slot>"` (e.g.
  `"rune-lab.layout.layout"`). Same-plugin references stay bare (`"theme"`). The
  kernel resolves bare names within the declaring plugin first, dotted names
  globally, and fails loud on anything else.
- **D6 — Locale side effect moves into the port context.** `SlotContext` gains
  an optional `locale?: LocaleAdapter` (spec-vocabulary change, manifest §4
  corollary — recorded here deliberately). i18n's language store calls
  `ctx.locale?.setLocale(v)` on change. The kernel-level `bindLocaleAdapter`
  special case is deleted.
- **D7 — Persist-with-revert becomes a core cell helper.** `setCellLifecycle`'s
  revert-on-failure behavior is preserved as
  `createPersistedCell(schema, handle)` in `core/src/cells/` (wraps
  `StateCell.set` with encode → `handle.set` → revert + rethrow on failure).
  Stores that declare `persist: true` receive their handle via `ctx.persistence`
  and use this helper. No store re-implements the write/revert dance.

Everything below assumes D1–D7.

---

## WP0 — Unblock verification (do first; nothing else is trustworthy until green)

The gates must work before the refactor starts, or we can't tell whether we
broke anything.

1. **CHANGE** `plugins/layout/src/text/adapter.ts:20-21` — import specifiers
   `"pretext"` / `"pretext/rich-inline"` → `"@chenglou/pretext"` /
   `"@chenglou/pretext/rich-inline"` (the installed package name; this alone
   un-breaks the two failing test suites `ui/src/accessors.test.ts` and
   `i18n/src/money/exchange-rate.test.ts`, which currently fail at collection,
   not logic).
2. **CHANGE** paraglide output for `i18n/src/lang/messages.ts` — regenerate so
   `./paraglide/messages.d.ts` exists where the `@deno-types` pragma points; add
   the generation step to `just prepare` so it can't silently rot again.
3. **CHANGE** `.fallowrc.json` — fix the two workspace members reported "not
   found" (`./src/packages/plugins/i18n`, `./src/packages/plugins/observer` —
   the paths fallow resolves don't match the real layout, hence the
   `some/i18n/...` fallback labels), and configure entry points (`apps/lab`
   routes + each package `mod.ts`) so dead-code numbers stop reading 100%.
   Exclude observer from analysis for the RC.
4. **CHANGE** `apps/lab/tsconfig.json` — remove `baseUrl`/`paths`, move aliases
   to `kit.alias` (the sveltekit sync warning printed twice per run).

**Verify:** `just ci` → all suites collect, ≥107 green (the 2 broken suites now
count); `just audit` → no "workspace member not found", no "no entry points
detected", dead-file % becomes a real number. Fix nothing else in this WP —
baseline only.

---

## WP1 — core: one generation of everything, forge-only, domain-free

### 1a. Delete the second generations (backlog §4; implementation-context §6.A)

- **DELETE** `core/src/plugin/manifest.ts` — `RunePlugin`, `StoreRegistryEntry`,
  the old `definePlugin(plugin: RunePlugin)`, `resolvePlugins`, `process`.
- **DELETE** `core/src/plugin/schemas.ts` — duplicate `withFallback` /
  `ThemeSchema` / `LanguageSchema` / `CurrencySchema` / `getCellSchema` + its 4
  stale suppressions. `core/src/cells/schemas.ts` is the one copy (and shrinks
  further in 1c).
- **DELETE** `core/src/persistence/store.ts` — duplicate `StateCell` (50 clone
  lines) + its 5 stale suppressions. `core/src/cells/define-cell.ts` is the one
  copy.
- **DELETE** `core/src/registry/registry.ts` — `RegistryService`,
  `makeRegistryLayer`, `GLOBAL_STORES` module singleton,
  `registerStore`/`getRegisteredStore`/
  `getAllRegisteredStores`/`unregisterStore`/`clearRegistry` (violates "one
  instantiation channel", manifest §7).
- **DELETE** `core/src/services/layers.ts:createStoreLayer` (dead second wiring
  impl). Keep `makePersistenceLayer` / `makeLocaleAdapterLayer` /
  `makeTextMeasurerLayer` / `makeStateCellsLayer` / `StateCellsTag` — they're
  live imports of `wiring.ts`.
- **CHANGE** `core/src/mod.ts` — drop every re-export of the above; it currently
  exports `RunePlugin`, `StoreRegistryEntry` and friends.

### 1b. Single-signature `definePlugin` (kills the legacy format at the type level)

- **CHANGE** `core/src/forge/define-plugin.ts` — delete the
  `(plugin: {id, stores?: StoreRegistryEntry[]})` overload, the `s.stores`
  branch, the `Symbol.for("rl:" + store.id)` fallback scheme, and
  `ForgedPlugin.isLegacy`. One signature remains:
  `definePlugin({id, requires?, slots?, settings?, overlays?,
  contributions?})`.
- **CHANGE** same file — hand-written `contextKey` in a slot spec becomes a
  **compile error** (omit the field from the accepted type) instead of being
  silently ignored. This is the structural fix for the `Symbol.for("rl:layout")`
  bug class (§6.D): the wrong code can no longer typecheck.
- **CHANGE** `core/src/kernel/wiring.ts` — delete the `plugin.stores` legacy
  branch inside slot normalization (`isLegacy`, `legacyFactory`,
  `noPersistence`, the raw-store-id slot scheme). `NormalizedSlot` loses
  `isLegacy`/`legacyFactory`.

### 1c. The cells → slots collapse (D4, D6, D7)

- **DELETE** `core/src/cells/cells.ts` — the hardcoded
  `RuneLabCells{theme, language,
  currency, contributions}` interface.
  `Kernel<TCells>`'s cell API (`getCell`/`setCell`/
  `subscribe`/`getCellVersion`) is retargeted at slot-declared cells keyed by
  `"<pluginId>.<slot>"`; `contributions` stays as the kernel's own internal
  cell.
- **CHANGE** `core/src/cells/schemas.ts` — delete
  `ThemeSchema`/`LanguageSchema`/ `CurrencySchema`/`getCellSchema` (domain words
  in core, manifest §7 violation). Keep `withFallback` and
  `ContributionsSchema`. Schemas for persisted slots come from the slot's own
  `config` schema (`SlotSpec.config`), declared by the owning plugin.
- **CREATE** `core/src/cells/persisted-cell.ts` —
  `createPersistedCell<T>(schema, handle:
  PersistenceHandle, initial: T): StateCell<T>`
  implementing D7 (encode → write → revert
  - rethrow on failure, load-on-create from the handle).
- **CHANGE** `core/src/kernel/kernel.ts` — delete `loadPersistedCells` and the
  `bindLocaleAdapter` call; `createKernel` no longer touches cell names it
  didn't get from slots.
- **CHANGE** `core/src/kernel/lifecycle.ts` — delete `setCellLifecycle`'s
  `isStandardPersistenceKey` check, `writePersistence`, `updateLocale`, and the
  `nameStr === "language"` special case (all absorbed by D6/D7). What remains of
  lifecycle.ts is contribution register/unregister; if that's all, fold it into
  kernel.ts and delete the file.
- **CHANGE** `core/src/forge/define-slot.ts` — `SlotContext` gains
  `locale?: LocaleAdapter` (D6). `SlotSpecSchema` updated accordingly.

### 1d. Split `compileEnvironment` (285 LOC, cyclomatic 27, CRAP 756)

- **CHANGE** `core/src/kernel/wiring.ts` — extract into ≤60-LOC functions, each
  pure and individually testable, composed in `compileEnvironment` (which
  becomes a short pipeline):
  - `sortPlugins(plugins: ForgedPlugin[]): ForgedPlugin[]` — requires-graph
    validation + topo sort (the two loops that already exist, lifted out).
  - `resolveSlotRef(ref: string, declaringPluginId: string, all: Map<...>): NormalizedSlot`
    — implements D5 (bare = same plugin, dotted = global, else fail loud naming
    both the ref and the declaring plugin).
  - `normalizeSlots(sorted: ForgedPlugin[]): NormalizedSlot[]` — spec →
    normalized, no legacy branch left after 1b.
  - `sortSlots(slots: NormalizedSlot[]): NormalizedSlot[]` — dependsOn topo
    sort, reusing `utils/graph.ts:topologicalSort`.
  - `buildLayers(slots, options): Layer` — persistence namespacing
    (`"rl:<pluginId>:<slot>:"` prefix via `ports/memory.ts:namespaced`),
    locale/text layers, `ManagedRuntime` assembly, dispose finalizers. Also
    deletes the 11-line clone shared with the now-deleted
    `plugin/manifest.ts:78-88`.
- Self-duplicates while in the area: **CHANGE**
  `core/src/config/config-store.ts` — factor the `:45-59` / `:64-77` clone into
  one helper.

**Verify:** `just ci` green; kernel tests extended with: dotted/bare
`resolveSlotRef` happy + fail-loud cases, `createPersistedCell`
revert-on-failure, "hand-written contextKey does not typecheck" (via
`types.test.ts` compile-time assertions);
`rg -l 'isLegacy|StoreRegistryEntry|RunePlugin\b|GLOBAL_STORES|loadPersistedCells' src/packages/core`
→ empty; `rg '"theme"|"language"|"currency"' src/packages/core/src` → empty
(core is domain-free).

---

## WP2 — ui: bridge only, cycle-free, real dist types

- **CHANGE** `ui/src/RuneProvider.svelte` — import
  `RUNE_LAB_CONTEXT`/`getKernel` from `./provider/context.ts` directly, never
  from `./mod.ts` (breaks the 1 ui cycle). Fix the two
  `state_referenced_locally` warnings at lines 68/71: `plugins` and
  `localeAdapter` are construction-time inputs by design, so capture them
  explicitly via `untrack` (as `config` already is) — a deliberate, documented
  decision, not a silenced warning. Provider keeps exactly three generic loops:
  setContext per descriptor, mount overlays, collect settings sections. Passes
  `locale` into `SlotContext` (D6).
- **DELETE** root shims `ui/src/app.svelte.ts`, `ui/src/cells.svelte.ts`,
  `ui/src/context.ts` (re-export stubs; canonical files live in `reactivity/`
  and `provider/`).
- **DELETE** `ui/src/persistence/provider.ts` —
  `setDriverContext`/`getDriverContext`/ `resolveDriver` context half is dead
  (RuneProvider takes the driver as a prop); keep its test only if any live
  export remains, else delete `provider.test.ts` with it.
- **MOVE** `ui/src/accessors.test.ts` → `apps/lab/tests/accessors.test.ts` (WP6)
  — it currently imports plugin source by relative path
  (`../../plugins/i18n/src/...`), which is both a ring violation and an
  unresolved import. As an app-level integration test it uses public specifiers
  only.
- **CHANGE** `ui/src/settings/SettingsFields.svelte` — resolve cell/store
  references only through `rl:<pluginId>:<slot>` descriptors; delete the
  double-lookup fallback that also tries bare names. While there: factor the
  `:37-42`/`:52-57` clone; extract `commitValue` and the field-type dispatch out
  of the 171-line template into small helpers (CRAP 552).
- **CHANGE** build — make `svelte-package` (or the fold script) emit `.d.ts` +
  `.js` for every subpath export; this is the trailing item from the backlog and
  a **release blocker**. Wire `just build` to fail if `dist/**/*.d.ts` is
  missing for any export-map entry.

**Verify:** `just ci` green;
`rg "from ['\"]\.\./mod\.ts|from ['\"]\./mod\.ts" src/packages/ui/src` → empty;
`rg -l 'Theme|Shortcut|Currency|Command' src/packages/ui/src` → empty excluding
`mod.ts` re-export lines (domain-free rule, manifest §7); after `just build`:
`fd -e d.ts . dist | lines | length` covers every subpath in the export map.

---

## WP3 — layout: shell + theme + pretext, zero knowledge of i18n

- **MOVE** `palettes/src/theme/store.svelte.ts` →
  `layout/src/stores/theme.svelte.ts` — keep `createThemeStore`; **DELETE** its
  imports of `../../../i18n/src/lang/message-resolver.ts` /
  `../../../i18n/src/mod.ts` and the `getThemeName = createMessageResolver(...)`
  export (D2: raw DaisyUI names).
- **MOVE** `palettes/src/ThemeSelector.svelte` →
  `layout/src/components/ThemeSelector.svelte`, rendering raw theme names.
- **DELETE** `palettes/src/theme/plugin.ts` — `themePluginSpec`, `ThemePlugin`,
  `getThemeStore` as a standalone plugin (D1). Its slot definition is absorbed
  below.
- **CHANGE** `layout/src/plugin.ts`:
  - add slot
    `theme: { create: createThemeStore, config: <theme schema, moved here from
    core>, persist: true }`;
  - `layout` slot: **DELETE** the hand-written
    `contextKey: Symbol.for("rl:layout")` (after WP1 1b this no longer
    typechecks anyway);
  - `text` slot: `dependsOn: ["theme", "language"]` → `dependsOn: ["theme"]`
    (bare = own plugin, D5). The language dependency is severed:
    `TextStoreFacade` takes measurement inputs from theme (font shorthand via
    `text/fonts.ts:resolveFontShorthand`) and does not need the language value —
    if a concrete need reappears it must arrive as a dotted dep plus
    `requires: ["rune-lab.i18n"]`, explicitly.
  - accessors continue to come from `createPluginKit` only: `getLayoutStore`,
    `getTextStore`, now also `getThemeStore` (derived, typed, name-drift-proof).
- **CHANGE** `layout/src/mod.ts` — **DELETE** `LAYOUT_CONTEXT` (the stale
  `{ layout: symbol }` table pointing at a symbol nothing sets). mod.ts is
  export-only.
- **CHANGE** `layout/src/components/ResourceSelector.svelte` and
  `WorkspaceLayout.svelte` — **DELETE** the `@rune-lab/i18n` imports (currently
  unresolved anyway). Selector positions in the shell become snippet props on
  `WorkspaceLayout` (Svelte 5 snippets), e.g. `statusbarExtras`, so the app
  injects `LanguageSelector`/`CurrencySelector` from outside. Layout renders
  holes, not domains. This also removes `WorkspaceLayout`'s import path into
  palettes (source of 6 cycles) — palette overlays are mounted by RuneProvider
  via `overlays`, never imported by layout.
- **CHANGE** `layout/src/settings.ts` — field ids use the dotted, resolvable
  form (`rune-lab.layout.preset`, `rune-lab.layout.theme`); the theme section
  moves here from wherever it currently renders.
- **CHANGE** `layout/src/components/text/Text.svelte` / `RichText.svelte` —
  factor the 24-line measurement clone (`Text:10-33` / `RichText:8-28`) into a
  shared helper in `text/`.

**Verify:** `just ci` green;
`rg -l 'i18n|currency|money|language' src/packages/plugins/layout/src` → empty
(agnosticism grep — `language` included per the severed text dep);
`rg 'Symbol\.for' src/packages/plugins/layout/src` → empty;
`rg "rune-lab/palettes|palettes/src" src/packages/plugins/layout/src` → empty.

---

## WP4 — palettes: forge migration + host reorg (`requires: ["rune-lab.layout"]`)

- **CHANGE** `palettes/src/mod.ts` → new `palettes/src/plugin.ts` (mod.ts
  becomes export-only): rewrite `PalettesPlugin` in forged format —
  `definePlugin({ id: "rune-lab.palettes", requires: ["rune-lab.layout"], slots: {...} })`.
  - `commands` slot: `create: (ctx) => createCommandStore({...})` pulling
    collaborators from `ctx.stores`;
    `dependsOn: ["toasts", "rune-lab.layout.layout",
    "rune-lab.layout.theme", "rune-lab.i18n.language", "rune-lab.i18n.currency"]`
    — but **only keep the deps `CommandStore` actually uses**; audit
    `CommandServices` first. The current phantom deps `"app"` / `"api"` (nothing
    provides slots by those ids) are **DELETED**; if `CommandStore` genuinely
    needs the ui `AppStore`, that's a ui-provided value passed via config, not a
    slot dep — decide during the audit, default is delete. Note: taking deps on
    i18n slots means `requires: ["rune-lab.layout", "rune-lab.i18n"]`; if the
    audit shows commands don't actually need language/currency stores, keep the
    single layout requirement. **Prefer the audit-and-shrink outcome.**
  - `shortcuts` slot: `create: () => createShortcutStore()`.
  - `toasts` slot: `create: () => createToastStore()`.
  - `overlays: [PaletteHost, Toaster]` — `CommandPalette` / `ShortcutPalette` /
    `SettingsModal` stop being top-level overlays and become palettes rendered
    through the host (next bullet).
  - `contributions.settingsSections` keeps `ShortcutSettings`; icon becomes a
    Tabler name string, not an emoji.
- **DELETE** `palettes/src/mod.ts`'s `PALETTES_CONTEXT` symbol table and the 3
  hand-called `createAccessor` exports (`getShortcutStore`, `getCommandStore`,
  `getToastStore`) — replaced by `createPluginKit(palettesPluginSpec).accessors`
  (typed, derived).
- **CREATE** `palettes/src/registry/` —
  `PaletteDefinition{id, title, hotkey?, provider,
  renderer, onSelect}` + a
  registry store (itself a slot, `registry`). Public contract: third parties
  register palettes exactly like the built-ins do.
- **CREATE** `palettes/src/host/` — `PaletteHost.svelte`: ONE DaisyUI `<dialog>`
  modal, focus trap, renders whichever registered palette is open; `hotkeys.ts`:
  thin binder over `hotkeys-js` (moving
  `shortcuts/shortcut-listener.svelte.ts:shortcutListener` behind a swappable
  interface).
- **MOVE** built-ins under `palettes/src/palettes/` — `commands/`, `shortcuts/`,
  `settings-search/` — each self-registers a `PaletteDefinition` via the
  registry (dogfooding). `CommandPalette.svelte` (222-line template) and
  `ShortcutPalette.svelte` (240-line template, module-level `open()`/`close()`
  exports die — the host owns open/close state) shrink to list-renderers inside
  the host.
- **CHANGE** `SettingsModal.svelte` (326 LOC, 325-line template) → split under
  `palettes/src/settings-modal/`: `fuzzyScore` + `searchResults` (CRAP 272) into
  `search.ts`; `updateFromHash` into `hash-routing.ts`; metadata / sections /
  shortcuts panels into ≤60-line child components. Modal chrome comes from the
  host.
- **CHANGE** `notifications/bridge.ts` — `notify`/`wire`/`createToastBridge` are
  flagged 100% dead with a side-effect-only importer; delete unless a real
  consumer is found during the WP (check apps/lab).
- Cycle hygiene across the package: every internal file imports siblings by
  relative path, never `../mod.ts` or its own package specifier — this kills the
  12+ palettes-side cycles in the audit (Toaster, ShortcutPalette,
  ShortcutSettings, useShortcuts, CommandPalette, SettingsModal, ThemeSelector
  chains).

**Verify:** `just ci` green;
`rg "from ['\"].*mod\.ts" src/packages/plugins/palettes/src --glob '!mod.ts'` →
empty;
`rg 'PALETTES_CONTEXT|Symbol\.for|stores:' src/packages/plugins/palettes/src` →
empty; `just audit` → 0 cycles in palettes; registering a toy palette from
apps/lab through the public registry works (smoke test in WP6).

---

## WP5 — i18n: one id, lang + money sub-domains, pure leaf

- **CHANGE** `i18n/src/plugin.ts` — single
  `definePlugin({ id: "rune-lab.i18n",
  requires: [], slots: { language: {persist: true, config: <language schema, moved from
  core>, create: createLanguageStore}, messages: {...}, currency: {persist: true, config:
  <currency schema>, create: ...}, exchangeRate: {dependsOn: ["currency"], create: ...} }})`.
  The separate money plugin id is **DELETED** (D1/D3). Language store implements
  the D6 locale side effect: on set, `ctx.locale?.setLocale(v)` (with the old
  `updateLocale` try/catch semantics — locale failure logs, does not revert the
  cell).
- **CREATE** `i18n/src/lang/components/LanguageSelector.svelte` — moved/rebuilt
  here (it currently effectively lives nowhere valid; apps/lab imports it from
  `@rune-lab/layout` where it doesn't exist).
- **CHANGE** money file layout to the standard sub-shape: `money/stores/`
  (`currency.svelte.ts`, `exchange-rate.svelte.ts`), `money/primitives/`
  (`money.ts`, `strategies.ts` — pure, no svelte imports), `money/use/`
  (`useMoney.ts`, `useMoneyFilter.svelte.ts`), `money/components/`
  (`MoneyDisplay.svelte`, `MoneyInput.svelte`, `CurrencySelector.svelte`).
- Cycle + specifier hygiene: `useMoney.ts` / `useMoneyFilter.svelte.ts` import
  siblings directly, never `money/mod.ts` (3 cycles); `MoneyDisplay.svelte`'s
  `@rune-lab/i18n` self-import → relative (unresolved-import + cycle in one).
- Complexity while files are open (targets from the audit, no drive-bys beyond
  them): `exchange-rate.svelte.ts:18` (cognitive 36) and `useMoney.ts:85` (190
  LOC) extract into small pipeline helpers; factor the
  `useMoney.ts:238-246`/`:253-261` self-clone.
- **CHANGE** `i18n/src/settings.ts` — localization + money sections, dotted ids
  (`rune-lab.i18n.language`, `rune-lab.i18n.currency`).

**Verify:** `just ci` green (including the two suites revived in WP0);
`rg -l 'layout|palettes|theme' src/packages/plugins/i18n/src` → empty (pure
leaf); `rg "@rune-lab/i18n" src/packages/plugins/i18n/src` → empty; `just audit`
→ 0 cycles in i18n.

---

## WP6 — apps/lab: thin consumer, public surface only

- **CHANGE** `+layout.svelte` —
  `RuneProvider plugins={[LayoutPlugin, PalettesPlugin,
  I18nPlugin]}`;
  selectors injected into layout's snippet zones: `ThemeSelector` (from layout),
  `LanguageSelector` + `CurrencySelector` (from i18n). Target: ≤40 lines of
  consumer code across `+layout.svelte` + `+page.svelte`.
- **CHANGE** `LabHeader.svelte`, `StoresMirror.svelte`,
  `panels/DashboardPanel.svelte` — fix the 6 currently-broken imports to the
  D1–D3 homes: `getThemeStore` ← `@rune-lab/layout`; `getLanguageStore`,
  `LanguageSelector`, `CurrencySelector` ← `@rune-lab/i18n`; `ThemeSelector` ←
  `@rune-lab/layout`.
- **CREATE** `apps/lab/tests/accessors.test.ts` — the test moved out of ui
  (WP2), rewritten against public specifiers; asserts fail-loud accessor errors
  name the real plugin ids (`rune-lab.layout`, `rune-lab.i18n`,
  `rune-lab.palettes`) with the "did you register X in
  `<RuneProvider plugins={[…]}>`?" message shape.
- **CREATE** smoke test: register one toy palette via the public registry
  contract and assert it opens through the host (proves WP4's public surface
  without waiting for the showcase plugin).

**Verify:** `just run lab` works;
`rg "packages/|/src/" apps/lab/src --type ts --type svelte` → no relative
reaches into package source; svelte-check on apps/lab → 0 errors (currently 9).

---

## WP7 — gates: make the rules mechanical (`just check` / `just audit`)

Add to the justfile (nushell recipes) so every rule above is a failing check,
not a memory:

- **mod.ts self-import ban** — for each package,
  `rg "from ['\"](\.\./)*mod\.ts"` over `src/**` excluding `mod.ts` itself →
  must be empty.
- **sideways-import ban** —
  `rg "\.\./\.\./\.\./(i18n|layout|palettes|observer)/"` over
  `src/packages/plugins` → empty; `rg "@rune-lab/(i18n|layout|palettes)"` inside
  each plugin's own `src` (self-specifier) → empty.
- **domain-free rings** — core:
  `rg -i '"(theme|language|currency)"' src/packages/core/src` → empty; ui:
  `rg 'Theme|Shortcut|Currency|Command' src/packages/ui/src` → only mod.ts
  re-export lines.
- **symbol hygiene** — `rg 'Symbol\.for' src/packages/plugins` → empty (only
  `core/src/forge/descriptors.ts` may mint symbols).
- **fallow** — `just audit` passes with: 0 cycles, 0 unresolved imports, 0 stale
  suppressions, entry points configured; wire it into `just check` as a hard
  gate.
- **dist gate** — `just build` fails when any export-map subpath lacks `dist`
  `.d.ts`+`.js`.
- **clean-room ritual** — `just release-check`: pack the tarball, install into a
  scratch SvelteKit app outside the workspace, import every public subpath, run
  its svelte-check. Per manifest §7 this is the only honest gate; the RC does
  not ship without it green.

---

## Ordering and dependencies

```
WP0 ──→ WP1 ──→ WP2 ──┬──→ WP3 ──→ WP4 ──→ WP6 ──→ WP7 (ritual runs throughout;
                      └──→ WP5 ──────────↗          hard gates land as each rule
                                                    becomes satisfiable)
```

- WP0 first, alone: no refactor lands until the baseline is green.
- WP1 before everything: WP3–WP5 write forged plugins against the
  single-signature `definePlugin` and dotted `dependsOn`; writing them against
  the old kernel means writing them twice.
- WP3 before WP4: palettes' `requires`/dotted deps point at layout's final slot
  ids (`rune-lab.layout.theme` must exist before palettes references it).
- WP5 is independent of WP3/WP4 (pure leaf) — parallelizable after WP2.
- WP6 last among code WPs: the app consumes the final public surface once, not a
  moving one.
- Each WP ends with its own **Verify** block green plus `just ci` — no WP starts
  on top of a red predecessor.

## Explicitly out of scope for the RC

Observer (parked, excluded from gates). The showcase plugin (post-RC; WP6's
smoke test is its down payment). Persisted-value migration from the old
`theme`/`language`/`currency` keys (D4). Localized theme names (D2 consequence —
app-level concern if ever). Any performance work on pretext beyond the specifier
fix (layout's "own new refactor" is a separate, later spec).
