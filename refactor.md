# Architect Spec Planner: `@rune-lab/core` Refactor

> **Series:** 01 architecture · 02 engine wiring · **03 technical spec**\
> **Status:** ready for execution · **Format:** architect-spec-planner (zero
> code — contracts in prose)\
> **Ledger:** goals 01–38 · revisions R1 (showcase → lab) · R2 (pretext → svelte
> runtime)\
> **Universal exit gate:** every phase and every component is DONE only when
> `just check <member>` **and** `just check` (workspace root) exit 0.

---

## 0. Executive Summary

This specification establishes a robust, highly extensible microkernel
architecture for the `rune-lab` ecosystem. By refactoring Floor 0
(`@rune-lab/core`) into a completely featureless, abstract state and
contribution engine powered internally by Effect, we decouple the framework's
core logic from presentation details, specific feature domains (such as themes,
locales, and currencies), and platform runtime environments. Svelte 5 (Floor 1)
wraps this pure-logic engine using a dynamic reactive proxy layer, ensuring that
UI components maintain clean, standard reactivity semantics with zero bundle or
type-leakage overhead from Effect (Law 03). This architecture is built to last
over a ten-year horizon; because every axis of change is isolated behind a
formal contract—platform APIs behind ports, Effect behind the boundary, and
plugins behind registries—growth is achieved by adding packages, never by
modifying the core.

---

## 1. Context & Constraints

- **Project Context:** Refactoring an in-flight monorepo containing a Svelte
  package (`rune-lab`) and a SvelteKit workspace app (`lab`). The goal is to
  carve out a new canonical package, `@rune-lab/core`, and establish clean
  boundaries between Floors 0, 1, 2, and 3.
- **Main Goals ("Done" Definition):**
  - `just check` exits with 0 at the workspace root on an honest, verified
    baseline (zero circular dependencies, zero unresolved imports, verified
    dead-code bounds).
  - `@rune-lab/core` is a standalone JSR package with zero browser or Svelte
    dependencies, relying on a plain-TypeScript public API.
  - The `rune-lab` umbrella package (npm) provides a single-import DX
    (`RuneProvider` + `useX` reactive accessors).
  - Plugins register via dynamic, schema-validated manifests, with the core
    automatically building settings panels, search indices, and dynamic command
    pallets.
- **Architectural Rules:**
  - Deno runtime for all workspace tasks (deno task, deno check, deno test).
  - Biome as the exclusive linter and formatter.
  - Nushell-based `just` recipes for all local developer automation.
  - Effect usage is strictly restricted to Floor 0 internals; it must never leak
    into public signatures.
  - Tailwind and daisyUI as peer styling contracts only; no custom CSS
    frameworks in library directories.
  - Pretext is used for token-accurate text measurement.
  - Svelte 5 runes exclusively; no legacy Svelte 4 store implementations.
- **Out of Scope:** Component prop playground sandboxes, global application-wide
  deep search, live iframe postMessage bridges, Nix-style option-merging
  configurations, lazy activation events, typed event streams, and non-Svelte
  framework adapters.
- **Assumptions:**
  - `[ASSUMPTION]` The codebase is managed by a single maintainer; sequential,
    non-parallel delivery phases are optimized to prevent build friction.
  - `[ASSUMPTION]` Effect v3 is chosen as the internal engine dependency; the
    core locks the minor version via lockfile.
  - `[ASSUMPTION]` Svelte 5's `createSubscriber` interface is available and
    stable under `svelte/reactivity` or standard exports.
  - `[ASSUMPTION]` The target execution environment for the consumer is standard
    Node/ESM or Deno, and the core npm mirror can be built via Deno Node
    Transmitter (`dnt`).
  - `[ASSUMPTION]` Pretext is browser-only and requires Canvas 2D; the core text
    port must handle fallback logic gracefully during Server-Side Rendering
    (SSR).

---

## 2. Architecture Overview

The system is organized into four logical floors. Imports are strictly
directional: high-level layers may depend on layers beneath them, but the core
layer must never depend on a higher floor (Law 01). Sibling plugins on Floor 2
must never import each other directly; all cross-plugin integration occurs
through core registries (Law 02).

