---
id: W0
title: Build/injection pipeline + plugin registration
wave: 0
note: >-
  Numbered W0 because it now gates everything else — W4-00/01/02/03's manual
  exit criteria, and Tier 2/4's manual checks generally, all need a lab that
  actually boots against current source, not a stale npm artifact.
depends-on: []
---

# W0 — Build/injection pipeline + plugin registration

> [!abstract] Two problems, handed off together because they were discovered
> together and the second can't be manually verified until the first is fixed.
>
> 1. `apps/lab` is checking against a **stale, pre-W1 npm artifact**, not
>    current source — this is the actual explanation for the `svelte-check`
>    errors seen at end of session, confirmed below, not guessed.
> 2. Even with a fresh injection, **plugins are registered nowhere** —
>    `RuneProvider`'s `plugins` prop defaults to `[]` and nothing populates it,
>    so `AppLayout.svelte`'s accessor calls (`getLayoutStore()` etc.) will
>    throw. This wave designs the fix; it does **not** implement it — see
>    Decisions.

---

## Part 1 — The build/injection gap

### Confirmed, not assumed

At end of session, `just check`'s `apps/lab` pass reported:

```
Error while loading config at apps/lab/vite.config.mts
Error: No Svelte configuration found in vite config.
'"rune-lab/palettes"' has no exported member named 'getCommandsStore'. Did you mean 'getCommandStore'?
'"rune-lab/palettes"' has no exported member named 'getToastsStore'. Did you mean 'getToastStore'?
Object literal may only specify known properties, and 'icon' does not exist in type 'Partial<AppData>'.
```

Cross-checked against **current source**, not the error message's guess:

```nu
rg "getCommandsStore|getToastsStore" src/packages/plugins/palettes/src/plugin.ts
# → exports getCommandsStore, getToastsStore — plural, exactly what
#   AppLayout.svelte already imports. The error's "did you mean
#   getCommandStore" suggestion is wrong against current source.

rg "interface AppData" -A 12 src/packages/ui/src/reactivity/app.svelte.ts
# → icon?: string already declared.

cat apps/lab/node_modules/rune-lab/package.json | grep version
# → "0.5.0-rc.1"   (root deno.json / current source is 0.5.1-rc.2)
```

**Verdict:** `apps/lab`'s source is correct. `svelte-check` is checking it
against `node_modules/rune-lab`'s stale `.d.ts` files from a `0.5.0-rc.1` build
that predates W1 through W4 entirely. This is not a code bug — it's a
build-artifact freshness problem. `build-pipeline.md`'s own §9 documents this
exact tradeoff: *"editing `src/packages/*` no longer hot-reloads the lab...
the lab only sees changes after `just build && just inject`."*

### Why this is W0 and not a footnote

Every wave since W2-A has had manual exit criteria — "app boots," "theme switch
works," "settings modal renders" — that were written assuming a working
build/inject loop. None of them have actually been checked against a live app
this entire remediation effort, because the lab has been running a
`0.5.0-rc.1` artifact the whole time. **Every manual checkbox ticked in
W2/W3/W4's docs so far was a type-check/unit-test pass, not a real
verification.** That's not a crisis — the unit-test coverage is real and
these fixes are almost certainly correct — but it should be said plainly rather
than discovered later.

### The work

1. Run `just build`. It is expected to fail or produce something broken — it
   has not been exercised since before this remediation wave started, and
   `build-pipeline.md` documents several ways it's historically gone wrong
   silently (§1–§8). Read that document before debugging blind; it's a
   post-mortem of exactly this kind of failure, already written.
2. Fix whatever `just build` finds. Do not guess — each of `build-pipeline.md`'s
   numbered sections has a **Verify** command; use them.
3. Run `just inject`. Confirm `apps/lab/node_modules/rune-lab/package.json`
   reports `0.5.1-rc.2` (or whatever the root `deno.json` version is at the
   time), not `0.5.0-rc.1`.
4. Re-run `just check`. The three specific errors quoted above should vanish
   without touching `apps/lab/src` — if they don't, that's new information
   (a real drift, not staleness) and needs its own investigation, not a
   source-code fix applied reflexively.
