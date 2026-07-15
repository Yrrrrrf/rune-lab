# Rune Lab — Plugin Work Order: `pretext` × Layout

> **Status:** Approved plan (alignment loop closed) · **Scope:** v-next, layout
> plugin only **Companions:** `rune-lab-v0.5-completion-spec.md` (law),
> `plugin-refactor-layout-palettes.md` (Part A landed) **Discipline:** zero
> code. Contracts are named and described; implementation is derived from them.
> **Resolves:** spec §9.5 ("pretext on the main layout — reserved via the
> statusbar/content zone contract").

---

## 0. Executive summary

`pretext` is a text _engine_, not a component: prepare once (canvas measurement,
ICU segmentation, bidi, CJK/kinsoku), lay out at ~0.0002 ms per block on every
resize, walk line ranges incrementally, compose rich inline runs with atomic
pills. The integration bet: **layout is the only coherent owner** because it
already owns the two inputs pretext is sensitive to — `language` (drives
segmentation locale) and `theme` (drives the canvas font shorthand that keys
every metric cache). This plan wires pretext behind the existing
`core/ports/text` interface, houses the single adapter inside the layout plugin,
and exposes one new `text` slot whose store is a **lifecycle facade over a raw
engine passthrough**: layout curates exactly what only layout can curate (SSR
guard, locale sync, theme-driven cache invalidation, a reactive `epoch`), and
passes the full pretext surface through untouched underneath. Nothing pretext
can do is precluded; nothing is speculatively wrapped. Two consumers prove it:
DOM-line `Text`/`RichText` components (flagship) and statusbar overflow
management (the §9.5 zone-contract proof). The 10-year shape: the port makes the
engine swappable, the epoch makes invalidation one number, and palettes (and any
third party) later consumes text geometry through `getTextStore` with zero
layout edits.

---

## 1. Decisions, assumptions, out of scope (alignment record)

**Decisions (from the loop):**

| # | Decision               | Choice                                                             |
| - | ---------------------- | ------------------------------------------------------------------ |
| 1 | Adapter location       | **B** — inside `plugins/layout`; only the port _interface_ in core |
| 2 | Exposed surface        | **B** — lifecycle facade + full raw engine passthrough             |
| 3 | First consumers        | **A + B** — `Text`/`RichText` components + statusbar overflow      |
| 4 | Rendering strategy     | **A** — DOM lines (pretext computes breaks; DOM renders them)      |
| 5 | Invalidation mechanics | **A** — single reactive `epoch` version                            |

**Standing assumptions (all [ASSUMPTION]):**

- Zone set stays closed; pretext mounts _through_ `statusbar`/`content`; no new
  zones.
- `pretext` pinned to an exact commit/version; trade-off block in §5.
- The core port gets a deterministic fake adapter (fixed-advance metrics) for
  kernel/unit tests, mirroring the persistence memory driver.
- Export map untouched; all changes internal to `plugins/layout/src/` plus one
  port-type file in core.
- `setLocale` / cache clearing are called **exclusively** by layout's text slot
  — a documented hard rule.
- Palettes consumption (measured palette rows, etc.) is out of scope; only "must
  not preclude" applies.
- SSR strategy: lazy init on first browser access; server side is a fail-loud
  stub plus a `ready` flag.

**Out of scope (explicit):**

- Canvas-rendered text surfaces (virtualized log views etc.) — deliberately
  deferred; §5 D-3 keeps the door open.
- Any palettes changes.
- Text _editing_ (cursors-as-selection, IME) — pretext's cursor types are
  consumed read-only here.
- i18n plugin involvement — locale flows from layout's own `language` slot, not
  from i18n.

---

## 2. Architecture overview

```
┌────────────────────────────────────────────────────────────────────┐
│ apps/lab                                                            │
│   acceptance: Text/RichText demo page · statusbar overflow demo    │
├────────────────────────────────────────────────────────────────────┤
│ plugins/layout                                                      │
│   slots: layout · theme · language · text ★new                     │
│                                                                     │
│   text slot store (lifecycle facade)                                │
│     ready    browser-guard flag                                     │
│     epoch    bumps after locale/font invalidation                   │
│     engine   full pretext surface, passthrough        ─────────┐   │
│                                                                 │   │
│   internal wiring (slot-level dependsOn, same plugin):          │   │
│     language slot ──changes──▶ engine.setLocale + clear ─▶ epoch++  │
│     theme slot ────changes──▶ font resolve + clear ─────▶ epoch++  │
│                                                                 │   │
│   text/adapter.ts — the ONLY file importing `pretext` ◀────────┘   │
│   components/text/ — Text, RichText (DOM lines)                    │
│   statusbar overflow — measures via getTextStore, commands only    │
│   the frozen zone-store contract                                   │
├────────────────────────────────────────────────────────────────────┤
│ ui — UNCHANGED (boundary grep untouched: gains no text vocabulary) │
├────────────────────────────────────────────────────────────────────┤
│ core                                                                │
│   ports/text.ts ★ port interface (already reserved) + fake adapter │
└────────────────────────────────────────────────────────────────────┘
```

**Core domain vs supporting.** The core domain of this work order is the **text
lifecycle contract** (init → locale sync → invalidate → epoch). Components,
statusbar overflow, and even pretext itself are supporting: at year 10 the
engine may be swapped or the components rewritten, but "text geometry is a
kernel-visible slot with a version number" is the part that must not churn.

---

## 3. Design patterns & code standards

### 3.1 Port & adapter — **Ports & Adapters (interface in core, adapter with its lifecycle owner)**

- **Pattern.** `core/ports/text.ts` declares the engine contract as types only:
  prepare (plain + with-segments), block layout, line-range
  walking/materialization, natural-width and line-stats measurement, rich-inline
  preparation/walking/stats, locale set, full-cache invalidation, plus the
  option vocabulary (`whiteSpace` normal/pre-wrap, `wordBreak` normal/keep-all,
  `letterSpacing`, rich-inline item fields including `break: never` and
  `extraWidth`). `plugins/layout/src/text/adapter.ts` is the sole implementation
  and the **only file in the repo importing `pretext`**.
- **Why.** Concern isolation on three axes. (a) Swappability: pretext is a
  single-maintainer dependency — same risk class as `hotkeys-js` (spec §9.3),
  same mitigation: one boundary file. (b) Testability: kernel and store tests
  run against a deterministic fake with fixed-advance metrics; no canvas in CI.
  (c) Ring hygiene: core must not ship browser code; the interface is framework-
  and browser-free, the canvas-touching adapter lives downstream. Year 3: a
  second engine (or a pretext fork) is one file. Year 5: the fake adapter powers
  SSR snapshot tests. Year 10: if browsers ship a native
  segmentation+measurement API worth using, the port absorbs it without a
  consumer noticing.
- **Standards.** The port's method names are layout-agnostic (no
  pretext-specific jargon leaks into core). The fake adapter must satisfy the
  identical type — divergence is a compile error, not a doc promise. Fitness
  gate: `pretext` appears in exactly one import site (§8).