```
┌──────────────────────────────────────────────────────────┐
│ FLOOR 3 · apps/lab (private) — routes · provider ·       │
│           showcase pages                                 │
├──────────────────────────────────────────────────────────┤
│ FLOOR 2 · optional plugins (npm)                         │
│   @rune-lab/money · @rune-lab/i18n · @rune-lab/observer  │
├──────────────────────────────────────────────────────────┤
│ FLOOR 1 · rune-lab (npm umbrella · Svelte 5)             │
│   layout · palettes (overlays + settings modal)          │
│   svelte runtime: RuneProvider · rune bridge ·           │
│   text service (pretext) · browser drivers               │
╞════════ LAW 03: Effect never crosses this line ══════════╡
│ FLOOR 0 · @rune-lab/core (JSR · strict deno)             │
│   plugin manifests (schema) · contribution registries ·  │
│   services (Effect Layers) · ports · persistence ·       │
│   tokens · locale fallback · runtime (ManagedRuntime)    │
└──────────────────────────────────────────────────────────┘
        side rail: daisyUI peer styling (floors 1–3)
```

### Core Domain vs. Supporting Domains

The **Core Domain** lives entirely on Floor 0. It is a pure, feature-agnostic
virtual machine that processes plugin registrations, resolves dependency graphs,
manages atomic state cells, and acts as a central hub.

The **Supporting Domains**—including layout layouts, keyboard shortcuts,
currencies, and translation integrations—live on Floors 1 and 2. They do not
exist as built-in features of the core engine; instead, they are expressed
through the core's abstract schema and contribution registry contracts.

---

## 3. Design Patterns & Code Standards

### 3.1 Floor 0 (Microkernel & Hexagonal Core)

- **Patterns Applied:** Microkernel (System Core), Ports and Adapters /
  Hexagonal (Platform Boundaries), Registry (Contributions), Dependency
  Injection via Effect Layers (Internal Assembly), Facade (API Boundary).
- **Why These Patterns:**
  - _Microkernel:_ Keeps the engine completely featureless. This protects the
    team at Year 3 from core bloat (such as writing bespoke analytics or payment
    code directly in the core engine). Growth is additive, not modifications to
    existing files.
  - _Ports and Adapters:_ Isolates the core from platform-specific APIs. If the
    browser storage API changes, or if the system needs to run in a non-browser
    environment (like an edge worker or command-line testing suite), only the
    adapters above the boundary line change. This protects the engine from
    environment churn at Year 5 and Year 10.
  - _Effect Layers:_ Resolves internal service composition dynamically. It
    replaces manual, error-prone dependency sorting with a compiler-level graph
    solver, protecting against initialization order bugs.
  - _Facade:_ Enforces Law 03. It seals the raw monadic context of Effect inside
    the core boundary, exposing only clean, standard TypeScript types to the
    outside.
- **How Applied:**
  - The entry point `mod.ts` acts as the exclusive facade. It exports only plain
    TypeScript types, port interfaces, schema definitions, and a bootstrap
    factory.
  - The bootstrapper accepts an array of dynamic plugin manifests. It validates
    them using Effect Schema, compiles their dependencies into a closed service
    graph, instantiates the environment using Effect Layers, and returns a plain
    `Kernel` instance.
  - All dynamic state is managed internally by `Effect.SubscriptionRef` cells.
    The `Kernel` facade translates change events from these cells into a
    standard callback subscription pattern
    (`subscribe(cell, listener) -> unsubscribe`).
- **Standards to Enforce:**
  - No browser globals (like `window`, `document`, `localStorage`, or
    `document.cookie`) are permitted below the boundary line.
  - Every exported symbol in `mod.ts` must carry explicit, compile-time types
    (no implicit `any` is allowed, meeting JSR slow-types validation).
  - All files below the line must use snake_case naming conventions, except for
    the public-facing entry points.
  - Errors occurring inside core operations must be converted from internal
    tagged Effect errors into named, standard JavaScript `Error` subclasses
    before passing through the facade.

### 3.2 Floor 1 (Adapter Layer & Facade Umbrella)

