# [[rune-lab]] [[ui]] — going framework-agnostic, design overview

> [!abstract] Scope
> This is a **design overview**, not a spec and not a migration plan. Nothing
> in `src/` changes because of this file. The point is to lay out, in one
> place, whether `rune-lab` can be consumed from a framework other than
> Svelte, what already supports that today, what would have to change, and
> what is genuinely undecided. Read this before starting any `ui-<framework>`
> package — several of the open questions in §5 change the shape of that work
> significantly depending on the answer.

**Target:** `0.6.0` (proposed) · **Current:** `0.5.1` · **Scope:**
`src/packages/core`, `src/packages/ui`, `src/packages/plugins/*`,
`docs/ARCHITECTURE.md`

---

## 1. The claim being evaluated

`rune-lab`'s own `ARCHITECTURE.md` already draws a line:

| Layer     | Rule                                                              |
| --------- | ------------------------------------------------------------------ |
| `core`    | No Svelte, no DOM, no plugin knowledge. Kernel, contracts, ports.  |
| `ui`      | The Svelte layer. Depends on `core`. Never imports a plugin.       |
| `plugins` | Depend on `ui` + `core`.                                           |

The question this doc answers: **is `core`'s side of that line actually
framework-agnostic today, or only agnostic-shaped?** Verified by reading
`core`'s source directly, not by inference from the architecture doc's stated
intent:

- `StateCell` (`core/src/cells/define-cell.ts`) and `ConfigStoreImpl`
  (`core/src/config/config-store.ts`) are both plain `subscribe(listener) →
  unsubscribe` pub-sub, built on `effect`'s `SubscriptionRef`. Neither imports
  Svelte.
- `defineSlot` (`core/src/forge/define-slot.ts`) returns a **store**
  (`create(context): TStore`), not a component.
- `defineContribution` is typed data, not a rendering hook.

Conclusion: **the claim holds.** `core` is already portable to any framework
as-is. The work this doc describes is entirely about `ui` and `plugins`, not
`core`.

## 2. Where the coupling actually lives

Grepping the current tree, three distinct problems, not one:

1. **The reactivity bridge** — `ui/src/reactivity/use-cell.svelte.ts` and 19
   `.svelte.ts` "rune stores" across `plugins/*`
   (`layout/src/stores/theme.svelte.ts`,
   `i18n/src/money/stores/currency.svelte.ts`,
   `palettes/src/host/hotkeys.svelte.ts`, etc.) exist only to wrap `core`'s
   `subscribe()` contract in Svelte's `createSubscriber`/`$state`.
2. **DI/context** — `ui/src/RuneProvider.svelte` +
   `ui/src/provider/context.ts`'s `getContext`/`setContext` (22 call sites
   across the tree). Svelte-specific; no shared primitive to fall back on.
3. **Component markup** — 50 `.svelte` SFCs across `ui` + all four plugins,
   9 of which take **Svelte 5 Snippets as props**
   (`ResourceSelector.svelte`'s `triggerLabel: Snippet<[T]>`,
   `AppSettingSelector.svelte`, `SettingsFields.svelte`'s `field.component`
   escape hatch).

These three have very different costs, which is the reason this is a design
overview and not a single "port it" task.

## 3. Cost per problem

**(1) Reactivity bridge — cheap.** Since `core` already exposes a plain
`subscribe`/`get` contract, every framework's adapter is a small, mechanical
wrapper around the same shape:

```ts
// core — unchanged, already exists
interface Readable<T> {
  get(): T;
  subscribe(listener: () => void): () => void;
}
```

```ts
// ui-svelte/reactivity/use-cell.svelte.ts — close to what exists today
export function useCell<T>(store: Readable<T>) {
  const subscribe = createSubscriber((update) => store.subscribe(update));
  return { get current() { subscribe(); return store.get(); } };
}

// ui-react/reactivity/useCell.ts
export function useCell<T>(store: Readable<T>): T {
  return useSyncExternalStore(store.subscribe, store.get);
}

// ui-vue/reactivity/useCell.ts
export function useCell<T>(store: Readable<T>) {
  const value = shallowRef(store.get());
  onScopeDispose(store.subscribe(() => { value.value = store.get(); }));
  return value;
}

// ui-vanilla/reactivity/bindCell.ts
export function bindCell<T>(store: Readable<T>, onChange: (v: T) => void) {
  onChange(store.get());
  return store.subscribe(() => onChange(store.get()));
}
```

One file per framework, same import name, same underlying store. This is a
swap-the-adapter problem, not a redesign.