### 3.2 Text slot store — **Facade over the lifecycle + transparent passthrough**

- **Pattern.** The `text` slot's `create` factory (receiving theme and language
  stores via same-plugin slot-level `dependsOn`) returns a store with exactly
  three public members: `ready` (reactive boolean — engine initialized, browser
  only), `epoch` (reactive monotonically increasing integer), `engine` (the full
  port surface). Everything else is internal: lazy browser-guarded init; an
  effect syncing the language slot's active locale into the engine; an effect
  resolving the active theme's computed font shorthand(s) and, on change,
  invalidating all engine caches; each invalidation ends by bumping `epoch`.
- **Why (best, not easiest).** The easy poles both fail: raw passthrough alone
  leaks SSR/locale/invalidation duties to every consumer (and two consumers
  fighting over pretext's _global_ locale and caches is a real bug class — the
  engine has module-level state layout must own exclusively); a fully curated
  API is speculative abstraction against an engine that is still evolving
  upstream. The facade curates only what the engine cannot do for itself and
  only what layout uniquely can — then gets out of the way. This is the same
  philosophy as the forge: derive the ritual once, in one place. Year 3:
  convenience helpers (a `measure` rune, a truncation utility) can grow _on
  top_, driven by real call sites, without touching the contract. Year 10:
  `ready`/`epoch`/`engine` is small enough to never need breaking.