- **Patterns Applied:** Adapter (Browser Drivers, Pretext Text Measurer, Svelte
  Rune Bridge), Facade (`rune-lab` Umbrella imports), Provider/Context
  (RuneProvider), Mediator (Palette Action Dispatcher).
- **Why These Patterns:**
  - _Adapter:_ Wraps Svelte-specific reactivity and browser storage mechanisms
    in clean contracts. This protects the team from Svelte lifecycle changes
    (e.g., migration between Svelte versions at Year 3 or Year 5).
  - _Svelte Rune Bridge:_ Centralizes the reactivity bridge. If the Svelte team
    replaces Svelte 5 runes with an updated reactive standard in Year 5, only
    the bridge file needs modifications—not the entire suite of plugins.
- **How Applied:**
  - `<RuneProvider>` acts as the root Svelte lifecycle mounting component. It
    instantiates the kernel synchronously during the mounting phase, registers
    the instance in Svelte's context tree using a Unique Symbol key, and
    disposes of the kernel upon unmounting to clean up resources.
  - A single JavaScript `Proxy` intercepts all property lookups on the UI-facing
    kernel instance. It maps property reads to the core’s generic state-cell
    readers and wraps them in Svelte's `createSubscriber` primitive. Svelte
    templates can read properties normally, and reactivity is automatically
    wired.
  - The text measurement adapter wraps Pretext. It registers for change
    notifications on the core's locale cell and automatically flushes Pretext's
    cache whenever the language changes, keeping Svelte rendering aligned with
    measurement metrics.
- **Standards to Enforce:**
  - UI components must never call the core kernel's raw subscription interfaces
    directly; they must interact through the Svelte context and use standard
    reactive runes.
  - CSS styles must use daisyUI utility names; custom, bespoke CSS structures
    are forbidden in library folders to maintain easy Tailwind v4 compatibility.

### 3.3 Floor 2 (Optional Plugins)

- **Patterns Applied:** Declarative Manifest, Adapter (i18n), Composed UI
  Component.
- **Why These Patterns:**
  - _Declarative Manifest:_ Models plugin capability as pure data. This allows
    the Settings Modal, the Search Index, and the validation tests to inspect
    plugin traits without ever running untrusted third-party code, securing the
    ecosystem at Year 10.
- **How Applied:**
  - Plugins register their capabilities (like settings sections, keyboard
    shortcuts, or menu routes) as plain JSON-like properties on their manifest
    definition.
  - The only execution surface is the `activate` hook, which receives a
    sandboxed subset of core services.
  - The i18n adapter implements the core's `LocaleAdapter` port over
    `paraglide-js` bindings.
- **Standards to Enforce:**
  - Plugin IDs must be namespaced using dot notation matching the package scope
    (e.g., `rune-lab.money`).
  - Plugins are strictly forbidden from importing sibling packages; any
    coordination must flow through the central registries.

---

## 4. Component Map & Directory Structure

```
rune-lab/
├── deno.json            # Workspace root configuration; configures shared Biome settings and tasks
├── justfile             # Task runner configurations using Nushell syntax
├── packages/
│   ├── core/            # [@rune-lab/core] Canonical logical core (Floor 0)
│   │   ├── deno.json    # Strict compilation rules; JSR export definitions
│   │   └── src/
│   │       ├── mod.ts   # Public API Facade; only standard TS types are exposed
│   │       ├── runtime.ts # ManagedRuntime initializer; executes Effect workflows
│   │       ├── plugin/  # Schema validations and topological manifest parsing
│   │       ├── registry/# Contribution registries (commands, shortcuts, settings)
│   │       ├── services/# Environmental layers and dependency injection setup
│   │       ├── ports/   # Abstract ports (PersistenceDriver, LocaleAdapter)
│   │       └── tokens/  # Primitive design tokens and sizing constants
└── apps/
    └── lab/             # Private Showcase Application (Floor 3)
```

YOU MUST ONLY FOCUS ON MODIFY THE CORE! AND AUDIT & CHECK IT! ONLY THE CORE! NOT
THE REST! That other things are out of scope.

### Component Responsibility Specifications

