# [[rune-lab]] [[manifesto]]

> [!abstract] What this document is Not a spec. Not a checklist. The thing the
> specs are _for_ — so that a decision not covered by any work order still has
> an answer. When a question comes up mid-implementation that no file addresses,
> it gets answered by checking against these, in order.

## The north star

Everything in this pass is in service of one file staying this small:

```svelte
<script lang="ts">
import "./layout.css";
import { RuneProvider, version } from "rune-lab";
import type { Snippet } from "svelte";
import AppLayout from "./AppLayout.svelte";
import faviconUrl from "$lib/assets/img/rune.png";

let { children }: { children: Snippet } = $props();
</script>

<RuneProvider config={{ app: { name: "Rune Lab", version: version(), … } }}>
  <AppLayout>{@render children()}</AppLayout>
</RuneProvider>
```

Every principle below is a way of asking "does this keep that file true?" A
change that makes the library more correct but makes _that_ file longer is the
wrong change, or it's the right change made in the wrong place.

---

## 1. Delete before you decide

Unreachable code doesn't just sit there — it lies. It has types, tests, and
comments asserting invariants that nothing enforces, because nothing runs it.
`getCell` claimed to resolve any slot store; only one branch ever executed.
`themeStore`'s options claimed to derive from the narrowed list; they were a
constant evaluated at import time.

You cannot evaluate an architecture question against code that's about to be
deleted. That's why the Effect question waits until after the deletion pass —
deciding "commit or retreat" against a codebase where a third of `core` is dead
weight answers a question that won't exist afterward.

**Order:** delete, then decide. Never the reverse.

## 2. Truth lives at its source, not in a copy of it

rune-lab doesn't hardcode a list of 35 theme names, a list of 13 locales, or a
list of icon sets. Those lists already exist — in the CSS daisyUI emitted, in
`project.inlang/settings.json`, and (once `icons` is deleted) nowhere, because
there's only one.

A copy of an upstream list isn't documentation, it's a second place that can go
stale. It always does. The fix is never "add a sync step" — it's "delete the
copy and read the original at the moment you need it."

This is also why `getStoreForField` parsing a plugin id out of a string is wrong
even though it works: the plugin id already exists, structurally, on the plugin
object. The string was a copy of information the type system already had.

## 3. Errors are values, not control flow

No `try`/`catch` in `core`. Not because exceptions are slow — because a thrown
string can't be matched, can't be tested per-failure, and turns "handle this
specific error" into "hope the message didn't change." `Either`, `Option`, and
tagged errors make the failure a value sitting in the return type, where the
type checker enforces that you dealt with it.

The stronger form of this principle: **the best error handling makes the wrong
state impossible to construct**, not caught after construction. A field id
without a dot shouldn't produce `rl::theme` and fail quietly downstream — it
should fail to type-check, or fail loudly at `definePlugin` time, before it ever
reaches the code that would otherwise need a try/catch to survive it.

## 4. The consumer's syntax is the spec; the internals bend to fit it

Work backward from what someone types, not forward from what's easiest to build.
The `plugins={[...]}` array wasn't wrong because it was ugly — the first
instinct to remove it _was_ wrong, because removing it broke real decoupling
(explicit imports, no bundler-dependent magic) to chase a smaller diff. The
syntax that survived is the one that's simplest _for the person typing it_, even
where that costs the library an extra layer (`rune-lab` as a pre-wired root
entry, sitting above `ui`).

When an internal concern (module-init ordering, bundler tree-shaking, SSR
timing) would leak into the consumer's file, the fix is always to absorb the
complexity into the library, never to explain it to the consumer. If a work
order's fix would add a line to that snippet, it's not this pass's fix.

## 5. Real imports over implicit magic

Decoupling doesn't mean invisible. `import "rune-lab/layout"` executing a side
effect on import is _more_ coupled to the world — to bundler configuration, to
`sideEffects` flags, to import order — than `plugins={[layout]}` ever was. An
explicit array entry is a real, visible, type-checked usage. It survives being
split into separate packages; a side-effect registration doesn't survive an
aggressive tree-shaker.