- **Standards.** No component or app code may call the engine's locale or
  cache-clearing methods — grep-banned outside the store (§8). Server-side
  `engine` access throws fail-loud naming the plugin, the slot, and the fix
  ("guard with `ready`"). `epoch` starts at 0 and never resets.

### 3.3 Invalidation — **Version epoch (single reactive integer)**

- **Pattern.** Consumers include `epoch` in the dependency set of any derived
  measurement: `derived(text, width, epoch) → lines`. When locale or fonts
  change, the store clears engine caches and bumps `epoch`; every derivation
  that measured text re-runs automatically; prepared handles created before the
  bump are simply re-prepared by the re-running derivation.
- **Why.** It is the runes-native shape of cache invalidation: one number, no
  subscription bookkeeping, no callback lifetimes, impossible to leak. The
  alternative (`onInvalidate(cb)` registries) reintroduces manual disposal — the
  exact class of ritual the forge exists to kill. Year 5: devtools (observer
  plugin) can display `epoch` as a first-class health signal ("text caches
  invalidated 3× this session, last cause: theme").
- **Standards.** Store internals must bump epoch _after_ the cache clear
  completes (consumers must never re-measure against stale caches). Components
  never cache `PreparedText` across epochs.

### 3.4 `Text` / `RichText` components — **Composite over engine-computed lines (DOM rendering)**

- **Pattern.** `Text` takes content, a resolved font role, and prepare options;
  internally: prepare-with-segments → walk line ranges for the current measured
  width → render each line as a positioned DOM element, with container width
  observed via `ResizeObserver` and re-layout being the pure-arithmetic hot path
  pretext was built for. `RichText` does the same over rich-inline items (mixed
  fonts, `break: never` pills with `extraWidth` for chip chrome), rendering
  fragments per line. Both expose measured facts upward (line count, natural
  width, overflow flag) as reactive reads, and support line-clamping by
  materializing only the first N ranges.
- **Why DOM lines.** Selection, a11y, and DaisyUI theming come free; canvas
  rendering forfeits all three and rebuilds them by hand. What DOM alone
  _cannot_ do — knowing the break positions, truncating by measurement rather
  than CSS guesswork, keeping a pill atomic across wraps, virtualizing long text
  by materializing only visible ranges — is exactly what the engine supplies.
  This division (engine decides geometry, DOM renders it) is the durable one; a
  future canvas surface is an additive sibling component, not a rewrite (§5
  D-3).
- **Standards.** Component templates ≤ 60 lines each (per the layout doc's
  decomposition rule) — `Text`, `RichText`, and a shared per-line child.
  Components consume only `getTextStore`; they never import the adapter or
  `pretext`. Empty/`!ready` states render plain non-measured fallback text (SSR
  output is readable, hydration upgrades it).

### 3.5 Statusbar overflow — **Measured collapse against the frozen zone contract**

- **Pattern.** A `StatusbarOverflow` component measures each registered
  statusbar item's label via the text store (natural width per item,
  `epoch`-keyed), compares the running sum against the statusbar zone's
  available width, and collapses overflowing items into a trailing "more" group.
  All zone interaction goes through the frozen zone-store contract's public
  surface — reads of statusbar visibility/size, nothing deeper.
- **Why.** It is the smallest honest proof of spec §9.5's reservation: pretext
  arriving through the zone contract without bending it. It also exercises the
  measurement path with no rendering path (pure `measureNaturalWidth`-class
  usage), complementing the components which exercise the rendering path. Year
  3: the identical pattern gives nav-label ellipsis and strip-item sizing for
  free.
- **Standards.** Zero new zone-store methods. If this component needs something
  the zone contract lacks, that is a finding to escalate, not a contract edit to
  smuggle in.

---

## 4. Component map & directory structure

