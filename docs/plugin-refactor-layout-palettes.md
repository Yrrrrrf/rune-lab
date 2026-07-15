# Rune Lab — Plugin Work Order: Layout + Palettes

> Executes Phase 3 (first half) of `rune-lab-v0.5-completion-spec.md`. Assumes
> Phases 0–2 are landed: the forge (`definePlugin` v2, slots, `persist:`,
> `requires`, `defineSettings`) exists in core, and ui ships `createPluginKit` +
> the generic `SettingsFields` renderer. This document is self-contained enough
> to execute in a fresh session; contracts live in the spec.

## Context in three paragraphs

Rune Lab is a plugin-based application shell for Svelte 5: a framework-free
kernel (`rune-lab/core`) resolves plugin specs, topologically orders their
stores, and exposes schema-guarded state cells; a thin Svelte adapter
(`rune-lab`) bridges cells into runes and publishes plugin stores into context;
plugins own all domain vocabulary. One npm package, many subpath doors; the
build fold rewrites `@rune-lab/*` workspace names and must not be touched by
this work.

After the forge refactor, a plugin is **one declaration**: `plugin.ts` calls
`createPluginKit` with a spec (`id`, `requires`, `slots` with `create` factories
and `persist:` flags, `settings` schema, `overlays`, `contributions`) and
exports the generated typed accessors. Module-level store singletons are banned;
components import accessors from `plugin.ts`, never from `mod.ts` (which is
export-only). This kills the barrel cycles and the driver-injection ritual
permanently.

**Layout** is the app shell: named zones, layout presets (simple page → VS-style
workspace), theme, and language. **Palettes** is its complement and the first
plugin to use plugin-level dependencies: it `requires` layout, and provides an
extensible palette registry (commands, shortcuts, metadata, anything registered)
rendered inside a single DaisyUI modal host. These two migrate together, layout
strictly first.

---

## Part A — Layout

### Role after refactor

The one component a consumer mounts in `+layout.svelte` to get a complete,
configurable app structure: sidebar(s), workspace strip, content, detail panel,
statusbar — with presets collapsing that to a simple page when that's all the
app needs. All zone state lives in a kernel slot so other plugins (palettes) and
app code can command it. `pretext` integration into the shell is **out of
scope** for v0.5 (reserved: it will mount through the `statusbar`/`content` zone
contract later, so nothing here may preclude it).

### Target structure

```
plugins/layout/src/
├─ plugin.ts            createPluginKit — slots: layout, theme, language; settings; exports accessors
├─ stores/
│  ├─ layout.svelte.ts   zone/preset store factory (create-only)
│  ├─ theme.svelte.ts    theme store factory (create-only, was singleton)
│  └─ language.svelte.ts language store factory (create-only, was singleton)
├─ components/
│  ├─ WorkspaceLayout.svelte      zone composite (snippet per zone)
│  ├─ NavigationPanel.svelte + ConnectedNavigationPanel.svelte
│  ├─ WorkspaceStrip.svelte + ConnectedWorkspaceStrip.svelte
│  ├─ ContentArea.svelte · DetailPanel.svelte · Icon.svelte
│  ├─ ThemeSelector.svelte · LanguageSelector.svelte
│  └─ AppSettingSelector.svelte · ResourceSelector.svelte
├─ presets.ts           declarative zone-state records: page / docs / workspace
├─ settings.ts          defineSettings("general") — theme select, language select, driver select, preset select
├─ types.ts             Theme, Language, LayoutZone, Navigation*, WorkspaceItem, LayoutPreset
└─ mod.ts               export-only
```

Deleted: `GeneralSettings.svelte` (replaced by the schema in `settings.ts`),
`APP_CONFIGURATIONS.ts` singleton wiring, `connection-factory.ts` if its only
job was context plumbing now handled by the kit (verify before deleting — flag
if it has live consumers).

### The zone-store contract (freeze FIRST — palettes depends on it)

The layout slot store's public surface, described (not coded): the closed zone
set for v0.5 is `nav`, `strip`, `content`, `detail`, `statusbar`,
`overlay-anchor`. The store exposes per-zone visibility and size state, an
`applyPreset` operation taking a preset id or record, a `toggleZone` operation,
and reactive reads for each. Presets are data records mapping zones → state;
`page`, `docs`, `workspace` ship as defaults. This surface is what palettes'
built-in commands ("toggle detail panel", "switch to workspace preset") call —
nothing deeper.

### TODO — layout

- [ ] Freeze and document the zone-store contract above in `types.ts` +
      `presets.ts` (blocker for Part B).
- [ ] Convert `theme.svelte.ts` and `language.svelte.ts` to factory-only
      (`create` receives config + persistence handle + deps per the forge slot
      contract); delete module-level instances and every `setDriver` call site.
- [ ] Rewrite `store.svelte.ts` → `stores/layout.svelte.ts` around
      zones/presets; split its `init` (fallow CRITICAL: cyclomatic 15, 75 LOC)
      into small named helpers.
- [ ] Write `plugin.ts`: slots
      `{ layout, theme (persist, config schema: customThemes/defaultTheme), language (persist, config schema: locales) }`;
      attach `settings.ts` schema; export `LayoutPlugin` + generated
      `getLayoutStore` / `getThemeStore` / `getLanguageStore`.
- [ ] Author `settings.ts` with primitives only (select/toggle) — this deletes
      `GeneralSettings.svelte` including its `handleDriverChange` complexity
      finding.
- [ ] Move all `.svelte` files into `components/`; rewrite every internal import
      to target `plugin.ts` accessors (kills the 3 GeneralSettings cycles +
      LanguageSelector/ThemeSelector/ConnectedNavigationPanel cycles from the
      fallow report).
