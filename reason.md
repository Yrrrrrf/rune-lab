This is the highly dense, technical refactoring plan for `@rune-lab/core`. It
outlines the architectural blueprints to transform your current runtime into a
dynamic microkernel powered by **Effect** under a strict boundary (Law 03).

---

### Architectural Blueprint: The Core Engine Structure

```
                             [ PUBLIC API BOUNDARY (Plain TS) ]
─────────────────────────────────────────────╪─────────────────────────────────────────────
                             [ EFFECT INNER ENGINE (Floor 0)  ]
                             
     ┌──────────────────────────────────────────────────────────────────────────────┐
     │                             ManagedRuntime (Facade)                          │
     └──────────────────────┬────────────────────────────────┬──────────────────────┘
                            │                                │
     ┌──────────────────────▼───────┐                ┌───────▼──────────────────────┐
     │     State Cells (Ref)        │                │    Registry (Context.Tag)    │
     └──────────────────────┬───────┘                └───────┬──────────────────────┘
                            │                                │
     ┌──────────────────────▼────────────────────────────────▼──────────────────────┐
     │                         Dependency Injection Layer (Effect.Layer)            │
     └──────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 1: The Type Algebra & Schema Parser (`plugin/manifest.ts`)

#### The Why:

Currently, your `StoreRegistryEntry` and `RunePlugin` rely on loose TypeScript
interfaces and runtime `optional` or `conditional` flags. If a plugin provides
malformed contribution data, it fails silently at boot time or crashes
rendering. By migrating to **Effect.Schema**, we turn plugin manifests into
self-validating data structures that are parsed and frozen at the core gate.

#### The Blueprint:

- **Schema Specification:** Define a strict `PluginManifest` schema. Every entry
  point, command, dynamic cell, and contribution array must carry a schema
  validator.
- **Branded Identifiers:** Use TypeScript branded types (e.g., `PluginId`,
  `RegistryId`) to prevent string-key collisions across the core and plugins.
- **The Parser Gate:** When a plugin manifest is submitted to `definePlugin`,
  the core parses the input against the schema. If validation fails, Effect
  returns a highly descriptive, nested parsing error, failing the boot cycle
  loudly and clearly before any app code mounts.

---

### Phase 2: The Dependency Injection Layer (`services/layers.ts`)

#### The Why:

Your current `topologicalSort` in `registry/mod.ts` manually tracks dependency
keys and throws circular reference errors. By shifting this to **Effect.Layer**,
we outsource dependency resolution, lazy instantiation, resource acquisition,
and graceful teardown to Effect's native, highly optimized graph solver.

#### The Blueprint:

- **Abstract Ports as Context Tags:** Define every hexagonal edge (e.g.,
  `PersistenceDriver`, `LocaleAdapter`) as an `Effect.Context.Tag`.
- **Layer Composition:** Convert every registry and store factory into an
  `Effect.Layer`. For example:
  - `PersistenceLayer` consumes the `PersistenceDriver` tag.
  - `LayoutRegistryLayer` consumes the `PersistenceLayer`.
  - `MoneyRegistryLayer` consumes `LayoutRegistryLayer` and a `LocaleAdapter`
    tag.
- **Environmental Graph Resolution:** The core automatically compiles these
  layers into a single, cohesive `LiveEnvironment` graph. If a plugin declares a
  missing dependency, the compiler catches it. Circular dependencies are
  resolved at the type level, making them mathematically unbuildable.

---

### Phase 3: The Reactive State Cell Engine (`persistence/store.ts`)

#### The Why:

The current `ConfigStoreImpl` uses Svelte's `$state` primitives directly inside
the core classes, which couples Floor 0 to the Svelte runtime and prevents
browser-free server testing. By replacing these class states with
**Effect.SubscriptionRef**, we keep the state model completely
framework-agnostic, atomic, and safe for parallel executions.

#### The Blueprint:

- **Atomic State Cells:** Every config dimension and contribution list is stored
  inside a `SubscriptionRef` cell.
- **The Stream Bridge:** The kernel exposes a raw, framework-neutral `Stream` of
  changes for each cell.
- **Monotonic Version Tracking:** Each cell maintains a version counter. When
  the stream emits a state transition, the version is incremented. The
  upper-layer Svelte bridge uses this integer for cheap change detection and
  invalidation.

---

### Phase 4: The Facade & Law of Containment (`mod.ts` + `runtime.ts`)

#### The Why:

Effect is immensely powerful, but exposing monadic types (`Effect`, `Layer`,
`Exit`) to Svelte components or external plugins would ruin the clean, standard
DX of your framework. Law 03 demands that Effect remains an internal engine
detail.

#### The Blueprint:

- **The ManagedRuntime Encapsulation:** The internal bootstrapper constructs a
  private `ManagedRuntime` using the compiled environmental graph.
- **The Synchronous Bridge:** The public `Kernel` interface is returned as a
  plain, hand-written TypeScript object.
- **API Boundary Signatures:**
  - **Getters (Synchronous):** The `Kernel.getCell(name)` function executes
    `Effect.runSync` on the internal `SubscriptionRef`, returning raw values
    immediately.
  - **Setters (Asynchronous):** The `Kernel.setCell(name, value)` function
    executes `Effect.runPromise` internally to handle disk/network storage
    operations, returning a standard, plain JS `Promise<void>`.
  - **Teardown (`dispose`):** The `Kernel.dispose()` method runs the runtime's
    finalizer, which automatically interrupts active fibers, flushes persisted
    writes, and runs all registry cleanup routines in the correct reverse
    dependency order.

---

### Refactoring Execution Matrix

| Subsystem         | Current Code (v0.5 In-Flight)              | Refactored Architecture (Effect-Native)      | Associated Design Pattern  |
| :---------------- | :----------------------------------------- | :------------------------------------------- | :------------------------- |
| **Manifests**     | Loose interfaces in `registry/mod.ts`      | Validated `Effect.Schema` with branded types | **Parse, Don't Validate**  |
| **Registries**    | Map-based registry inside `STORE_REGISTRY` | Abstract services composed as `Effect.Layer` | **Dependency Injection**   |
| **State Storage** | `$state` in `createConfigStore.svelte.ts`  | State cells managed by `SubscriptionRef`     | **Publisher-Subscriber**   |
| **Context Keys**  | Explicit `Symbol` map in `context.ts`      | Dynamic Symbol mapping by `RegistryId`       | **Flyweight Pattern**      |
| **API Surface**   | Dozen custom helper accessors              | A single, typed, dynamic `Proxy` object      | **Metaprogramming Facade** |

By executing this refactor, your core becomes a high-performance, featureless
virtual machine. It simply receives data manifests (the "grammars") and compiles
them into a thread-safe state tree. It is infinitely extensible, completely
isolated from browser environments for lightning-fast testing, and completely
clean of framework boilerplate.
