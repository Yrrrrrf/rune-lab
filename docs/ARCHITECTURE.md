# Rune Lab — Architecture (v0.5)

> Context-transfer document. A fresh engineer (or a fresh AI conversation)
> should be able to read this file plus `docs/MANIFEST.md` and make correct
> changes without re-deriving the design. The manifesto is the _why_; this is
> the _what and where_. When they conflict, the manifesto wins.

---

## 1. The three rings

Rune Lab is one npm package (`rune-lab`) built from three workspace rings with a
strict, one-way dependency direction:

```
┌────────────────────────────────────────────────────────────┐
│  apps/           consumers (apps/lab is the acceptance      │
│                  harness — if lab works, the package works) │
├────────────────────────────────────────────────────────────┤
│  plugins/        domains: layout, palettes, i18n (+money),  │
│                  observer. Own their types, stores,         │
│                  accessors, context symbols, overlays,      │
│                  third-party deps (hotkeys-js, dinero.js).  │
├────────────────────────────────────────────────────────────┤
│  ui/             the Svelte 5 adapter ("@rune-lab/svelte"). │
│                  RuneProvider, useCell, getKernel,          │
│                  createAccessor, browser drivers, portal,   │
│                  tokens, AppStore. NO domain vocabulary.    │
├────────────────────────────────────────────────────────────┤
│  core/           the kernel ("@rune-lab/core"). Effect-     │
│                  based DI: plugin resolution → registry →   │
│                  topological sort → store layers → state    │
│                  cells + ports. Zero Svelte, zero DOM.      │
└────────────────────────────────────────────────────────────┘
         imports flow strictly downward, never up or sideways
```

**Framework-agnosticism is scoped**: the _product_ is Svelte 5 or nothing
(manifesto), but the _kernel_ is deliberately framework-free as an internal
discipline. Core never imports Svelte. Ui is the only place where the kernel's
subscribe/version contract is bridged into runes. Plugins are Svelte-native
(components, `.svelte.ts` stores) but reach the kernel only through ui's public
surface plus `@rune-lab/core` types.

### 1.1 Core — the kernel

Source: `src/packages/core/src/`. Public surface (`mod.ts`):

- `createKernel(plugins, options)` → `Kernel`: resolves `PluginInput[]` (nested
  arrays / falsy allowed → flattened, deduped by id), registers each plugin's
  store entries, validates the dependency graph (missing dep = loud throw naming
  both ids), topologically sorts, builds an Effect layer stack, and returns the
  kernel facade.
- `Kernel` API: `stores: Map<id, store>`, `overlays`, `getCell` / `setCell`
  (setCell persists standard keys and drives the locale adapter, reverting the
  cell on failure), `subscribe(cell, fn)`, `getCellVersion(cell)`,
  `getContributions` / `registerContribution` / `unregisterContribution`,
  `getStoreEntry(id)`, `dispose()`.
- **State cells**: `theme`, `language`, `currency`, `contributions` are the
  standard cells, each schema-validated on persistence load (bad persisted value
  → fallback, never a crash). Cells expose `get/set/subscribe/
  getVersion` —
  deliberately the exact shape Svelte 5's `createSubscriber` consumes; ui's
  `useCell` is the bridge.
- **Ports**: `PersistenceDriver` (get/set/remove, sync or async),
  `LocaleAdapter`, `TextMeasurer`. Core ships only the in-memory driver; browser
  drivers live in ui.
- **Plugin contract** (`definePlugin` / `RunePlugin`):
  `{ id, stores[],
  overlays?, contributions? }`. A store entry is
  `{ id, contextKey?: symbol,
  factory(config, driver, deps), dependsOn?, noPersistence?, optional?,
  conditional? }`.
  `contextKey` is how a plugin's store gets published into Svelte context by the
  provider — the plugin owns the symbol.
- **Contributions**: declarative `{ key: items[] }` on a plugin. `createKernel`
  auto-registers them into any store whose id matches the key _and_ mirrors them
  into the `contributions` cell. ⚠ Nothing else should register them again (see
  §4, gap G-double-reg history).

### 1.2 Ui — the adapter

Source: `src/packages/ui/src/` (flat — the old `kernel/src/` nesting is gone).
Exactly seven concerns, none of them a domain:

| Export                                          | Job                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RuneProvider.svelte`                           | Create/provide/dispose one kernel. Generic loop: for each resolved store entry with a `contextKey`, `setContext(key, store)`. Provides the kernel itself, the persistence driver, `settingsSections`. No store-id special-casing, no domain props.                                       |
| `useCell(kernel, name)` (`cells.svelte.ts`)     | Reactive read/write view over a kernel cell: reads register a subscriber wired to `kernel.subscribe` keyed on `getCellVersion`; writes delegate to `kernel.setCell` (persistence + locale side-effects stay in core). SSR degrades to plain reads. Unknown cell = core's own loud error. |
| `getKernel()`                                   | Context accessor for the kernel — the escape hatch that makes third-party plugins and devtools possible without ui changes.                                                                                                                                                              |
| `createAccessor(symbol, names…)` (`context.ts`) | Fail-fast `getContext` factory. Plugins build their own `getThemeStore`-style accessors from it. Ui keeps symbols only for what ui itself provides: `app`, `kernel`, `persistence`, `settingsSections`.                                                                                  |
| `persistence/`                                  | `localStorage` / `session` / `cookie` drivers + provider + `createConfigStore` (generic item-list-with-persistence; domain-free — flagged for possible future move to core).                                                                                                             |
| `actions/portal.ts`, `tokens/`                  | Generic DOM action; design tokens.                                                                                                                                                                                                                                                       |
| `app.svelte.ts`                                 | `AppStore` — app metadata (name/version/author), init-once guard.                                                                                                                                                                                                                        |

Deleted by design: `useRuneLab()` (kitchen-sink accessor), the closed
`RUNE_LAB_CONTEXT` domain table, `shortcut-listener` (→ palettes, with its
`hotkeys-js` dep), all domain types/interfaces (→ their plugins), the three
typed `onThemeChange`-style provider props (consumers use `useCell`).

**Boundary rule (CI-enforceable)**: ui's tree must never match `Theme`,
`Shortcut`, `Command`, `Toast`, `Currency`, `hotkeys`. If a change needs one of
those words in ui, the change belongs in a plugin.

### 1.3 Plugins — the domains

Each plugin exports a `RunePlugin` (via `definePlugin`) plus its public Svelte
surface. Each owns:

- its **types** (layout: `Theme`, `Language`, `LayoutZone`, `Navigation*`,
  `WorkspaceItem`; palettes: `ShortcutEntry`, `Command`, `Toast`; i18n/money:
  `Currency`, money primitives),
- its **context symbols** and **accessors** built from ui's `createAccessor`,
- its **stores** (`.svelte.ts`, runes-first) registered as kernel store entries
  with `contextKey`,
- its **overlays** (e.g. `CommandPalette`, `Toaster`) rendered by the provider's
  overlay loop,
- its **third-party deps** (`hotkeys-js` is palettes', `dinero.js` is money's —
  never ui's).

The "writing a plugin" recipe is three lines: define stores with contextKey →
export an accessor → optionally ship overlays/contributions. That recipe is the
platform's extension API; keep it that small.

---

## 2. The single-package fold

Nothing besides `rune-lab` is published. Workspace members resolve as
`@rune-lab/*` at dev time and fold into subpaths of the one dist at publish
time, resolved via **Node self-referencing exports** (a package may import
itself by name for any subpath in its own `exports` map; Vite honors this).

### 2.1 Canonical specifier table

| dev-time (workspace)     | dist rewrite target                            | exports entry  | dist location                |
| ------------------------ | ---------------------------------------------- | -------------- | ---------------------------- |
| `@rune-lab/svelte`       | `rune-lab` (bare root — NOT `rune-lab/svelte`) | `.`            | `dist/` (entry file only)    |
| `@rune-lab/core`         | `rune-lab/core`                                | `./core`       | `dist/src/core/`             |
| `@rune-lab/layout`       | `rune-lab/layout`                              | `./layout`     | `dist/src/plugins/layout/`   |
| `@rune-lab/palettes`     | `rune-lab/palettes`                            | `./palettes`   | `dist/src/plugins/palettes/` |
| `@rune-lab/i18n` (money) | `rune-lab/i18n/money`                          | `./i18n/money` | `dist/src/plugins/money/`    |

This table is the contract between three parties that must stay in sync:
**source imports** (dev), **`scripts/manifest.ts`** (exports map + folding
plugin deps into `dependencies`), and **`scripts/build.nu`** (the specifier
rewrite in `patch-file`). Any change touches all three or breaks the dist.

**Dist layout note (current):** the root ring is split across two locations —
ui's single entry file (`mod.js` / `mod.d.ts`) stays at the true root `dist/` so
the package's main entry point never moves, while every other ui file it imports
lives one level down at `dist/src/ui/`. Every other ring (core, each plugin)
sits entirely under `dist/src/<ring>/`. See `BUILD-MIGRATION-SPEC.md` for the
mechanics of how `build.nu` produces this shape.

### 2.2 Build pipeline (`just build` → `deploy.just`)

1. `manifest.ts` — assembles `build/package.json`: identity from root
   `deno.json`, exports map per the table above (each entry gets
   `types`/`svelte`/`default`), peer deps (`svelte`), runtime deps (`esm-env`
   - every folded plugin's npm deps via `pickDeps`). `workspace:*` entries are
     dropped _by design_ — the fold replaces them.
2. `svelte-package` per member → per-member output directories, then a
   **reshuffle step** moves each into its final nested location: core into
   `dist/src/core/`, each plugin into `dist/src/plugins/<name>/`, and ui's
   output is split — its entry file (`mod.js`/`mod.d.ts`) stays at `dist/` root,
   everything else moves into `dist/src/ui/`. (The "no package.json / no exports
   field" warnings are cosmetic; silence them with a minimal stub `package.json`
   per member dir if they annoy.)
3. `deno fmt build`.
4. `build.nu` patch pass — per file: strip tests/i18n artifacts, rewrite
   `.ts → .js` relative imports (including the new `./src/ui/…` prefix on
   `mod.js`'s relative specifiers, post-reshuffle), rewrite every
   `@rune-lab/<x>` per the table, inline the version literal. The reshuffle in
   step 2 runs **before** this pass, so the `@rune-lab/*` rewrite always
   operates on final file locations.
5. `just inject` copies `build/` over `node_modules/rune-lab`; the lab app then
   consumes it exactly like a real npm user. **`just run lab` can be shadowed by
   workspace resolution — the honest gate is a tarball install into a scratch
   app outside the workspace.**

### 2.3 Verification gates (permanent)

- `rg "@rune-lab" build/` → **zero hits** (specifier leak gate).
- Every specifier in the table has a matching exports entry, and that entry's
  path resolves to an existing file at its nested `dist/src/...` location
  (export-map gate).
- `rg -l "Theme|Shortcut|Command|Toast|Currency|hotkeys" src/packages/ui/` →
  zero hits (boundary gate — runs against source, unaffected by the dist
  reshuffle).
- **New: reshuffle integrity gate** — every relative import under `dist/src/**`
  (and inside the root `mod.js`) resolves to a file that actually exists after
  the move; catches a `../` depth left over from the pre-reshuffle flat layout.
- `just inject` diff clean; lab boots; theme/language/persistence switching
  works; overlays render.
- Clean-room: pack `build/`, install in a scratch Svelte app, import root +
  `rune-lab/core`, render `RuneProvider`.

---

## 3. Reserved seams (do not redesign casually)

- The kernel's cell contract (`get/set/subscribe/getVersion`) is load-bearing:
  `useCell` is built on it, and it is what would make a second framework adapter
  possible. Don't add Svelte awareness to core to "simplify" ui.
- `contextKey` on store entries is the _only_ channel from plugin to Svelte
  context. Don't reintroduce a central symbol table.
- `contributions` are registered exactly once, by `createKernel`. The provider
  must never re-register them (the historical double-registration of
  `"commands"` came from an `onMount` loop in RuneProvider — since removed; a
  kernel test guards single registration).

---

## 4. Current status (as of July 2026)

The single-package nested distribution layout migration is fully complete:

- The package builds all submodules (`core`, `ui`, `plugins`) under the nested
  `dist/src/` path, leaving only the primary UI entry point `mod.js`/`mod.d.ts`
  at the root of `dist/`.
- All specifiers (`@rune-lab/*`) are correctly rewritten to public subpaths of
  the `rune-lab` package.
- All gaps (G1-G4) have been resolved:
  - **G1 (incomplete exports):** All submodules (`core`, `layout`, `palettes`,
    `money`, `i18n/lang`) are correctly registered under `exports` in the
    generated `package.json`.
  - **G2 (svelte entry point):** `@rune-lab/svelte` is mapped directly to the
    bare root `rune-lab`.
  - **G3 (stale re-export):** The `shortcut-listener` re-export was removed from
    UI's source `mod.ts`.
  - **G4 (unfolded dependencies):** Runtime dependencies from all plugins
    (`esm-env`, `@chenglou/pretext`, `hotkeys-js`, `dinero.js`) are dynamically
    gathered and declared in the package manifest.

Open questions carried forward: `createConfigStore`'s long-term home (ui vs
core); whether `api`/`cart`/`session`/`exchangeRate` context concepts have any
live consumer (if not: dead, delete); unifying the `AppStore.version` vs package
`version()` duo.