| Component         | Responsibility (one sentence)                      | Location                                                 | Exposes                    | Consumes                                     | Must NOT                            |
| ----------------- | -------------------------------------------------- | -------------------------------------------------------- | -------------------------- | -------------------------------------------- | ----------------------------------- |
| text port         | Framework-free engine contract + option vocabulary | `core/src/ports/text.ts`                                 | port types                 | —                                            | ship browser code; name pretext     |
| fake text adapter | Deterministic fixed-advance engine for tests       | `core/src/ports/text-fake.ts`                            | port impl                  | port types                                   | drift from the port type            |
| pretext adapter   | Real engine; the only `pretext` import             | `plugins/layout/src/text/adapter.ts`                     | port impl                  | `pretext`, port types                        | export anything but the impl        |
| text slot store   | Lifecycle facade: ready/epoch/engine               | `plugins/layout/src/stores/text.svelte.ts`               | `ready`, `epoch`, `engine` | adapter, theme + language stores (dependsOn) | let anyone else touch locale/caches |
| font resolver     | Derives canvas font shorthand(s) from active theme | `plugins/layout/src/text/fonts.ts`                       | resolve helper             | theme store, computed styles                 | be imported outside the text store  |
| Text              | Measured multi-line text, DOM lines, clamping      | `plugins/layout/src/components/text/Text.svelte`         | props + measured reads     | `getTextStore`                               | import adapter/pretext              |
| RichText          | Mixed-run inline layout incl. atomic pills         | `plugins/layout/src/components/text/RichText.svelte`     | props + measured reads     | `getTextStore`                               | import adapter/pretext              |
| TextLine          | Shared per-line/fragment renderer                  | `plugins/layout/src/components/text/TextLine.svelte`     | internal                   | —                                            | exceed 60 template lines            |
| StatusbarOverflow | Measured item collapse in the statusbar zone       | `plugins/layout/src/components/StatusbarOverflow.svelte` | drop-in statusbar child    | `getTextStore`, `getLayoutStore`             | extend the zone contract            |

```
core/src/ports/
├─ text.ts               ★ port interface + option types
└─ text-fake.ts          ★ deterministic test adapter

plugins/layout/src/
├─ plugin.ts             + slot: text { create, dependsOn: [theme, language], expose } → getTextStore
├─ stores/
│  └─ text.svelte.ts     ★ lifecycle facade (ready/epoch/engine)
├─ text/
│  ├─ adapter.ts         ★ the ONE pretext import
│  └─ fonts.ts           ★ theme → font shorthand resolution
├─ components/
│  ├─ text/
│  │  ├─ Text.svelte · RichText.svelte · TextLine.svelte
│  └─ StatusbarOverflow.svelte
├─ types.ts              + re-exported measurement vocabulary (from the port)
└─ mod.ts                + re-export Text, RichText, StatusbarOverflow (export-only rule holds)
```

Everything else in `plugins/layout` is untouched. No ui changes. No export-map
changes.

---

## 5. Trade-off analysis

```
DECISION D-1: Take pretext as a runtime dependency (mandated trade-off block, spec §1)
OPTIONS:
  A. pretext (canvas measurement engine)
       + correct Unicode segmentation, bidi, CJK/kinsoku, keep-all, pre-wrap;
         resize-time layout is pure arithmetic; virtualization-ready line ranges;
         rich inline with atomic pills — none of this is buildable in-house at
         sane cost
       − single-maintainer, pre-1.0-style churn risk; browser-only; global caches
  B. DOM measurement (hidden nodes / Range rects)
       + zero deps  − orders of magnitude slower, layout-thrash on resize, no
         break-position knowledge, no rich-inline atomicity
  C. CSS-only (line-clamp, text-overflow)
       + free  − cannot answer "where does line 2 break" or "does this fit",
         which is the entire feature
CHOSEN: A
REASON: The capabilities are the product; the risks are all containable by the
        port boundary (one import site) and a pinned version.
REVISIT IF: upstream goes unmaintained for 12+ months, or a native browser API
        covers segmentation + measurement at comparable cost.
```