**(2) DI/context — medium.** `RuneProvider` becomes a thin per-framework
wrapper around a plain module-scoped kernel registry that `core` would need
to expose (doesn't exist yet — see open question §5.3). Each framework's
version uses its own idiom (React Context, Vue `provide`/`inject`, a plain
variable for vanilla) on top of that shared registry.

**(3) Component markup — the real work, and not uniformly portable.** Leaf
components with no composition (`ThemeSwatch`, `Icon`, `StatusbarZone`) port
cleanly — same store, same layout logic, four renderers:

```svelte
<!-- ui-svelte -->
<script lang="ts">
  const theme = useCell(getThemeStore());
</script>
<div class="swatch" style:background={theme.current.accent} />
```
```tsx
// ui-react
export function ThemeSwatch() {
  const theme = useCell(getThemeStore());
  return <div className="swatch" style={{ background: theme.accent }} />;
}
```

Snippet-driven components do **not** port this cleanly — Svelte snippets,
React render-props, and Vue scoped slots are three different mechanisms with
no shared syntax. Two options, not yet chosen (see §5.4):

- **Path A — per-framework render API.** Same store, different composition
  idiom per framework (`renderTrigger` prop in React, `#trigger` scoped slot
  in Vue). Keeps today's flexibility; costs a real reimplementation per
  Snippet-using component, per framework.
- **Path B — data-driven config.** Replace render functions with descriptive
  data (`labelKey="name"` instead of a render callback), following the same
  shape `defineSlot` already uses in `core` — data in, framework renders it.
  Produces identical syntax across every framework, but stops covering fully
  custom renders, which `SettingsFields`' `field.component` escape hatch
  exists for today.

## 4. What this is not a good fit for

Two tempting shortcuts, both wrong for this specific codebase:

- **Mitosis-style single-source compilation** (author once, compile to React
  /Vue/Svelte source) — a bad fit here specifically because Svelte 5 runes
  and Snippet-based composition are too idiomatic to that one framework to
  transpile cleanly. This isn't true of every Svelte codebase; it's true of
  this one because of how heavily `ui`/`plugins` lean on Snippets and runes.
- **Web Components as the universal answer** — viable for the leaf-level
  pieces in §3, weak for anything Snippet-driven unless those components are
  first redesigned around Path B. Not a blanket solution on its own.

The direction that actually matches how this repo is already organized:
**keep `core` as the one shared kernel, and treat `ui` as one adapter among
several** (`ui-svelte` today, `ui-react`/`ui-vue`/`ui-vanilla` as future
siblings), each implementing the same component contracts against the same
`core`. Plugins would eventually need the same per-framework treatment, since
they currently import from `ui` and ship `.svelte` components in their own
`mod.ts` barrels (e.g. `plugins/layout/src/mod.ts`).

## 5. Open questions — genuinely undecided, do not assume an answer

1. **Scope.** Three options, increasing in cost:
   **(a)** Nothing changes — `core` is already agnostic, document the
   boundary and stop. **(b)** Extract the reactivity bridge + DI as a
   documented neutral contract (§3.1–3.2), rendering stays Svelte-only, but
   nothing structurally blocks a second UI package later. **(c)** Ship a real
   second UI package (`ui-react` or `ui-vanilla`) end to end. (b) and (c) are
   not the same commitment — (c) means every future component gets built N
   times, not once, ongoing, not a one-time cost.
2. **If (c): which second framework proves the boundary first?**
   Vanilla/Web Components was raised in conversation as the cheapest real
   test, since it forces the Snippet question (§5.4) to resolve for real
   instead of staying theoretical.
3. **Where does the shared kernel-registry primitive for §3.2 live?**
   Presumably `core`, alongside `defineSlot`/`defineContribution` — not
   designed or sketched in code yet.
4. **Path A vs Path B for Snippet-using components (§3, 9 call sites:
   `ResourceSelector`, `AppSettingSelector`, `SettingsFields`)?** This is the
   single decision with the widest blast radius in this whole doc — it
   determines whether those components' *contracts* change (Path B, affects
   every existing Svelte consumer too) or only their *implementations* gain
   siblings (Path A, existing Svelte usage untouched).
5. **Do plugins get their own `ui-<framework>` treatment in the same pass, or
   after `ui` itself is proven out?** `plugins/*` depend on `ui` today the
   same way `apps/lab` does; the answer to §5.1 mostly decides this one too.

## 6. What NOT to do

- Do not start building a `ui-react`/`ui-vue`/`ui-vanilla` package before §5.1
  and §5.4 are answered — both change which files move and how many times
  each Snippet-using component needs to be rewritten.
- Do not touch `core` as part of this work beyond possibly adding the
  registry primitive in §5.3 — its agnosticism is already verified (§1), not
  a thing to "fix."
- Do not treat this doc's Svelte code samples in §3 as a claim that today's
  `ui/src/reactivity/use-cell.svelte.ts` needs to change — it's shown only as
  the reference shape the other frameworks' adapters mirror.

## 7. Suggested next step

Resolve open question §5.1 with the user first — it's cheap to decide now and
expensive to redo once a package layout, `deno.json` workspace entries, and
`scripts/manifest.ts` exports all have a chosen scope baked in, the same
lesson `docs/v0.5.1/default-plugins-bundle-design.md` already drew for a
smaller decision.