Prefer the mechanism that fails loudly (a missing plugin throws
`MissingRequirement`) over the one that fails silently (a stripped import leaves
a feature quietly absent). Loud is decoupled. Silent is fragile.

## 6. If you're paying for it, use all of it — otherwise, don't carry it

`effect` was in the dependency tree earning its keep on one of eight
capabilities (`Schema`). Everything else — `Context`, `Layer`, `ManagedRuntime`,
`SubscriptionRef`'s change stream stacked under three more notification layers —
was ceremony with no payoff, because nothing downstream ever touched an async
layer, a typed error, or a scoped finalizer.

The fix was never "use Effect a little more carefully." It's binary: either the
finalizers actually run, the errors are actually typed, and slot creation can
actually be async — or none of that machinery belongs in the bundle. Half of a
dependency's cost with none of its benefit is the worst point on that line, and
it's where the library was sitting.

## 7. One reactive path, not four

`StateCell` had a `SubscriptionRef`, a separate listener `Set`, a manual version
counter, and a forked `Stream` watcher — four mechanisms doing the job of one
signal. Meanwhile the statusbar read a plain `Map` with no reactivity behind it
at all, so registering a contribution at runtime did nothing.

Where a single, already-paid-for mechanism exists (the `contributions` cell,
Svelte's own `$state`), every other path collapses into it. Reactivity that
needs four layers to explain isn't robust — it's four independent places to be
wrong.

## 8. No configuration nobody asked for

`icons: "material"` configured a choice that didn't exist — there was one icon
set. A config field that can only ever hold its default value isn't flexibility,
it's a question the API asks the consumer for no reason.

Every deleted config field in this pass (`theme.available`, `language.locales`,
`registry.router`) was deleted because its answer was already determined
elsewhere — by the CSS, by the paraglide project, by removing the need for a
router entirely. The test for a config option: if there is currently exactly one
right answer, it isn't an option, it's a fact, and facts don't belong in a
config object.

## 9. Small is what's left over, not a target chased directly

Core dropping by ~40% isn't the goal — it's the receipt for principles 1 through
8 having been applied honestly. Nobody should trim a file to hit a line-count
number; strip what's unreachable, relocate what's misplaced (the text port, into
`layout`), and let the total fall out of that. A codebase optimized for
smallness _as a metric_ hides things instead of removing them. One optimized for
correctness happens to end up small.

---

## What this is not

- **Not a rewrite.** Every issue is subtractive or corrective against the
  current `0.5.1-rc.1` behavior. Nothing here introduces a new plugin system, a
  new state-management pattern, or speculative extensibility for a use case that
  doesn't exist yet.
- **Not chasing elegance for its own sake.** The CSSOM walk for theme discovery
  is uglier than a hardcoded array. It's correct in both directions the array
  wasn't. Ugly-and-correct beats clean-and-wrong every time this pass had to
  choose.
- **Not backward-compatible mid-transition.** The build is red between Wave 1
  and Wave 2 on purpose. A shim that keeps `just types` green during that window
  is a shim that outlives the transition and becomes permanent debt.
- **Not adding a fourth option when three were on the table.** Where a decision
  was genuinely open (locale resolution, theme detection), the choice got made
  and recorded, not left flexible "just in case." Flexibility not asked for is
  principle 8 again, wearing an architecture costume.

## When principles conflict

They will. In order of precedence when two of these pull in different
directions:

1. **Correctness** (2, 3) — a fact must come from its source; an error must be a
   value. Non-negotiable.
2. **The consumer's syntax** (4) — the north-star snippet does not get longer.
3. **Decoupling honesty** (5) — real imports over implicit registration, even if
   implicit would look cleaner.
4. **Commitment over half-measures** (6, 7) — one mechanism, fully used, not two
   mechanisms partially used.
5. **Restraint** (8, 9) — when nothing above settles it, don't add the option,
   don't keep the line, don't chase the alternative that "might be needed
   later."