- **Name:** `core/plugin`
  - **Responsibility:** Defines manifest structures, validates them against
    strict schemas, and performs topological sorting on registration order.
  - **Location:** `packages/core/src/plugin/`
  - **Interfaces Exposed:** A function that validates raw objects against the
    plugin manifest schema and returns a frozen, type-branded manifest; a
    function that topologically sorts a list of manifests.
  - **Dependencies Consumed:** Core schema and error modules.
  - **Must NOT Do:** Execute the `activate` function of any plugin or
    instantiate the runtime environment.
- **Name:** `core/registry`
  - **Responsibility:** Provides the dynamic registries for contribution types,
    allowing registration, removal, and snapshot reading of contributions.
  - **Location:** `packages/core/src/registry/`
  - **Interfaces Exposed:** A generic snapshot reader that returns an array of
    contribution items; registry writer functions for commands, shortcuts, and
    settings.
  - **Dependencies Consumed:** Internal state ref interfaces.
  - **Must NOT Do:** Import any Svelte components or reference the browser DOM.
- **Name:** `svelte/runtime`
  - **Responsibility:** Hooks the abstract core engine into Svelte's reactive
    lifecycle, wrapping state updates in responsive proxies.
  - **Location:** `packages/svelte/src/lib/runtime/`
  - **Interfaces Exposed:** The `<RuneProvider>` Svelte component; a function
    that hooks Svelte's context into a type-safe reactive proxy representation
    of the core state cells.
  - **Dependencies Consumed:** Svelte reactivity primitives, browser driver
    adapters, and the public core facade.
  - **Must NOT Do:** Perform raw database read/write checks; it must delegate
    all storage mutations to core ports.

---

## 5. Trade-off Analysis

```
DECISION: Adoption of Effect inside Floor 0
OPTIONS CONSIDERED:
  A. No Effect — write vanilla TypeScript services, manual error handling, and manual topological sorting.
     - Pros: Zero dependency overhead; fast initial learning curve for standard web developers.
     - Cons: Reinventing Dependency Injection, resource management, and asynchronous streams.
  B. Full Effect integration throughout the codebase — expose monadic types to Floor 1 and Floor 2.
     - Pros: Extremely powerful; direct access to Effect's ecosystem across all views and plugins.
     - Cons: Leaks complex type signatures to Svelte components; high cognitive load for UI developers.
  C. Effect contained strictly behind the core boundary (Floor 0) — expose only standard TypeScript types.
     - Pros: Retains Effect's robust DI, schema parsing, and resource management; keeps Floor 1 and Floor 2 code standard, lightweight, and easy to learn.
     - Cons: Requires maintaining a strict boundary conversion layer.
CHOSEN: Option C
REASON: This is a robust, long-term approach. It keeps the public API stable and accessible, while giving the core developer maximum safety, atomic state guarantees, and predictable testing patterns.
REVISIT IF: The conversion layer overhead becomes larger than the core engine subsystems it is wrapping, or if a major standard emerges that makes Effect unnecessary.
```

```
DECISION: Package Distribution Architecture
OPTIONS CONSIDERED:
  A. JSR-only distribution — npm consumers must use the JSR compatibility layer.
     - Pros: Single build artifact; native Deno integration; provenance verification.
     - Cons: Requires npm users to configure custom registries — a massive friction point for UI libraries.
  B. npm-only distribution — publish only to npm via standard Node tooling.
     - Pros: Simple workflow for standard frontend ecosystems.
     - Cons: Loses Deno workspace integration and the native strict type verification of JSR.
  C. Dual distribution — publish canonical to JSR and generate an npm mirror using `dnt`.
     - Pros: Zero friction for Svelte users on npm; Deno users get the native JSR package; strict compilation quality checks.
     - Cons: Requires maintaining an automated build pipeline for mirror packaging.
CHOSEN: Option C
REASON: It guarantees a premium developer experience in both ecosystems. The build overhead is easily managed by automation in Deno, and the strict JSR compilation acts as an ongoing QA guard.
REVISIT IF: JSR's automatic npm compatibility removes the need for manual npm mirror creation.
```