```
DECISION D-2: Adapter location
OPTIONS:
  A. ui (mirroring persistence drivers)  + symmetric precedent
       − ui gains a dependency and vocabulary it never uses itself; boundary
         grep grows for no ui benefit
  B. inside plugins/layout  + adapter sits with the only code that owns its
       lifecycle inputs (theme, language); isolation boundary = ownership
       boundary  − a future non-layout consumer must go through the slot
  C. standalone rune-lab.text plugin  + cleanest year-10 story
       − heaviest now; a shell-less text plugin has no second consumer yet
CHOSEN: B
REASON: The port type in core already buys the swappability A and C promise;
        B adds zero ceremony. C remains a mechanical later extraction — the
        exposed surface (ready/epoch/engine) would move, not change.
REVISIT IF: a plugin that does not depend on layout needs text geometry.
```

```
DECISION D-3: Rendering strategy for shipped components
OPTIONS:
  A. DOM lines (engine computes breaks, DOM renders)
       + selection, a11y, DaisyUI theming free; virtualization via ranges
       − per-line DOM cost on huge texts
  B. Canvas  + max perf  − rebuild selection/a11y/theming by hand
  C. Both behind a prop  − doubles day-one surface, speculative
CHOSEN: A   [REVISIT] B becomes attractive for a future observer log surface —
        additive sibling component, nothing here precludes it.
```

```
DECISION D-4: State management for invalidation
OPTIONS:
  A. epoch version integer  + runes-native, unleakable, one primitive
  B. onInvalidate callbacks  − manual disposal ritual, the forge's enemy
CHOSEN: A
REVISIT IF: consumers need per-font granular invalidation (unlikely; measure first).
```

```
DECISION D-5: Surface shape
OPTIONS:
  A. raw passthrough only    − leaks SSR/locale/cache duties to every consumer
  B. lifecycle facade + raw engine underneath   + curates only what layout
       uniquely can; full power preserved; nothing speculative
  C. fully curated reactive API   − hand-maintained against upstream churn
CHOSEN: B
REVISIT IF: three or more consumers hand-roll the same helper on top of
        `engine` — that helper then graduates into the facade.
```

---

## 6. Phased implementation plan

**Phase 1 — Port, adapter, slot (the contract)**

- Goal: `getTextStore()` returns a working facade in the browser; kernel tests
  pass against the fake.
- Build: `core/ports/text.ts` + `text-fake.ts`; `text/adapter.ts`;
  `text/fonts.ts`; `stores/text.svelte.ts`; the `text` slot in `plugin.ts` with
  `dependsOn` on theme + language.
- Dependencies: landed Part A (frozen zone contract, theme/language slots).
- Exit criteria: unit — locale change on the language store reaches the engine
  and bumps `epoch`; theme font change clears caches then bumps `epoch`;
  server-side `engine` access throws the fail-loud message; fake adapter passes
  the identical store test suite. Fitness gates from §8 green.
- Risk flags: [HIGH RISK] font-resolution timing — computed styles are only
  trustworthy after the theme's stylesheet applies; spike this first (§9.1).

**Phase 2 — Text & RichText components (the flagship)**

- Goal: measured, wrapping, clampable text as first-class layout exports.
- Build: `Text.svelte`, `RichText.svelte`, `TextLine.svelte`; `mod.ts`
  re-exports; lab demo page in the `content` zone (plain paragraph, keep-all CJK
  sample, pre-wrap block, rich line with a `break: never` pill, a line-clamped
  card).
- Dependencies: Phase 1.
- Exit criteria: component tests — line count matches engine stats at fixed
  widths; resize re-layouts without re-prepare; epoch bump forces re-measure;
  clamping materializes only N ranges; SSR renders fallback text, hydration
  upgrades. Templates ≤ 60 lines each.
- Risk flags: `ResizeObserver` feedback loops (measure → render → resize) —
  observe the container, never the rendered lines.

**Phase 3 — Statusbar overflow (the §9.5 proof) + acceptance**

- Goal: the reserved zone-contract integration, demonstrated live.
- Build: `StatusbarOverflow.svelte`; lab statusbar with enough items to
  overflow; acceptance checklist run.
- Dependencies: Phase 2 (reuses measurement patterns), frozen zone contract.
- Exit criteria: shrinking the window collapses items into "more" and restores
  them on grow; switching theme (font change) and language (locale change)
  live-updates both the components and the overflow behavior with no reload;
  zero new zone-store methods introduced.
- Risk flags: none structural; if the zone contract proves insufficient, stop
  and escalate (finding, not edit).