5. **Only now** are W2/W3/W4's manual exit criteria (theme switch, language
   switch, settings modal, statusbar contributions, toast dispose, hotkey
   isolation — the full list across every prior wave's doc) actually
   checkable. Run them. This is the first real chance to catch something a
   passing test suite couldn't.

### Exit criteria

- [ ] `just build` completes clean
- [ ] `apps/lab/node_modules/rune-lab/package.json` version matches root `deno.json`
- [ ] `just check` on `apps/lab` → 0 errors (the three quoted above included)
- [ ] The full accumulated manual-verification list from W2-A through W4-03 is
      run for the first time against a real build, results recorded
- [ ] `just dev` boots without throwing — **expected to still fail** until
      Part 2 lands, since plugins still aren't registered; confirm the failure
      is specifically the `getLayoutStore` "did you register layout" error and
      nothing else

```nu
just build
just inject
cat apps/lab/node_modules/rune-lab/package.json | grep version
just check
```

---

## Part 2 — Plugin registration (design only — do not implement without sign-off)

### The problem, precisely

`ui/src/RuneProvider.svelte` defaults `plugins = []`. Nothing in `apps/lab`
passes a `plugins` prop — the target `+layout.svelte` file is intentionally
bare, per the north star in `MANIFEST.md`. So today, `AppLayout.svelte`'s
`getLayoutStore()`, `getCommandsStore()`, `getRegistryStore()`,
`getToastsStore()`, and `+page.svelte`'s `ThemeSelector`/`LanguageSelector`
all throw — every one is a `createAccessor(...)` call that reads Svelte
context nothing ever populated.

### The design, agreed this session

**Additive default, not replacing prop.** `RuneProvider` ships with all four
plugins wired in by default; a consumer-supplied `plugins` prop *adds* to that
set rather than replacing it:

```ts
const activePlugins = [...DEFAULT_PLUGINS, ...(plugins ?? [])];
```

This is the part that matters for the future you specifically raised: if
`i18n` (or any plugin) later becomes its own separately-published package
instead of a bundled default, removing it from `DEFAULT_PLUGINS` is a one-line
change in `ui`'s own source, and it costs nothing to anyone who was already
writing `plugins={[i18n]}` explicitly — they don't notice the day it stops
being a default, because their app was never relying on the default in the
first place. A **replacing** prop would force every such consumer to
re-enumerate the whole default set the moment they wanted to add one thing —
that's the shape that was rejected.

T4.4 (this doc's own W4-01, already in progress — `errors.ts` has an unused
`DuplicatePluginId` tagged error sitting ready for it) becomes the safety net
for this merge: two different plugin objects sharing an id must fail loudly,
not silently pick one, once defaults and explicit extras can collide.

### The open technical question — verify before building

