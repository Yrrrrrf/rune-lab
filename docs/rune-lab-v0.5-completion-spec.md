# Rune Lab — v0.5 Completion Spec: The Forge Refactor

> **Status:** Approved plan · **Scope:** completes v0.5 (the version is not done
> until this lands) **Companions:** `plugin-refactor-layout-palettes.md`,
> `plugin-refactor-i18n.md`, `plugin-refactor-observer.md` **Precedence:**
> `docs/MANIFEST.md` (constitution) → this spec (law) → `docs/ARCHITECTURE.md`
> (map, updated after landing) **Discipline:** zero code in this document.
> Contracts are named and described; implementation is derived from them.

---

## 0. Executive summary

v0.5 shipped the _shape_ (three rings, one package, one dependency direction)
but the shape is hand-maintained: every plugin hand-expands the same ritual —
symbol table, accessor calls with four derivable string arguments, store
factories that must each remember to inject the persistence driver, and a
bespoke settings component. This spec introduces the **forge**: a declarative
definition layer where a plugin is a _specification_ and everything mechanical
(context symbols, typed accessors, driver injection, settings sections,
fail-loud errors, dependency ordering) is _derived_. It is the TypeScript
analogue of `logic_tracer`'s `impl_enum_token!` macro: declare the data once,
generate the behavior. The 10-year bet: the plugin spec becomes the stable
public contract, while everything generated from it can be re-implemented,
optimized, or re-targeted (a second adapter, devtools, docgen, manifest
validation) without touching a single plugin. Boilerplate becomes structurally
unwritable, and the two classes of bugs already hit in v0.5 (forgotten driver
injection, barrel-import cycles) become impossible rather than merely
discouraged.

---

## 1. Context & constraints

**Project context.** Existing Deno/Vite monorepo (`rune-lab`), three workspace
rings (`core`, `ui`, `plugins/*`), one published npm package with subpath
exports produced by the `manifest.ts` + `build.nu` fold. Svelte 5 runes-first,
DaisyUI + Tailwind v4 for styling, Effect-based DI in the kernel. Acceptance
harness: `apps/lab`.

**Main goals ("done" for v0.5).**

1. Zero hand-written plugin boilerplate: one declaration per plugin generates
   symbols, accessors, store entries, settings.
2. All fallow structural findings resolved: zero circular dependencies, zero
   clone groups traceable to plugin wiring, entry points configured so dead-code
   numbers are trustworthy.
3. The dist is honest: every gate green, clean-room tarball install boots the
   lab app.
4. Each plugin restructured to the standard shape (see §4) per its companion
   document.

**Team & scale.** Solo maintainer + AI agents. Scale target is _consumer count_,
not traffic: the package must stay learnable from its types alone.

**Architectural rules (mandated).**

- Dependency direction: `core ← ui ← plugins ← apps`. Never up, never sideways —
  with one _declared_ exception introduced by this spec: plugin-level
  dependencies (palettes → layout), mediated by the kernel, never by direct deep
  imports.
- Plugin dependency graph for v0.5: `palettes requires layout`; `i18n` agnostic;
  `observer` agnostic; `layout` depends only on ui.
- Runes-first, no legacy stores, no `$:`.
- The specifier table (`ARCHITECTURE.md §2.1`) is a three-party contract (source
  / `manifest.ts` / `build.nu`). **This refactor must not change the export
  map.** All restructuring is internal to each ring's `src/`.
- Stack rules: Deno, `just`, nushell scripts, `biome`-class tooling as
  configured; no new runtime dependencies without a trade-off block.

**Out of scope (explicit).**

- `pretext` integration into the main layout (flagged as v-next in the layout
  companion doc).
- Extracting `apps/lab` showcase content into a plugin (post-v0.5).
- Any change to the publish pipeline beyond adding verification gates.
- A second framework adapter (the forge must merely not preclude it).

**Assumptions.**

- [ASSUMPTION] "Settings belong to their own domain" means each plugin owns its
  settings _schema and any custom field renderers_, while ui owns exactly one
  generic, domain-free settings renderer that understands field _primitives_
  only.
- [ASSUMPTION] Palette extensibility ("an interface to add new stuff there")
  means a public contribution point where any plugin or app registers a palette
  definition, rendered inside one shared DaisyUI modal host owned by palettes.
