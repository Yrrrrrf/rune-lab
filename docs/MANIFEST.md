# Rune Lab — Manifesto (v0.5)

> The _why_ behind the code. This document is the constitution; the spec is the
> law; `ARCHITECTURE.md` is the map. When a decision is ambiguous, resolve it
> toward this document.

---

## What Rune Lab is

Rune Lab is a **plugin-based application shell for Svelte 5** — the part of an
app you rebuild every time and shouldn't have to. Layout, theming, i18n,
keyboard shortcuts, a command palette, toast notifications, and a precision
money layer, all wired through one coherent dependency-injection spine: **Kernel
→ Provider → Context**.

Since v0.5 that spine is explicit in the package's shape. Rune Lab is three
rings in one npm package:

- **The kernel** (`rune-lab/core`) — plugin resolution, topologically sorted
  store wiring, schema-guarded state cells, and ports (persistence, locale,
  text). It knows nothing about Svelte, the DOM, or any feature domain.
- **The adapter** (`rune-lab`) — the Svelte 5 binding. One provider, one
  reactivity bridge (`useCell`), one accessor factory, browser persistence
  drivers. It knows nothing about themes, shortcuts, commands, toasts, or money.
- **The plugins** (`rune-lab/layout`, `rune-lab/palettes`, `rune-lab/money`, …)
  — the domains. Each owns its types, its stores, its context symbols, its
  accessors, its overlays, and its third-party dependencies.

It is not a component zoo. It is the _skeleton_ you hang an app on. You register
the plugins you want, and you have a reactive shell that never fights you.

---

## The bet

The bet is that **runes change what a UI framework's foundation should look
like.** Svelte 5's fine-grained reactivity makes the old patterns — global
stores, manual subscriptions, prop-drilling, reactive-statement spaghetti —
unnecessary. Rune Lab is what a foundation looks like when you assume
`$state`/`$derived`/`$effect` from line one instead of bolting them on.

v0.5 sharpens the bet with a corollary: **the kernel doesn't need the framework
at all.** State cells expose subscribe-and-version — exactly the contract Svelte
5's subscriber pattern consumes — so the entire bridge between "the machine" and
"the runes" is one small function. If that bet is right, the framework should
_disappear_: the developer thinks in plugins and cells; the DI, persistence, and
context wiring are invisible plumbing that simply works.

---

## Principles

1. **Runes-first, no exceptions.** No legacy Svelte 4 stores, no `writable`, no
   `$:`. State is `$state`, computation is `$derived`, side effects are
   `$effect`. This is the one rule with no escape hatch.

2. **Composition over configuration.** Features are plugins. Plugins are
   collections of store-slots, overlays, and contributions. You load
   `LayoutPlugin` and `MoneyPlugin`; you don't load what you don't use. The
   kernel topologically sorts their dependencies and wires them — you never
   order anything by hand.

3. **Dependencies point down, never up or sideways.** Core imports nothing of
   ours. The adapter imports core. Plugins import both. Apps import all three.
   The adapter contains zero domain vocabulary — if a change needs the word
   "theme" or "shortcut" inside `rune-lab`'s root, the change belongs in a
   plugin. This boundary is grep-enforceable and should stay that way.

4. **The kernel is framework-free; the product is Svelte or nothing.** These are
   not in tension. Portability is not a goal — leaning all the way into runes is
   — but the discipline of a Svelte-free kernel is what keeps the adapter
   honest, small, and replaceable. The adapter's value is inversely proportional
   to its size.

5. **One package, many doors.** Nothing is published but `rune-lab`. Core and
   every plugin ride as subpaths (`rune-lab/core`, `rune-lab/layout`, …),
   resolved through the package's own exports map. Workspace names
   (`@rune-lab/*`) exist only at dev time; the build rewrites them. The
   specifier table in `ARCHITECTURE.md` is a three-party contract — source,
   manifest, patch pass — and changes touch all three or none.

6. **Type-safety is a feature, not a chore.** A `ThemeStore` should make
   `set("drak")` a _compile error_, not a runtime warning. Every `as any` /
   `as never` in the codebase is a small admission of defeat; the long arc is to
   delete them all.

7. **Batteries included, but removable.** Sensible defaults (32 themes, 13
   locales, precision money) ship in the box — as plugins. Every one of them is
   swappable — drivers, themes, currencies, strategies are all injectable.
   Defaults are a starting point, never a ceiling.

8. **The plumbing is honest.** Persistence is an abstract driver, not a
   hardcoded `localStorage` call. Money is integer-backed Dinero math, never
   floats. Exchange rates triangulate through a base currency instead of
   guessing. Contributions register exactly once. When the easy way is wrong,
   Rune Lab takes the correct way and hides the cost behind a clean surface.

9. **Fail loud at the boundary, never in the middle.** Misconfiguration (a
   missing plugin, an unknown cell, a driver used outside the provider) should
   throw _at the seam_ with a message that names the fix — not surface three
   components deep as `undefined`.

10. **Elegance is measured at the call site.** Internal cleverness only counts
    if it makes the consuming code shorter and clearer. The test for any
    abstraction is the `+layout.svelte` that uses it — and for the platform as a
    whole, the test is the three-line plugin recipe: define stores with a
    context key, export an accessor, optionally ship overlays. If writing a
    plugin ever takes more than that, the platform has failed, not the plugin.

---

## What Rune Lab is _not_

- **Not framework-agnostic as a product.** It is Svelte 5 or nothing. The
  kernel's framework-freedom is an internal discipline (principle 4), not a
  roadmap to React.
- **Not backward-compatible with its own past.** Until 1.0, the right design
  wins over the existing one. Keys, signatures, and shapes change when they
  should — `useRuneLab()` and the central symbol table died this way.
- **Not a styling library.** It rides DaisyUI + Tailwind for looks and owns the
  _behavior_ and _state_, not the pixels.
- **Not a kitchen sink.** New surface area must earn its place by being
  something every app shell needs — and it must earn its _ring_: domain code
  never enters the adapter, adapter code never enters the kernel. "Someone might
  want it" is not a reason.

---

## The character we're aiming for

When a senior engineer reads the source, the reaction should be _"oh, that's the
obvious way to do it"_ — not _"clever"_. The architecture should feel
inevitable: the topological DI, the subscribe-and-version cell contract, the
functional persistence drivers, the integer money layer are each the simplest
thing that is also correct.

The 0.5 line is about making the shape of the codebase say the same thing the
code does: three rings, one package, one direction of dependency. The work ahead
is not new features; it's closing the last gaps between the dist and the design
— every specifier resolved, every boundary grep-clean, every plugin a three-line
story.

---

## How to use this document

Every spec, PR, and design decision should be checkable against the principles
above. If a change violates one (e.g. introduces a legacy store, adds an
`as any`, puts a domain word in the adapter, hides a failure), that's a signal
to stop and reconsider — even if it "works." The manifesto is the tiebreaker.
