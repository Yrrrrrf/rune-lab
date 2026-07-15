# Rune Lab — Project Manifest

> What this is: the _why_, kept stable. Implementation drifts; this document
> shouldn't need to change with it. Companions (the _how_ and the _what's
> actually there_): `IMPLEMENTATION_CONTEXT.md` (code-level context for any
> model), `rune-lab-v0.5-completion-spec.md` (the architecture spec),
> `plugin-refactor-{layout-palettes,i18n,observer}.md` (per-plugin work orders),
> `check-loop-and-showcase-move.md` (verification ritual + next move). Read
> order for a fresh session: this file → `IMPLEMENTATION_CONTEXT.md` → whichever
> companion matches the task at hand.

---

## 1. What rune-lab is

A plugin-based application shell for Svelte 5. Not a component library — the
skeleton every serious app rebuilds by hand: layout, theming, i18n, shortcuts,
command palette, notifications, precision money — shipped once, composably, as
plugins over one small kernel.

## 2. The founding bet

Svelte 5 runes changed what a UI foundation _should be_. Runes gave the platform
`get/set/subscribe/getVersion` as a natural reactive primitive that doesn't
require Svelte to exist — which means the entire framework bridge can collapse
into one function (`useCell`) instead of a sprawling adapter layer. The kernel
is framework-free by _design_, not by discipline: it was never given a reason to
know about Svelte in the first place.

## 3. The three rings and the dependency law

```
core ← ui ← plugins ← apps
```

Imports flow strictly downward. **core** (`@rune-lab/core`) is the
framework-free kernel: plugin resolution, topological sort, Effect-based DI,
schema-guarded state. **ui** (`@rune-lab/svelte`) is the thin Svelte adapter:
one provider, one reactivity bridge, one accessor factory. **plugins** are the
domains — each owns its vocabulary, its stores, its components. **apps**
consume; they should barely need to write code at all.

Plugin-to-plugin dependencies (palettes needing layout, say) are
**kernel-mediated**, never direct imports: a plugin declares
`requires: [otherPluginId]`, the kernel enforces ordering and fails loud if the
requirement is missing. Sideways filesystem imports between plugin packages are
never the mechanism — that's a deliberate rule, not an oversight, and it's
currently being violated in at least one place (see the implementation context
doc).

## 4. The forge — why declarative specs

This is the project's central technical bet, and it has a named influence:
**`logic_tracer`'s Rust macro pattern** (`impl_enum_token!` — declare variant
data once, derive the trait impls, the parsing, the dispatch). The forge is the
TypeScript analogue without a macro system: a plugin is **data** (a spec — id,
requires, slots, settings), and a kernel-side interpreter derives everything
mechanical from it — context symbols, typed accessors, driver-injected
persistence, fail-loud errors naming the real plugin, settings sections. The
point is not less typing for its own sake. The point is that a bug class
(forgotten driver wiring, hand-typed accessor names drifting from their symbols)
becomes **structurally unwritable** rather than merely discouraged by
convention. "I never want to write boilerplate again" is the product
requirement; the forge is the mechanism.

Corollary: **the spec is the asset, not the interpreter.** The interpreter can
be rewritten, optimized, or retargeted at a second framework adapter without
touching a single plugin, as long as the spec vocabulary stays stable. Changes
to what a plugin _can declare_ are architecture decisions; changes to how a
declaration gets _executed_ are implementation details.

## 5. One package, many doors — and the specifier contract

Rune Lab publishes as one npm package with subpath exports (`rune-lab`,
`rune-lab/core`, `rune-lab/layout`, …). Dev-time workspace names (`@rune-lab/*`)
get rewritten into self-referencing subpaths by the build fold. This rewrite is
a **three-party contract** between source imports, the manifest that describes
the export map, and the build script that performs the rewrite. It is the single
most fragile asset in the repository — easy to silently break, hard to notice
broken (a workspace-shadowed dev server will happily resolve imports a real npm
consumer can't). Any refactor that isn't explicitly about the export surface
must leave this contract untouched. The only trustworthy verification is a
clean-room install in a scratch app outside the workspace.

## 6. Plugin-level dependencies and the intended domain split

The target shape is four plugins, each with a **single plugin id**, each the
sole owner of its domain's vocabulary:

- **layout** — the app shell. Zones, presets (simple page → docs → full VS-style
  workspace), theme, language selection. `requires: []`.
- **palettes** — the power-user complement. A palette **registry** (not a fixed
  set) rendered through one modal host; commands, shortcuts, settings-search are
  _registered palettes_, dogfooding the same public contract third parties get.
  `requires: [layout]` — the first and, for now, only plugin-level dependency in
  the system.
- **i18n** — message resolution (lang) and precision money (Dinero-backed
  arithmetic), under one plugin id, two internal sub-domains. `requires: []`.
- **observer** — read-only runtime introspection: the plugin graph, cell state,
  persisted values. It reads through a dedicated inspection port rather than a
  writeable exception to the "stores only touch their own namespace" rule.
  `requires: []`.

A fifth, later addition: **showcase**, the lab app's demo content promoted to a
plugin (`requires: [layout, palettes]`) — the reference consumer proving the
public surface is sufficient on its own. Not yet started.

This is the _target_. The implementation context doc is explicit about where the
current tree has drifted from it (plugin ids that don't match this list, domains
that split further than planned) — that drift is real and worth resolving
deliberately, not silently.

## 7. Non-negotiable principles

- **Obvious over clever.** If a type or abstraction takes longer to read than
  the boilerplate it replaces, it has failed regardless of how elegant it looks.
  This applies to the forge itself as much as to anything built with it.
- **Fail loud, name the fix.** Every kernel and accessor error names the plugin,
  the slot, and what to do — "did you register X in
  `<RuneProvider plugins={[…]}>`?" — never a bare `undefined` or a silent
  fallback into wrong behavior.
- **`mod.ts` is export-only.** Nothing inside a package imports its own barrel.
  This is the single rule that keeps the dependency graph acyclic; it is also,
  right now, the rule most worth auditing (see implementation context).
- **One instantiation channel.** Plugin stores are created through the kernel's
  `create` factory, never as module-level singletons. Singletons are where
  persistence bugs come from.
- **Ui stays domain-free.** No "Theme," "Shortcut," "Currency," "Command" in
  `@rune-lab/svelte`'s own source. It may _re-export_ core's vocabulary for
  ergonomic convenience (one import door for plugin authors), but nothing in
  ui's own files should need those words to do its job.
- **Not backward-compatible with its own past, pre-1.0.** v0.5 is explicitly not
  the moment to preserve an awkward decision for compatibility's sake. Legacy
  shapes are allowed to exist _during_ a migration; they are not allowed to
  become permanent by default.
- **The dist is the only honest gate.** `just run lab` passing proves nothing
  about a real consumer; workspace resolution shadows real export-map bugs. Only
  a clean-room tarball install counts.

## 8. Where this goes next

Read `IMPLEMENTATION_CONTEXT.md` for the current, concrete state of the code —
what's actually wired, what's aspirational, and the specific places where the
principles above are not yet holding. Then the completion spec and its three
plugin work orders describe the path from here to a v0.5 that is actually,
honestly, done.
