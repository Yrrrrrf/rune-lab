# Rune Lab — Manifesto

> The _why_ behind the code. This document is the constitution; the spec is the
> law. When a decision is ambiguous, resolve it toward this document.

---

## What Rune Lab is

Rune Lab is a **plugin-based application shell for Svelte 5** — the part of an
app you rebuild every time and shouldn't have to. Layout, theming, i18n,
keyboard shortcuts, a command palette, toast notifications, and a precision
money layer, all wired through one coherent dependency-injection spine:
**Provider → Registry → Context**.

It is not a component zoo. It is the _skeleton_ you hang an app on. You register
the plugins you want, pass a few callbacks, and you have a reactive shell that
never fights you.

---

## The bet

The bet is that **runes change what a UI framework's foundation should look
like.** Svelte 5's fine-grained reactivity makes the old patterns — global
stores, manual subscriptions, prop-drilling, reactive-statement spaghetti —
unnecessary. Rune Lab is what a foundation looks like when you assume
`$state`/`$derived`/`$effect` from line one instead of bolting them on.

If that bet is right, the framework should _disappear_. The developer thinks in
plugins and callbacks; the reactivity, persistence, and context wiring are
invisible plumbing that simply works.

---

## Principles

1. **Runes-first, no exceptions.** No legacy Svelte 4 stores, no `writable`, no
   `$:`. State is `$state`, computation is `$derived`, side effects are
   `$effect`. This is the one rule with no escape hatch.

2. **Composition over configuration.** Features are plugins. Plugins are
   collections of store-slots and overlays. You load `LayoutPlugin` and
   `MoneyPlugin`; you don't load what you don't use. The kernel topologically
   sorts their dependencies and wires them — you never order anything by hand.

3. **Type-safety is a feature, not a chore.** A `ThemeStore` should make
   `set("drak")` a _compile error_, not a runtime warning. Every `as any` /
   `as never` in the codebase is a small admission of defeat; the long arc is to
   delete them all.

4. **Batteries included, but removable.** Sensible defaults (32 themes, 13
   locales, precision money) ship in the box. Every one of them is swappable —
   drivers, themes, currencies, strategies are all injectable. Defaults are a
   starting point, never a ceiling.

5. **The plumbing is honest.** Persistence is an abstract driver, not a
   hardcoded `localStorage` call. Money is integer-backed Dinero math, never
   floats. Exchange rates triangulate through a base currency instead of
   guessing. When the easy way is wrong, Rune Lab takes the correct way and
   hides the cost behind a clean surface.

6. **Fail loud at the boundary, never in the middle.** Misconfiguration (a
   missing plugin, a driver used outside the provider) should throw _at the
   seam_ with a message that names the fix — not surface three components deep
   as `undefined`.

7. **Elegance is measured at the call site.** Internal cleverness only counts if
   it makes the consuming code shorter and clearer. The test for any abstraction
   is the `+layout.svelte` that uses it.

---

## What Rune Lab is _not_

- **Not framework-agnostic.** It is Svelte 5 or nothing. Portability is not a
  goal; leaning all the way into runes is.
- **Not backward-compatible with its own past.** Until 1.0, the right design
  wins over the existing one. Keys, signatures, and shapes change when they
  should.
- **Not a styling library.** It rides DaisyUI + Tailwind for looks and owns the
  _behavior_ and _state_, not the pixels.
- **Not a kitchen sink.** New surface area must earn its place by being
  something every app shell needs. "Someone might want it" is not a reason.

---

## The character we're aiming for

When a senior engineer reads the source, the reaction should be _"oh, that's the
obvious way to do it"_ — not _"clever"_. The architecture should feel
inevitable: the topological DI, the functional persistence drivers, the integer
money layer are each the simplest thing that is also correct.

The 0.4.x line is about earning that reaction everywhere — closing the gap
between the parts of the codebase that already read as inevitable and the parts
that still carry `unknown`, dead flags, or silent failures. The goal of the work
ahead is not new features; it's raising the floor to the level of the best rooms
in the house.

---

## How to use this document

Every spec, PR, and design decision should be checkable against the principles
above. If a change violates one (e.g. introduces a legacy store, adds an
`as any`, hides a failure), that's a signal to stop and reconsider — even if it
"works." The manifesto is the tiebreaker.