- [ASSUMPTION] `language` remains a layout concern (an app-shell setting); i18n
  owns message resolution and money. Confirmed by your dependency graph ("i18n
  is agnostic").
- [ASSUMPTION] Breaking every existing consumer-facing signature is acceptable
  pre-1.0 ("Not backward-compatible with its own past" — manifesto).

---

## 2. Architecture overview

The system remains three rings; the refactor adds a **horizontal layer** (the
forge) that spans core and ui, and formalizes **plugin-level dependencies** in
the kernel.

```
┌──────────────────────────────────────────────────────────────────────┐
│ apps/lab                     acceptance harness (unchanged role)      │
├──────────────────────────────────────────────────────────────────────┤
│ plugins/                                                              │
│   layout      ── the app shell: zones, presets, theme, language      │
│   palettes    ── requires:[layout] · palette registry + modal host   │
│   i18n        ── agnostic · lang resolution + money                  │
│   observer    ── agnostic · devtools/inspection                      │
│   each = ONE plugin.ts declaration + stores/ + components/           │
│           + settings.ts + types.ts + mod.ts(export-only)             │
├──────────────────────────────────────────────────────────────────────┤
│ ui  ("rune-lab")                                                      │
│   provider/    RuneProvider + context primitives                     │
│   reactivity/  useCell bridge, AppStore                              │
│   define/      ★ plugin-kit: spec → typed accessors + symbols        │
│   settings/    ★ ONE generic field renderer (primitives only)        │
│   persistence/ browser drivers (logic moved down to core)            │
├──────────────────────────────────────────────────────────────────────┤
│ core ("rune-lab/core")                                                │
│   kernel/      facade + lifecycle + wiring (split of kernel/compiler)│
│   forge/       ★ definePlugin v2: slots, requires, settings schema   │
│   cells/       state cells + schema guards + defineCell              │
│   ports/       persistence · locale · text                           │
│   config/      ★ generic keyed-item store (moved from ui)            │
│   registry/ utils/                                                    │
└──────────────────────────────────────────────────────────────────────┘
        imports flow strictly downward; palettes→layout is a kernel-
        mediated *declared* dependency, not an import exception
```

**Core domain vs supporting.** The core domain is the **plugin lifecycle** (spec
→ resolution → ordering → instantiation → context publication → disposal).
Everything else — drivers, settings rendering, palettes, layout zones — is a
supporting domain expressed _through_ that lifecycle. This inversion is the
point: at year 10, features churn; the lifecycle contract is what must not.

---

## 3. Design patterns & code standards

### 3.1 Core / forge — **Declarative Specification + Interpreter** (the "macro" pattern)

- **Pattern.** A plugin is pure data (a spec object) interpreted by the kernel.
  This is the Interpreter pattern over a closed spec vocabulary, deliberately
  mirroring `impl_enum_token!`: variants declared once, behavior generated.
- **Why.** Hand-expanded wiring already produced two real bug classes in v0.5
  (forgotten `setDriver`, barrel cycles). A spec interpreted in one place makes
  the ritual live in exactly one function. Year 3: new slot options (lazy
  stores, scoped persistence) are additive spec fields, not N plugin edits. Year
  5: the spec is machine-readable — docgen, devtools graph view, and manifest
  validation read it for free. Year 10: a second adapter interprets the same
  specs.
- **How (contracts, no code).**
  - `definePlugin` (v2) accepts a spec with: `id` (reverse-dns string),
    `requires` (array of plugin ids — **new**, plugin-level dependency), `slots`
    (record: slot name → slot spec), `settings` (optional settings schema, see
    §3.3), `overlays`, `contributions`.
  - A **slot spec** contains: `create` (factory receiving a typed context:
    validated config, persistence handle, resolved dependency stores — the
    _only_ instantiation channel; module-level singletons are banned), `config`
    (optional schema validating that plugin's config slice; invalid config =
    loud throw at kernel build, naming plugin, slot, and offending key),
    `persist` (boolean or key-list; when set, the kernel injects the driver and
    wires load/flush — plugins never see the driver-injection ritual),
    `dependsOn` (slot-level, may reference `pluginId.slotName` across plugins
    iff that plugin is in `requires`), `expose` (boolean, default true: whether
    a context symbol + accessor is derived).
  - The forge derives, per exposed slot: a stable context symbol (namespaced
    `rl:<pluginId>:<slot>`), and an accessor _descriptor_ (name derived as
    `get<PascalCase slot>Store`, plus the human strings for the fail-loud
    error). Symbol derivation lives in core; Svelte binding lives in ui (§3.2).
  - **Kernel lifecycle split.** `kernel/wiring.ts` (rename of `compiler.ts`):
    spec normalization → plugin-level topological sort (over `requires`) →
    slot-level topological sort → Effect layer assembly. `kernel/lifecycle.ts`:
    the `setCell` persist-and-revert ritual, contribution single-registration,
    disposal. `kernel/kernel.ts`: facade only, target ≤ 60 LOC per function
    (directly addresses fallow's `createKernel` CRITICAL, 170 LOC / cyclomatic
    15).
- **Standards.** Spec fields are the _only_ extension vector — a feature that
  can't be expressed as a spec field must justify a kernel change in writing.
  Every kernel error message names: the plugin id, the slot, and the fix. No
  `as any` inside forge; the spec's generic parameters must carry types
  end-to-end (slot name literal types → accessor name literal types via
  template-literal type mapping).

### 3.2 Ui / define — **Adapter + Generated Facade**

- **Pattern.** ui interprets forge _descriptors_ into Svelte artifacts:
  `createPluginKit` consumes a forged plugin and returns `{ plugin, accessors }`
  where `accessors` is a mapped object whose keys are the derived
  `get<Slot>Store` names, fully typed. Internally each accessor is today's
  `createAccessor` (fail-fast `getContext`), but no human ever writes the four
  string arguments again.
- **Why.** Keeps the ring rule intact: symbol _identity_ is framework-free
  (core), symbol _consumption_ (`getContext`) is Svelte (ui). Year 5: a devtools
  panel enumerates every kit's accessors generically. Year 10: the kit is the
  only file a second adapter would re-implement.
- **How.** `RuneProvider` keeps its generic loop (resolved slot with symbol →
  `setContext`), now also mounting: the settings pipeline (§3.3) and the overlay
  loop, both driven purely by contributions. The provider gains **zero** domain
  knowledge — the boundary grep (`Theme|Shortcut|Command|Toast|Currency|hotkeys`
  → zero hits in ui) remains a CI gate.
- **Standards.** ui may only know these vocabularies: kernel, cell, slot,
  accessor, driver, settings-field-primitive, overlay, contribution. Anything
  else is a plugin word.

### 3.3 Settings — **Schema-driven UI (Interpreter) + domain-owned custom fields (Strategy)**

- **Pattern.** A settings section is a _schema_: ordered fields, each a
  primitive (`select`, `toggle`, `text`, `number`, `range`, `color`) or `custom`
  (a component reference supplied by the owning plugin). ui ships exactly one
  `SettingsFields` renderer that interprets primitives and mounts customs. Each
  field binds declaratively to a target: a kernel cell, a slot store property,
  or a callback.
- **Why (this is the "best not easiest" choice).** The easy version (primitives
  only) would delete `GeneralSettings` but leave `ShortcutSettings`' keybind
  capture hand-rolled and un-uniform. The Strategy escape hatch keeps _every_
  settings surface flowing through one pipeline — search indexing
  (SettingsModal's fuzzy search operates over schemas, not components),
  consistent persistence, consistent a11y — while domains keep full power:
  **palettes owns the `keybind` custom field**, i18n could own a
  `currency-picker` field. Year 3: settings search, import/export, and per-field
  reset are pipeline features, written once. Year 10: settings schemas are
  serializable → remote config, docs generation.
- **How.** `defineSettings` (core/forge) validates and freezes a schema
  `{ id, label, icon, fields[] }`. Plugins attach it via the spec's `settings`
  key; the kernel converts it into the existing `settingsSections` contribution
  (single-registration guarantee preserved). Kills three of fallow's top
  complexity offenders (`GeneralSettings`, `CapabilitiesSettings`, the
  settings-list halves of `ShortcutSettings`) and gives lang + money settings
  pages at near-zero cost.
- **Standards.** A custom field component receives a normalized contract
  (current value, commit callback, disabled flag, field metadata) — never the
  kernel directly. Field ids are stable and namespaced (`pluginId.fieldId`)
  because they become persistence keys and search keys.

### 3.4 Layout — **App Shell with named Zones (Composite + Slot/Contribution)**

- **Pattern.** The layout plugin becomes the _application shell_: a
  `WorkspaceLayout` composite exposing **named zones** (`nav`, `strip`,
  `content`, `detail`, `statusbar`, `overlay-anchor`) and **presets** that
  toggle zone topology — from `page` (content only) through `docs` (nav +
  content) to `workspace` (full VS-style: strip + nav + content + detail +
  statusbar). Zone visibility/size is kernel state (a layout slot store), so
  palettes and apps can command it.
- **Why.** This is your stated product vision: "from a simple page to a vs-based
  layout, all in one, handling all the boilerplate." Zones-as-contract is what
  lets palettes _depend on_ layout without touching its internals: palettes
  registers commands like "toggle detail panel" against the zone store's public
  surface. Year 10: presets are data; new topologies don't fork the composite.
- **Standards.** Zone names are a closed enum in v0.5 (additive later). Presets
  are declarative zone-state records, not components.

### 3.5 Palettes — **Registry + Host (Plugin-within-plugin)**

- **Pattern.** Palettes exposes its _own_ contribution point, `palettes`: a
  `PaletteDefinition` contract (`id`, `title`, `hotkey?`, a search/provider
  function yielding typed items, optional item renderer, an `onSelect`
  semantic). One `PaletteHost` overlay — a single DaisyUI modal — renders
  whichever palette is active. Commands, shortcuts, and settings-search become
  _registered palettes themselves_ (dogfooding: the built-ins use the same
  public interface third parties do).
- **Why.** "It must add some palette for shortcuts, metadata, etc, and an
  interface to add new stuff there" — a registry is the only design where "add
  new stuff" is one contribution, not a modal fork. Dogfooding guarantees the
  public interface stays sufficient. Year 5: apps ship their own palettes (file
  switcher, user search) with zero palettes-plugin changes.
- **Standards.** The modal host owns focus trap, hotkey arbitration (single
  `hotkeys-js` binding surface — palettes' dependency, never ui's), and
  open/close state as a kernel slot. `requires: [layout]` is declared in the
  spec; the only cross-plugin touches are layout's _public_ accessors and zone
  store.

### 3.6 Persistence — **Ports & Adapters (unchanged direction, relocated logic)**

- **Pattern/decision.** The generic keyed-item store (`createConfigStore`) moves
  to `core/config/` — it is domain-free state logic with a driver port, which is
  core's definition. Browser drivers (`localStorage`, `session`, `cookie`) stay
  in ui (they touch `document`/`window`). This resolves the open question
  carried in ARCHITECTURE §4.
- **Standards.** Only the kernel calls driver methods during slot instantiation
  (`persist:` handling). Stores receive a narrowed persistence _handle_ (get/set
  for their namespaced keys), never the raw driver — prevents key-collision
  classes of bugs permanently.

---

## 4. Component map & directory structure

Per-component: responsibility · location · exposes · consumes · must-not.

| Component         | Responsibility (one sentence)                            | Location                                | Exposes                                                                     | Consumes                     | Must NOT                                      |
| ----------------- | -------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------- |
| kernel facade     | Public kernel API surface                                | `core/src/kernel/kernel.ts`             | `createKernel`, `Kernel`                                                    | wiring, lifecycle, cells     | contain wiring logic; exceed 60-LOC functions |
| wiring            | Spec → ordered Effect layers                             | `core/src/kernel/wiring.ts`             | internal                                                                    | forge, registry, graph utils | know Svelte or DOM                            |
| lifecycle         | setCell persist/revert, contributions, dispose           | `core/src/kernel/lifecycle.ts`          | internal                                                                    | ports, cells                 | be reachable except via facade                |
| forge             | Plugin/slot/settings spec definition + derivation        | `core/src/forge/`                       | `definePlugin`, `defineSlot` (internal), `defineSettings`, descriptor types | cells schemas                | instantiate anything; import kernel           |
| cells             | Schema-guarded standard cells + `defineCell`             | `core/src/cells/`                       | cell contract (`get/set/subscribe/getVersion`)                              | ports                        | know consumers                                |
| config            | Generic keyed-item store w/ persistence handle           | `core/src/config/`                      | `createConfigStore` contract                                                | ports                        | contain domain words                          |
| ports             | Driver/locale/text interfaces + memory driver            | `core/src/ports/`                       | port types                                                                  | —                            | ship browser code                             |
| plugin kit        | Forged plugin → Svelte accessors facade                  | `ui/src/define/plugin-kit.ts`           | `createPluginKit`                                                           | forge descriptors, context   | special-case any plugin id                    |
| settings renderer | Interpret field primitives; mount customs                | `ui/src/settings/SettingsFields.svelte` | one component                                                               | settings schema contract     | know any domain field                         |
| provider          | Create/provide/dispose kernel; mount overlays + settings | `ui/src/provider/`                      | `RuneProvider`                                                              | kit, kernel                  | domain props/callbacks                        |
| reactivity        | `useCell`, AppStore                                      | `ui/src/reactivity/`                    | `useCell`, `getKernel`                                                      | kernel cell contract         | write persistence directly                    |
| drivers           | Browser persistence drivers                              | `ui/src/persistence/`                   | 3 drivers                                                                   | ports                        | contain store logic (moved to core/config)    |
| layout plugin     | App shell: zones, presets, theme, language               | `plugins/layout/`                       | see companion doc                                                           | ui public surface            | import palettes/i18n/observer                 |
| palettes plugin   | Palette registry + modal host + shortcuts                | `plugins/palettes/`                     | see companion doc                                                           | ui + layout _public_ surface | deep-import layout internals                  |
| i18n plugin       | Message resolution + money                               | `plugins/i18n/`                         | see companion doc                                                           | ui public surface            | import any sibling plugin                     |
| observer plugin   | Runtime inspection devtools                              | `plugins/observer/`                     | see companion doc                                                           | ui public surface            | mutate other plugins' stores                  |

**Standard plugin shape** (identical across all four; enforced by a fitness
function):

```
plugins/<name>/src/
├─ plugin.ts        the single definePlugin/createPluginKit invocation; accessors exported here
├─ stores/          *.svelte.ts — factories only, no module-level singletons
├─ components/      *.svelte — import accessors from ../plugin.ts, NEVER from ../mod.ts
├─ settings.ts      defineSettings schema (+ custom field components under components/)
├─ types.ts         the plugin's owned vocabulary
└─ mod.ts           export-only barrel; nothing inside the plugin imports it
```

Full target trees per ring appear in the companion documents; core and ui trees
are as drawn in §2.

---

## 5. Trade-off analysis

```
DECISION: Where the declarative "macro" layer lives
OPTIONS:
  A. All in ui — simplest; but the spec becomes Svelte-coupled, killing devtools/
     docgen/second-adapter reuse, and core keeps a worse plugin contract than ui.
  B. Split: spec + derivation in core/forge, Svelte binding in ui/define — respects
     ring direction; spec is machine-readable framework-free data; slightly more
     indirection (descriptor handoff).
  C. Codegen step (generate accessors at build time) — maximal type output; but adds
     a compiler to the three-party build contract, violates "obvious over clever".
CHOSEN: B
REASON: The spec is the 10-year asset; it must outlive the adapter. Indirection cost
        is one descriptor type.
REVISIT IF: TypeScript inference for derived accessor names proves unreadable in
        practice (then C for names only). [REVISIT]
```

```
DECISION: Store instantiation model
OPTIONS:
  A. Keep singletons, kit injects drivers — minimal diff; but singletons already
     caused the v0.5 persistence bugs and leak state across kernels in tests.
  B. Support both, deprecate singletons — gradual; but two paths = the ritual
     survives in one of them.
  C. Factories only (`create`), kernel-owned lifecycle — breaks every store file now.
CHOSEN: C  (explicit user decision: "I do not want a fix, I want the best")
REASON: One instantiation channel makes driver injection, disposal, and test
        isolation structural. Pre-1.0 is the only cheap moment to do this.
REVISIT IF: Never — this is the load-bearing invariant. [HIGH RISK: touches every
        store file in one sweep; mitigated by phase gating + per-plugin docs]
```

```
DECISION: Settings rendering strategy
OPTIONS:
  A. Primitives-only generic renderer — deletes GeneralSettings; keybind capture
     stays bespoke and outside search/persistence pipeline.
  B. Primitives + domain-owned custom fields (Strategy) — one pipeline for
     everything; custom contract to design carefully.
  C. Fully bespoke per plugin (status quo) — three CRITICAL-complexity components
     and no uniformity.
CHOSEN: B  (explicit user decision: "best, and they must belong to their own domain")
REASON: Search, persistence, reset, a11y become pipeline features written once;
        domains keep full power via custom fields they own.
REVISIT IF: Custom-field contract needs >5 members — sign the abstraction is wrong.
```

```
DECISION: Plugin-to-plugin dependency mechanism (palettes → layout)
OPTIONS:
  A. Direct import of layout internals — trivially works; creates the sideways
     coupling the manifesto bans; breaks if layout restructures.
  B. Kernel-mediated: `requires:` in spec + cross-plugin `dependsOn` on slots,
     public accessors only at component level — ordering + loud missing-dep errors
     for free (graph utils already exist).
  C. Event bus between plugins — maximal decoupling; but introduces a second
     communication paradigm next to cells/contributions, and ordering is implicit.
CHOSEN: B
REASON: Reuses the existing topological machinery; the dependency is declared,
        inspectable, and testable. Sideways imports stay grep-bannable.
REVISIT IF: A third plugin-pair dependency appears with *runtime-optional* coupling
        — then add an optional-requires flavor, not a bus.
```

```
DECISION: Palette extensibility model
OPTIONS:
  A. Fixed built-ins (commands + shortcuts) with a config array — easy; "add new
     stuff" means forking the modal.
  B. Registry contribution point + one modal host; built-ins register themselves —
     public interface proven by dogfooding.
  C. Each palette its own overlay/modal — no registry; N modals, N focus traps,
     N hotkey arbiters.
CHOSEN: B
REASON: Matches the stated vision ("interface to add some new stuff there") and the
        contribution machinery already exists and is single-registration-guarded.
REVISIT IF: A palette needs a non-modal surface (inline, sidebar) — extend host
        strategy, keep the registry.
```

```
DECISION: Persistence/data strategy (the closest thing to "data storage" here)
OPTIONS:
  A. Raw driver passed to stores (status quo) — flexible; key collisions and
     forgotten wiring possible.
  B. Kernel-owned `persist:` with namespaced handles — stores can only touch their
     own keys; loading/validation/flush uniform.
CHOSEN: B
REASON: Same argument as slots: make the ritual unwritable. Schema-guarded loads
        (bad persisted value → fallback, never crash) become universal, not per-cell.
REVISIT IF: A store legitimately needs cross-namespace reads (observer does — it
        gets a read-only inspection port instead, see observer doc).
```

**Deployment model:** unchanged single-package fold — deliberately not
revisited; the three-party contract is the most fragile asset in the repo and
this refactor's job is to leave it untouched. **Auth:** not applicable (client
library).

---

## 6. Phased implementation plan

> Each phase independently shippable; `just audit` + gate suite must pass at
> every exit.

**Phase 0 — Truthful baseline (tooling)**

- Goal: make fallow's numbers trustworthy and codify today's gates so
  regressions are visible during the refactor.
- Build: `.fallowrc.json` entry-point configuration (each package `mod.ts` +
  `apps/lab`); `check.just` recipes for the boundary grep, specifier-leak,
  export-map, and reshuffle-integrity gates; a new **standard-shape** fitness
  recipe (asserts plugin folder convention + "nothing imports its own mod.ts").
- Dependencies: none.
- Exit: dead-file % drops from the false 100% to a real number; all gates
  runnable via one recipe; CI wired.
- Risk: fallow entry-point semantics may need per-package config — timebox, fall
  back to explicit file lists.

**Phase 1 — Core forge & kernel split**

- Goal: the spec vocabulary exists and the kernel interprets it.
- Build: `forge/` (plugin spec v2, slot spec, `defineSettings`, descriptor
  derivation, symbol namespacing); kernel split (`kernel.ts` facade /
  `wiring.ts` / `lifecycle.ts`); plugin-level `requires` in the topological sort
  (extend `utils/graph.ts` usage); kernel-owned `persist:` with namespaced
  handles; `config/` (moved `createConfigStore`, driver → handle).
- Dependencies: Phase 0 gates.
- Exit: kernel test suite green including new tests — plugin-level cycle
  detection (loud, names both ids), missing `requires` error, persist-handle
  namespacing, config-schema rejection naming plugin+slot+key, contribution
  single-registration preserved; `createKernel` fallow CRITICAL cleared.
- Risk: Effect layer assembly interacts with the new ordering — [HIGH RISK],
  spike first (see §9).

**Phase 2 — Ui define layer & settings pipeline**

- Goal: one declaration yields typed accessors and rendered settings.
- Build: `define/plugin-kit.ts` (descriptor → `{plugin, accessors}` with
  template-literal-typed names); `settings/SettingsFields.svelte` (primitives
  interpreter + custom mount contract); provider updates (settings pipeline,
  unchanged generic context loop); folder moves (`provider/`, `reactivity/`).
- Dependencies: Phase 1.
- Exit: a synthetic test plugin defined in ≤ the "three-line recipe" gets:
  working accessor with correct derived name and fail-loud message, persisted
  slot, rendered settings section; ui boundary grep still zero hits;
  `accessors.test.ts` rewritten against kits.
- Risk: mapped-type inference for accessor names across the package boundary —
  prototype in isolation first.

**Phase 3 — Plugin migrations (order: layout → palettes → i18n → observer)**

- Goal: every plugin on the standard shape; all cycles and wiring clones gone.
- Build: per companion document. Order is forced by the dependency graph: layout
  must land (zones, presets, factories) before palettes (which `requires` it);
  i18n and observer are parallelizable after Phase 2.
- Dependencies: Phase 2; lab app updated per plugin as it lands (lab compiles at
  every step — plugins migrate one at a time).
- Exit: fallow — 0 circular dependencies, 0 wiring-clone groups, all four former
  CRITICAL settings/kernel offenders cleared; standard-shape fitness green for
  all plugins; lab exercises every migrated surface.
- Risk: layout is the largest and most-consumed plugin — [HIGH RISK]; its
  companion doc front-loads the zone-store contract for exactly this reason.

**Phase 4 — Dist wiring & clean-room acceptance (v0.5 "actually done")**

- Goal: the dist is honest.
- Build: nothing new — run the full gate suite against `build/`; tarball pack;
  scratch SvelteKit app _outside_ the workspace: install, import root +
  `rune-lab/core` + `rune-lab/layout` + `rune-lab/palettes`, render provider,
  verify theme/language/persistence switching, palette open via hotkey, settings
  modal renders all schema-driven sections.
- Exit: every §2.3 ARCHITECTURE gate green + the two new gates (standard-shape,
  fallow-clean); ARCHITECTURE.md rewritten to describe the landed reality; this
  spec archived under `docs/specs/`.
- Risk: workspace-shadowing false positives (documented in ARCHITECTURE §2.2) —
  the tarball is the only honest gate; never sign off on `just run lab` alone.

---

## 7. Implementation management

**Sequencing (critical path).**
`fallow config → forge spec → kernel wiring/persist → plugin kit → settings renderer → layout → palettes → clean-room`.
Everything else (i18n, observer, doc updates) hangs off this path without
blocking it.

**Dependency graph (plain text).** Phase 1 blocks 2; 2 blocks all of 3; within
3, layout blocks palettes; i18n ∥ observer ∥ (layout→palettes); 3 blocks 4.

**Ownership.** Solo + agents: treat each companion doc as an agent-executable
work order — they restate context precisely so a fresh conversation can execute
one without this spec in context (they link back for the contracts).

**Integration points (high-risk, coordinate carefully).**

1. Forge descriptor ↔ plugin kit type handoff (Phases 1→2) — the
   template-literal accessor typing crosses a package boundary; freeze the
   descriptor type before Phase 2 starts.
2. Layout zone-store contract ↔ palettes commands (Phase 3) — freeze the zone
   store's public surface in the layout doc before palettes migration begins.
3. Settings custom-field contract ↔ palettes keybind field (Phases 2→3) — the
   contract must be final before ShortcutSettings is decomposed.

**Breaking changes (painful to undo — flagged).**

- [HIGH RISK] Factories-only store model: every store file, every test touching
  singletons.
- [HIGH RISK] Symbol namespacing scheme (`rl:<pluginId>:<slot>`): anything that
  persisted or serialized old symbols' assumptions breaks; acceptable pre-1.0,
  unthinkable after — get the naming right _now_.
- Settings field ids as persistence keys: renaming a field id after v0.5 ships =
  users lose that setting. Treat ids as public API from day one.

---

## 8. Validation & testing strategy

| Layer                   | Test type              | What it verifies                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| forge                   | Unit (Deno)            | Spec normalization, symbol/accessor-name derivation, settings schema freezing, config-schema rejection messages                                                                                                                                                                                                                                                                                                                                            |
| kernel wiring           | Unit                   | Plugin+slot topological order, `requires` cycle/missing errors, persist-handle namespacing, contribution single-registration                                                                                                                                                                                                                                                                                                                               |
| kernel lifecycle        | Unit                   | setCell persist-then-revert-on-failure, disposal releases every slot                                                                                                                                                                                                                                                                                                                                                                                       |
| plugin kit              | Unit (svelte test env) | Accessor names/types, fail-loud message content, context wiring through a real provider                                                                                                                                                                                                                                                                                                                                                                    |
| settings pipeline       | Component tests        | Each primitive renders/commits; custom mount contract; schema→search indexing                                                                                                                                                                                                                                                                                                                                                                              |
| each plugin             | Unit + component       | Per companion doc; keybind field, palette registry, zone presets, money math (existing suites preserved)                                                                                                                                                                                                                                                                                                                                                   |
| full flows              | Lab acceptance         | Theme/language/currency switching persists across reload; palette hotkeys; preset switching                                                                                                                                                                                                                                                                                                                                                                |
| dist                    | Clean-room E2E         | Tarball install in scratch app; all subpath imports resolve; provider boots                                                                                                                                                                                                                                                                                                                                                                                |
| **architecture itself** | **Fitness functions**  | (1) ui boundary grep zero-hit; (2) `rg "@rune-lab" build/` zero-hit; (3) export-map path existence; (4) reshuffle relative-import integrity; (5) **standard-shape**: plugin folder convention + no internal `mod.ts` imports; (6) **fallow gates**: 0 cycles, 0 wiring clones, complexity thresholds on kernel/settings files; (7) sideways-import ban: plugins may deep-import only their own tree (palettes→layout limited to layout's `mod.ts` surface) |

**Local dev validation:** one recipe (`just check`) = format + type + unit +
fitness; `just audit` = fallow suite; both must pass before any phase-exit
claim. **Observability:** the observer plugin _is_ the runtime observability
story (kernel graph, store states, persistence contents) — its companion doc
adds a forge-aware inspection port so it reads the plugin graph from specs, not
from reflection hacks.

---

## 9. Open questions & risks

1. **Effect layer ordering vs plugin-level `requires`** — the current layer
   stack was built for slot-level ordering only. _Spike before Phase 1 commits:_
   one plugin requiring another, verify layer memoization still holds. Could
   reshape `wiring.ts` internals (not its contract).
2. **Accessor-name typing across the fold** — template-literal types through
   `svelte-package` + the specifier rewrite is unproven in this repo. _Spike in
   Phase 2 week 1;_ fallback is explicit accessor names in the spec (one extra
   field, no architecture change).
3. **`hotkeys-js` at year 10** — single-maintainer dependency. Palettes already
   isolates it; the palette registry should treat the hotkey binder as an
   internal strategy so it's swappable. Noted in the palettes doc.
4. **Zone enum sufficiency** — the closed v0.5 zone set may prove too rigid once
   lab-content-as-plugin lands. Deliberately deferred; presets-as-data keeps the
   escape hatch open.
5. **`pretext` on the main layout** — out of scope by decision; the layout doc
   reserves a `statusbar`/`content` integration note so the zone contract
   doesn't accidentally preclude it.
6. **AppStore.version vs package version() duo** — still open from ARCHITECTURE
   §4; park it, it's orthogonal to the forge.
