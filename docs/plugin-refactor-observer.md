# Rune Lab — Plugin Work Order: Observer

> Executes Phase 3 (parallel track) of `rune-lab-v0.5-completion-spec.md`.
> Assumes Phases 0–2 landed. Independent of every other plugin track — smallest
> work order, but it gains the most from the forge because the forge makes the
> whole system _introspectable_.

## Context in three paragraphs

Rune Lab is a plugin-based application shell for Svelte 5: a framework-free
kernel resolves declarative plugin specs, topologically orders slots, exposes
schema-guarded state cells, and publishes stores into Svelte context through a
thin adapter. After the forge refactor, every plugin in the system is pure data
(a spec) plus factories — which means the runtime is fully describable: which
plugins loaded, in what order, which slots they own, what they persist, what
they contribute.

**Observer is dependency-agnostic** (`requires: []`) and is the
devtools/observability story of the whole platform (completion spec §8): it
inspects the kernel, the plugin graph, store states, and persistence contents.
Today it does this with ad-hoc panels (`ObserverPanel`,
`PersistenceInspector`-style logic duplicated in the lab app,
`CapabilitiesSettings`); after this work order it reads everything through one
**read-only inspection port** provided by core, so observing never means poking
other plugins' internals.

Because observer must read _across_ persistence namespaces (the one legitimate
exception to the namespaced-handle rule — spec §5, persistence decision), it
consumes a dedicated read-only inspection capability rather than a raw driver.
This keeps the "stores can only touch their own keys" invariant honest: observer
doesn't get a writeable exception, it gets a different, weaker capability.

## Target structure

```
plugins/observer/src/
├─ plugin.ts             createPluginKit — id "rune-lab.observer"; requires: [];
│                        slot: observer (holds inspection state); settings; accessors
├─ stores/
│  └─ observer.svelte.ts  factory-only: wraps the core inspection port; selected-view state
├─ components/
│  ├─ ObserverPanel.svelte      thin shell (today: 215-line template, fallow HIGH — decomposed)
│  ├─ PluginGraphView.svelte    plugin/slot dependency graph read from forge specs
│  ├─ CellsView.svelte          standard cells: value, version, schema-validity, subscriber count
│  ├─ StoresView.svelte         per-slot store snapshots (generic, via kernel enumeration)
│  └─ PersistenceView.svelte    read-only keys/values across namespaces via inspection port
├─ settings.ts           defineSettings("capabilities") — replaces CapabilitiesSettings.svelte:
│                        toggles for which observer views are enabled, verbosity, redaction
├─ types.ts
└─ mod.ts                export-only
```

## Core prerequisite (tiny, do first)

Add the **inspection port** to core (this is the only cross-ring task in this
work order; it belongs to Phase 1's ports but is small enough to land here if it
slipped): a read-only capability exposing — the normalized plugin specs the
kernel was built from, the resolved topological order (plugins and slots),
per-slot metadata (persist keys, contributions, exposure), read access to
persistence entries by namespace, and cell metadata (`getCellVersion` already
exists; add enumeration). Nothing on this port mutates. The kernel facade
exposes it behind one accessor so ui/observer never reach into wiring internals.

## TODO — observer

- [ ] Land the core inspection port (contract above) with unit tests: spec
      enumeration matches registered plugins; order matches wiring's sort;
      persistence reads are read-only (attempted writes are a type error, not a
      runtime check).
- [ ] Write `plugin.ts`: single `observer` slot (create-only, no persistence —
      or `persist:` only for view preferences), settings schema attached.
- [ ] Convert store to factory; its state is _view_ state (which panel, filters,
      redaction toggles) — all kernel/system data flows from the inspection
      port, never cached copies.
- [ ] Decompose `ObserverPanel.svelte` (fallow HIGH: 215-line template,
      cognitive 17; plus `loadKeys`/`clearAll` findings) into the four view
      components; `clearAll` disappears — observer is read-only after this work
      order (destructive persistence actions, if wanted, become _commands
      contributed to palettes_ by the app, not observer buttons). Flag this
      behavior change in the changelog.
- [ ] Build `PluginGraphView` from forge specs: render `requires` edges and slot
      `dependsOn` edges — this is the forge's introspectability paying off, and
      it visually proves the palettes→layout dependency.
- [ ] Replace `CapabilitiesSettings.svelte` with `settings.ts` primitives
      (toggles); delete the component.
- [ ] Absorb the lab app's `PersistenceInspector`/`StoresMirror` duplication:
      those lab components become thin wrappers over observer's views (or are
      deleted in favor of mounting observer's panel) — note this touches
      `apps/lab` only as consumer updates.
- [ ] `mod.ts` export-only; standard-shape gate green.
- [ ] Lab: observer panel shows the live plugin graph including palettes→layout;
      cells view reflects a theme change in real time (version bump visible);
      persistence view shows namespaced keys from layout + i18n.

## Exit criteria

Fallow: `ObserverPanel` HIGH cleared; zero cycles under `plugins/observer`;
standard-shape green. Core: inspection-port tests green; no observer code path
writes persistence or mutates another plugin's store (fitness: observer's tree
imports only ui public surface + core types). Lab: the observer panel is the
visual acceptance proof for the _entire_ forge refactor — if the plugin graph it
draws matches the specs you wrote, v0.5's wiring is demonstrably real.