`ui/src/mod.ts` is currently a **single** export (`"."` → `src/mod.ts`), and it
exports both `createPluginKit` (which every plugin's `plugin.ts` imports) and
`RuneProvider`. If `RuneProvider.svelte` imports the four plugin objects
directly to build `DEFAULT_PLUGINS`, does that actually create a broken import
cycle (`ui/mod.ts → RuneProvider.svelte → layout/plugin.ts → rune-lab/ui →
ui/mod.ts`), or does it work because `createPluginKit`'s re-export
(`ui/mod.ts` line 3) is evaluated before `RuneProvider`'s (line ~15), so the
binding `layout/plugin.ts` needs is already populated by the time the cycle
closes?

**This was never actually tested this session — only asserted, first by the
original W2-A spec, then by me repeating it.** Real ESM circular-import
semantics are order-sensitive in exactly the way that would make this
"probably fine but fragile," and Vite/Rollup's bundling behavior doesn't
always match spec-pure Node ESM semantics besides. **Step 0, before writing
anything else:** make the direct import change in `RuneProvider.svelte` alone,
nothing else, and run `just check` + `just test-project src/packages/ui`. Two
outcomes:

- **It works.** Then the whole `rune-lab/ui/kit` subpath-export plan (splitting
  `ui/deno.json`'s exports, adding parallel entries to `src/tsconfig.json` and
  root `vite.config.ts`) is unnecessary — a smaller, one-file change closes
  this out, and the plan below can be skipped entirely.
- **It breaks** (TDZ error, undefined `createPluginKit`, or a Rollup circular
  warning that manifests as broken output). Then do the export split:
  `ui/deno.json` gains `"./kit": "./src/define/plugin-kit.ts"`, matching
  entries go into `src/tsconfig.json`'s `paths` and root `vite.config.ts`'s
  `resolve.alias` (both are flat 1:1 maps today, no subpath/prefix matching —
  confirmed by reading both files this session), and the three plugins'
  `import { createPluginKit } from "rune-lab/ui"` becomes `"rune-lab/ui/kit"`.

Either way, **verify empirically first.** Don't build the seven-file version
against an unverified premise a second time.

### Loose end from this session, unrelated to the cycle question

Root `vite.config.ts`'s `resolve.alias` (inside `svelteProject()`, so it
applies to all five test projects) has a dead entry:
`"rune-lab": resolve("./src/packages/rune-lab/src/mod.ts")` — that path has
never existed; W2-A's originally-planned wrapper package was never built, and
this session's discussion concluded it isn't needed (`ui` *is* the entry
point). Nothing currently imports bare `"rune-lab"` from within `src/`, so it's
inert, but it should either be deleted or repointed at `ui/src/mod.ts` once
Part 2's shape is decided — leaving a workspace-relative alias pointing at
nothing is exactly the kind of stale-and-confusing state this whole
remediation effort has been closing out elsewhere.

### Exit criteria

- [ ] Step 0's finding is recorded here before anything else is built: does the
      direct import cycle work or not, and why
- [ ] `RuneProvider`'s plugin merge is additive (`[...defaults, ...extras]`),
      never a replacing assignment
- [ ] A duplicate-id collision between a default and an explicit extra fails
      loudly (depends on W4-01/T4.4 landing first — same file family, do that
      one first if not already done)
- [ ] `apps/lab/src/routes/+layout.svelte` is **unchanged** — this is the one
      invariant that must hold regardless of which mechanism wins
- [ ] `just dev`: app boots, `AppLayout.svelte`'s accessor calls succeed,
      the full manual-verification backlog from Part 1 actually runs
- [ ] The dead `"rune-lab"` alias in `vite.config.ts` is resolved one way or
      the other, not left dangling
- [ ] **Do not implement this section without discussing the Step 0 result
      first** — that was explicit this session and still holds

---

## Session handoff — uncommitted state

- `src/packages/plugins/layout/src/stores/text.svelte.ts` — W4-03 complete
  (locale seeded at construction + defensive `onChange` wiring + `dispose()`
  releases it). Verified: `just check` on `src/` → 0 errors, 0 warnings.
  **Uncommitted.**
- `src/packages/core/src/errors.ts` — `DuplicatePluginId` tagged error added,
  currently unused (W4-01/T4.4's fix in `wiring.ts`'s `normalizePlugins` was
  interrupted before landing). Compiles fine, does nothing yet.
  **Uncommitted.**
- W4-01 (T4.4/T4.5/T4.8): started, not finished — only the error class exists.
- W4-02 (settings `pluginId` typing): not started.
- W4-00 / this file's Part 2: design agreed, explicitly **not** implemented —
  see Decisions above.
- `apps/lab`'s `just check` failures are **not** new source bugs — confirmed
  above to be stale-artifact symptoms. Do not "fix" `AppLayout.svelte` or
  `+page.svelte` in response to them.

## Recommended order for next session

1. Part 1 (build/inject) first — it's a prerequisite for verifying everything
   else, including finishing W4-01/02, which don't strictly need it but whose
   manual checks do.
2. Finish W4-01 (the `DuplicatePluginId` half-edit is sitting there) and W4-02.
3. Part 2's Step 0 (the empirical cycle test) — small, fast, decides the shape
   of everything after it.
4. Part 2's actual implementation, once Step 0's answer is known and confirmed
   with you.