```
DECISION: Dynamic Reactivity Mapping Strategy
OPTIONS CONSIDERED:
  A. Compile-time generation — pre-build explicit getters/setters for every state cell on Floor 1.
     - Pros: Direct, readable code paths; autocomplete works natively on generated methods.
     - Cons: High build overhead; fails the microkernel requirement of adding plugins without core modifications.
  B. Runtime JS Proxy mapping property reads to Svelte 5 reactivity subscriptions.
     - Pros: Zero boilerplate; dynamic cell registration works out of the box; runtime footprint is extremely small.
     - Cons: Slight performance overhead on property read interception; slightly complex debugging in DevTools.
  C. Legacy Svelte store wrappers.
     - Pros: Backwards-compatible.
     - Cons: Unnatural fit for Svelte 5's modern, reactive runtime model.
CHOSEN: Option B
REASON: Matches the design principles of an abstract microkernel. It enables registering new state cells dynamically at runtime, making features truly extensible without build modifications.
REVISIT IF: Performance profiling reveals the JS Proxy read overhead is a bottleneck in rendering loops (in which case, the proxy will be replaced with a memoized lookup map).
```

```
DECISION: State Persistence Architecture
OPTIONS CONSIDERED:
  A. Abstract Persistence Port — core defines the interface; browser adapters are injected on Floor 1.
     - Pros: Clean separation; the core runs browser-free during server testing; easy to swap.
     - Cons: Introduces an interface layer for basic key-value storage.
  B. Direct localStorage integration in the core.
     - Pros: Direct implementation path.
     - Cons: Crashes on Server-Side Rendering (SSR) environments; untestable in pure command-line suites.
CHOSEN: Option A
REASON: The port guarantees that our core engine can be fully tested in a pure, command-line Deno environment with zero browser dependencies.
REVISIT IF: The persistence requirements demand high-capacity complex queries, prompting an upgrade from simple key-value lookups to a transactional port (like IndexedDB).
```

```
DECISION: Settings Modal Navigation & Hash Routing
OPTIONS CONSIDERED:
  A. Host Router Integration — bind navigation directly to SvelteKit's router.
     - Pros: Unified routing structure.
     - Cons: Ties our library tightly to SvelteKit, preventing its use in standard Svelte apps or other routers.
  B. Hash-based Routing (`#settings/<section>`) handled internally by the Palettes package.
     - Pros: Framework-neutral; deep-linkable from any URL depth; SSR-friendly (ignored by server routing).
     - Cons: Takes over the hash namespace on the host page.