---

## 7. Implementation management

**Sequencing (plain text).** port types → fake adapter → real adapter → font
resolver → slot store → plugin.ts slot entry → components → statusbar overflow →
lab. The fake lands before the real adapter so the store's test suite exists
before canvas is ever involved.

**Critical path.** Phase 1's font-resolution spike; everything downstream keys
on it. Components and overflow are parallelizable after Phase 1.

**Integration points (coordinate closely).** (1) `plugin.ts` slot registration —
the only file shared with the rest of layout's declaration. (2) `types.ts` —
measurement vocabulary re-export must not collide with the existing layout
vocabulary. Flag both in review.

**Breaking changes / hard to undo.** [HIGH RISK] The `ready`/`epoch`/`engine`
triple and the port method names become public contract the moment palettes
consumes them — bikeshed them now, freeze at Phase 1 exit, treat as the
zone-contract equivalent for text.

**Ownership.** Solo + agents: this document is the agent-executable work order;
the spec holds the contracts it references.

---

## 8. Validation & testing strategy

| Layer                   | Test type                           | What it verifies                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text port               | Type-level (Deno)                   | Fake and real adapters both satisfy the identical port type                                                                                                                                                                                                                                                                                                                                                      |
| slot store              | Unit vs fake adapter                | Lazy init; locale sync; theme invalidation ordering (clear **then** bump); epoch monotonicity; fail-loud server access message names plugin/slot/fix                                                                                                                                                                                                                                                             |
| adapter                 | Browser unit (Vitest + real canvas) | Prepared/layout results sane for latin, CJK keep-all, pre-wrap, rich pills; cache clear actually clears                                                                                                                                                                                                                                                                                                          |
| components              | Component tests                     | Line counts vs engine stats; resize path does not re-prepare; clamp materializes N ranges; SSR fallback + hydration upgrade                                                                                                                                                                                                                                                                                      |
| statusbar overflow      | Component test                      | Collapse/restore thresholds from measured widths; zero zone-contract additions                                                                                                                                                                                                                                                                                                                                   |
| full flows              | Lab acceptance                      | Theme + language switches live-update every text surface without reload                                                                                                                                                                                                                                                                                                                                          |
| **architecture itself** | **Fitness functions**               | (1) `pretext` imported by exactly one file (`text/adapter.ts`); (2) engine locale/cache-clear method names appear nowhere outside `stores/text.svelte.ts` + adapter + port; (3) ui boundary grep still zero-hit (gains no text words); (4) standard-shape gate holds (nothing imports own `mod.ts`); (5) fallow: zero new cycles under `plugins/layout`; (6) template ≤ 60-line thresholds on the new components |

**Local dev validation:** `just check` (format + type + unit + fitness) and
`just audit` (fallow) green before any phase-exit claim — unchanged discipline.

**Observability:** expose `epoch` and last-invalidation cause (locale | fonts)
as store reads so the observer plugin can display text-cache health from the
plugin graph, consistent with its forge-aware inspection port.

---

## 9. Open questions & risks

1. **Font-shorthand resolution timing** [HIGH RISK, spike before Phase 1 exit] —
   deriving the canvas font string from the active DaisyUI theme requires
   computed styles after stylesheet application; theme switching may race.
   Spike: probe → compare → re-resolve on the theme store's settled signal.
   Fallback: an explicit font map in the layout config schema (one spec field,
   no architecture change).
2. **Engine global state vs multiple kernel instances** — pretext caches are
   module-global; two kernels on one page (unlikely, but the forge permits it)
   would share them. Acceptable for v-next; documented limitation on the port.
   [REVISIT] if multi-kernel becomes real.
3. **Upstream churn** — pinned commit; the port absorbs renames. Re-pin
   deliberately, per release, with the adapter's browser unit suite as the
   compatibility gate.
4. **Rich-pill a11y semantics** — DOM lines preserve text a11y, but atomic pills
   rendered as fragments need role/label conventions; decide during Phase 2
   component review, not now.
5. **Palettes consumption shape** — deliberately unresolved; the only promise
   this plan makes is that `ready`/`epoch`/`engine` through `getTextStore` is
   sufficient and frozen.