- [ ] Decompose `WorkspaceLayout.svelte` template (238 lines, CRITICAL) into
      per-zone child components sized ≤60 lines each; same treatment for
      `NavigationPanel.svelte` (118-line template, cognitive 31) and
      `AppSettingSelector.svelte` (219-line template).
- [ ] `mod.ts`: re-export plugin, accessors, components, types — and verify
      nothing inside `plugins/layout` imports it (standard-shape gate).
- [ ] Update `apps/lab` to the new imports; lab must compile and run before Part
      B begins.

### Exit criteria — layout

Fallow: zero cycles under `plugins/layout`,
`GeneralSettings`/`store.init`/template CRITICALs cleared. Standard-shape
fitness green. Lab: preset switching (`page` ↔ `workspace`) works live; theme +
language changes persist across reload via the kernel `persist:` path (no store
touches a driver directly).

---

## Part B — Palettes

### Role after refactor

The power-user complement to layout: a **palette registry** (contribution point
`palettes`) where commands, shortcuts, settings-search, metadata — and anything
a third party registers — are palettes conforming to one `PaletteDefinition`
contract, rendered by a single `PaletteHost` overlay inside one DaisyUI modal.
First consumer of plugin-level dependencies: `requires: ["rune-lab.layout"]`.

### Target structure

```
plugins/palettes/src/
├─ plugin.ts            createPluginKit — requires layout; slots: palettes(host state), commands,
│                       shortcuts, notifications; overlays: PaletteHost, Toaster; settings; accessors
├─ registry/
│  ├─ types.ts          PaletteDefinition contract (id, title, hotkey?, provider, renderer?, onSelect)
│  └─ registry.svelte.ts registry store factory + active-palette state
├─ host/
│  ├─ PaletteHost.svelte the ONE DaisyUI modal: focus trap, hotkey arbitration, palette switching
│  └─ hotkeys.ts         internal binder strategy wrapping hotkeys-js (swappable — see spec §9.3)
├─ palettes/            built-ins, each REGISTERED via the public registry (dogfooding)
│  ├─ commands/          command palette definition + command store factory
│  ├─ shortcuts/         shortcut palette definition + shortcut store factory + useShortcuts
│  └─ settings-search/   palette over settings schemas (replaces SettingsModal fuzzy logic)
├─ notifications/       store factory, Toaster, NotificationBell, bridge (audit: fallow says
│                       bridge.ts is 100% dead — verify with fixed entry points, delete if confirmed)
├─ components/          NotificationBell + any shared bits
├─ fields/
│  └─ KeybindField.svelte  the settings CUSTOM field for capturing keybinds (domain-owned)
├─ settings.ts          defineSettings("shortcuts") — schema of keybind fields using KeybindField
├─ types.ts             ShortcutEntry, Command, Toast (owned vocabulary)
└─ mod.ts               export-only
```

Deleted: `SettingsModal.svelte` as a monolith (326 LOC, two CRITICAL findings —
its shell becomes a thin modal that renders `SettingsFields` sections + the
settings-search palette), `ShortcutSettings.svelte` and `ShortcutPalette.svelte`
monoliths (decomposed; their duplicated grouping logic — fallow clone groups
dup:713243fd and dup:2759e73e — collapses into one grouping helper in the
shortcut store).

### TODO — palettes

- [ ] Define `PaletteDefinition` in `registry/types.ts`; registry store factory
      with register/unregister, active palette, and open/close as kernel-visible
      state.
- [ ] Build `PaletteHost.svelte`: one modal, focus management, Escape/hotkey
      handling delegated to `host/hotkeys.ts` (the only file importing
      `hotkeys-js`).
- [ ] Write `plugin.ts` with `requires: ["rune-lab.layout"]`; slot-level
      `dependsOn` referencing layout's slot where commands need the zone store;
      overlays: PaletteHost + Toaster.
- [ ] Re-implement commands as a registered palette; ship built-in layout
      commands (toggle zones, apply presets) calling only layout's frozen
      zone-store contract via `getLayoutStore`.
- [ ] Re-implement shortcuts as a registered palette; extract the scope/category
      grouping duplicated across `ShortcutSettings`/`ShortcutPalette`/`store`
      into one store-level helper (kills both clone groups + the
      `byScopeAndCategory`/`groups`/`sortedScopes` complexity cluster).
- [ ] Build `fields/KeybindField.svelte` against the ui custom-field contract
      (value, commit, disabled, metadata — nothing else); author `settings.ts`
      using it. This deletes `ShortcutSettings.svelte`'s hand-rolled page
      (`handleKeyDown` CRITICAL included).
- [ ] Implement settings-search as a palette over settings _schemas_ (replaces
      `SettingsModal`'s `fuzzyScore`/`searchResults`/`updateFromHash` trio —
      three fallow findings).
- [ ] Notifications: convert store to factory; resolve `bridge.ts` (verify dead
      → delete, or wire → keep); components import from `plugin.ts` (kills the 4
      `palettes/mod.ts` cycles + Toaster/ShortcutPalette/CommandPalette cycles).
- [ ] Decompose `CommandPalette.svelte` and `ShortcutPalette.svelte` templates
      (221/240 lines, both CRITICAL) into list/item/empty-state children ≤60
      lines.
- [ ] `mod.ts` export-only; lab updated: Ctrl+K commands, Ctrl+/ shortcuts,
      settings modal fully schema-driven, a demo third-party palette registered
      from lab code to prove the public interface.

### Exit criteria — palettes

Fallow: zero cycles under `plugins/palettes`; all
SettingsModal/ShortcutPalette/CommandPalette/ShortcutSettings CRITICALs cleared;
both shortcut clone groups gone. Kernel test proves palettes fails loud (naming
both ids) when layout is absent. Lab: registering a new palette from app code
takes one contribution and zero palettes-plugin edits.