CHOSEN: Option B
REASON: Our overlay family must be able to run inside any host app without making router assumptions. The hash is the only router-neutral way to deep-link nested menus.
REVISIT IF: A host app requires the hash namespace for its own anchor links, in which case we will make the hash prefix configurable.
```

---

## 6. Phased Implementation Plan

### Phase 0 — Honest Baseline & Harness Setup

- **Goal:** Establish a verified baseline for imports, formatting, and tests.
- **Components to Build:** Configs (`deno.json`, `biome.json`, root `justfile`),
  setup lint pipelines and entry configurations for SvelteKit routes and package
  entry points.
- **Dependencies:** Pre-existing codebase import check.
- **Exit Criteria:** Run `just check` at the root and verify it exits 0.
  `fallow` must report exactly zero unresolved imports and circular
  dependencies.
- **Risk Flags:**
  - `[HIGH RISK]` SvelteKit routes can hide dead imports if path aliases are
    misconfigured. Mitigated by setting up explicit path alias checks in the
    compiler.

### Phase 1 — Dynamic Manifests & Schema Core

- **Goal:** Establish the declarative plugin manifest system and registry
  pipeline on Floor 0.
- **Components to Build:** Schema core (`core/plugin/manifest.ts`), dynamic
  registry managers (`core/registry/`), and `definePlugin` factories.
- **Dependencies:** Phase 0.
- **Exit Criteria:** Run `just check core` and verify it exits 0. Schema
  validation tests must verify that malformed manifests are caught and throw
  descriptive errors.
- **Risk Flags:**
  - `[REVISIT]` Validating nested functions inside schema bounds can be tricky.
    Mitigated by validating metadata structure in the schema while checking
    callback shapes via TypeScript types.

### Phase 2 — Effect Service Layers & Core Extraction

- **Goal:** Extract the logical core to `@rune-lab/core` and integrate
  Effect-based DI and lifecycle layers.
- **Components to Build:** Service layer definitions (`core/services/`), state
  cells (`core/persistence/`), core ports (`core/ports/`), and the public facade
  boundary (`core/mod.ts` and `core/runtime.ts`).
- **Dependencies:** Phase 1.
- **Exit Criteria:** Run `just check core` and verify it exits 0 with zero
  browser dependencies. Deno test suite must pass with zero browser APIs
  available.
- **Risk Flags:**
  - `[HIGH RISK]` Monadic leaks across the core facade violate Law 03. Mitigated
    by running an automated static scan to ensure the string `effect` never
    appears in the public-facing `mod.ts` exports.

### Phase 3 — Workspace Carving & Release Pipelines

- **Goal:** Split the codebase into isolated workspace directories and set up
  automated publishing pipelines.
- **Components to Build:** Monorepo package directories (`packages/*`),
  Deno-to-npm compilation (`dnt`), and version tagging scripts.
- **Dependencies:** Phase 2.
- **Exit Criteria:** Run `just check` at the root and verify it exits 0. Running
  the dry-run publish task must successfully compile and generate all npm
  mirrors without warnings.
- **Risk Flags:**
  - `[HIGH RISK]` Divergence between local workspace paths and published
    packages. Mitigated by compiling and running the full integration test suite
    against the built npm mirror before publishing.

### Phase 4 — Svelte Proxy Bridge & Layout Restructure

- **Goal:** Wire Svelte 5's reactivity model to the abstract core and clean up
  SvelteKit layout views.
- **Components to Build:** The Svelte reactive proxy bridge (`svelte/runtime/`),
  browser storage adapters, and Svelte context initialization.
- **Dependencies:** Phase 3.
- **Exit Criteria:** Run `just check svelte` and verify it exits 0. Svelte
  integration tests must verify that state changes in the core are reactive in
  components.
- **Risk Flags:**
  - `[HIGH RISK]` Server-Side Rendering (SSR) environment checks must prevent
    browser storage calls on the server. Mitigated by wrapping storage lookups
    in browser presence guards.

### Phase 5 — Dynamic Overlays & Settings Routing

- **Goal:** Implement the settings routing modal and fuzzy searching over
  contribution data.
- **Components to Build:** Modal UI components, shortcut recorders, dynamic
  sidebar builders, and the fuzzy search index.
- **Dependencies:** Phase 4.
- **Exit Criteria:** Run `just check svelte` and verify it exits 0. Manual and
  integration tests must confirm that settings deep-links open the modal and
  that keyboard shortcut registrations update cleanly.
- **Risk Flags:**
  - `[REVISIT]` Host router intercepts hash changes, disrupting nested settings
    routes. Mitigated by stopping event propagation on settings hash matches.

### Phase 6 — Dynamic Optional Tier Integration

- **Goal:** Migrate optional features into Floor 2 plugins and verify core
  decoupling.
- **Components to Build:** Money plugin (`@rune-lab/money`), observer plugin
  (`@rune-lab/observer`), and translation adapters (`@rune-lab/i18n`).
- **Dependencies:** Phase 5.
- **Exit Criteria:** Run `just check` at the root and verify it exits 0. Verify
  that adding a new plugin is completely additive, requiring zero edits to core
  files.
- **Risk Flags:**
  - `[HIGH RISK]` Sibling imports between plugins introduce circular
    dependencies. Mitigated by static import analysis in the workspace test
    harness.

---

## 7. Implementation Management

```
┌────────────────────────────────────────────────────────┐
│            Phase 0: Baseline & Harness Setup           │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Phase 1: Dynamic Manifest & Registries        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Phase 2: Effect Layer Core Extraction         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Phase 3: Workspace Carve & npm Mirror         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Phase 4: Svelte Proxy & Reactivity Bridge     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Phase 5: Settings Modals & Hash Routing       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Phase 6: Optional Tier (Money/Observer/i18n)   │
└────────────────────────────────────────────────────────┘
```

- **Critical Path:** The sequence of core extractions (Phase 1 -> Phase 2 ->
  Phase 3 -> Phase 4) is the critical path. Any compilation or typing issues in
  the core facade or reactivity bridge will block subsequent UI work.
- **Ownership Suggestions:**
  - _Core Engine:_ Backend / Library architect (focused on type algebra, Effect
    schema, and dnt build targets).
  - _Umbrella & UI:_ Frontend engineers (focused on Svelte reactivity, Tailwind
    utility layouts, and keyboard shortcut interfaces).
- **Integration Points [HIGH RISK]:**
  - _The Facade Boundary:_ The boundary between Floor 0 and Floor 1 is critical.
    Facade mapping tests must run before any UI components consume the core.
  - _Reactivity Timing:_ Ensuring Svelte 5's update cycles align with the
    dynamic JS Proxy. Covered by mounting and verifying reactive components in
    testing environments.
- **Breaking Changes [HIGH RISK]:**
  - Moving from the old static store initialization to the new dynamic registry
    model. Any existing plugin imports in consumer views will break and must be
    updated to the unified facade import.

---

## 8. Validation & Testing Strategy

| Layer                  | Test Type          | What It Verifies                                                                      | Runner                          |
| :--------------------- | :----------------- | :------------------------------------------------------------------------------------ | :------------------------------ |
| **Core Subsystems**    | Unit (in-memory)   | Schema validation, manifest parsing, topological resolution, state transitions.       | `deno test`                     |
| **Facade Boundary**    | Contract Tests     | Facade type boundaries, subscription callbacks, error conversion, teardown processes. | `deno test`                     |
| **npm Mirror**         | Integration (Node) | Ensure compilation fidelity of the `dnt` mirror under standard Node environments.     | `dnt` test runner               |
| **Reactivity Bridge**  | Integration (DOM)  | Svelte Proxy reactivity, storage persistence adapters, SSR safety.                    | `vitest` (jsdom)                |
| **Palettes & Modals**  | E2E / Integration  | Hash-based deep-linking, keyboard shortcut registration, fuzzy search accuracy.       | `vitest` + Playwright           |
| **Architecture Rules** | Fitness Functions  | Circular imports, cross-plugin dependencies, boundary leakage checks.                 | `just check` (fallow + ripgrep) |

### Architecture Fitness Functions

1. **Monadic Leak Scan:** An automated script scans the JSR entry point
   (`packages/core/src/mod.ts`) for references to Effect types. If the search
   finds any mention of Effect classes, compilation stops immediately.
2. **No Sibling Import Check:** A static import scanner scans Floor 2 package
   directories. If any plugin references a sibling plugin directory, the build
   pipeline fails.
3. **No Browser in Core Check:** Static scanning verifies that browser globals
   are not referenced in the core engine.

### Developer Workflow Verification

Before opening a Pull Request, a developer must execute `just check` locally.
This command runs:

1. Code formatting and lint validations (`biome check`).
2. TypeScript type validations (`deno check` and `svelte-check`).
3. Unit and integration test suites.
4. JSR mock dry-runs (`deno publish --dry-run`).

---

## 9. Open Questions & Risks

- **Svelte 5 Proxy Performance:** Intercepting all state lookups via a JS Proxy
  is elegant and eliminates boilerplate, but we need to profile performance
  under high-frequency updates.
  - _Mitigation:_ A benchmark test suite will be written in Phase 4 to verify
    rendering cycles.
- **dnt Output Footprint:** Compiling `@rune-lab/core` and packaging its Effect
  dependencies via `dnt` might increase the bundle size for npm consumers.
  - _Mitigation:_ A small prototype build of the core will be compiled in Phase
    3 to analyze tree-shaking efficacy.
- **Hash Route Namespace Conflicts:** If a consumer application uses standard
  hash-anchors for scroll positioning, our deep-linking router might intercept
  those events.
  - _Mitigation:_ The hash router will be designed to ignore hashes that do not
    match our registered patterns, allowing host apps to use normal anchor links
    freely.

---

_End of Specification. Refactoring execution begins at Phase 0._
