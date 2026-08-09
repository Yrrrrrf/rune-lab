# [[rune-lab]] [[testing]] — vite-plus cross-package resolution failure

> [!abstract] Scope
> `just test` / `just test-project src/` failed on 7 of 15 test files (all of
> `layout`'s and `i18n`'s own suites) with `Failed to resolve import
> "rune-lab/layout" from "src/packages/ui/src/RuneProvider.svelte"`. The real
> app, `just build`, and `just check`'s type-checking were **never affected** —
> this was a test-tooling-only failure with a real, structural cause.

**Reviewed at:** `0.5.1-rc.2` · **Scope:** `ui/src/RuneProvider.svelte`, `vite.config.ts`'s multi-project test setup

---

## Symptom

```
FAIL |layout| src/contributions.test.ts
FAIL |layout| src/settings.test.ts
FAIL |layout| src/stores/theme.test.ts
FAIL |layout| src/text/types-sync.test.ts
FAIL |i18n|   src/settings.test.ts
FAIL |i18n|   src/money/stores/currency.test.ts
FAIL |i18n|   src/money/stores/exchange-rate.test.ts

Error: Failed to resolve import "rune-lab/layout" from
"src/packages/ui/src/RuneProvider.svelte". Does the file exist?
```

The remaining 8 files (`ui`, `palettes`, `observer`) and all 109–128 tests
inside them passed — the failure was isolated to the `layout` and `i18n`
vite-plus test projects specifically.

## What was ruled out first

- **Not a stale build artifact** — reproduced identically on a fresh
  `just build && just inject`.
- **Not a `server.fs.allow` boundary issue** — explicitly tested by enabling
  the previously-commented-out `fs.allow` block in `vite.config.ts`; no
  change.
- **Not a stale Vite dep-optimization cache** — reproduced identically after
  `rm -rf node_modules/.vite`.
- **Not an SSR-vs-client alias split** — explicitly tested by duplicating
  `resolve.alias` under `ssr.resolve.alias`; no change, and this config had
  been unchanged and working before this session's edits regardless.

None of these were it, because none of them were the actual cause: this was
never a `vite.config.ts` problem. The alias config is correct and was never
touched.

## Root cause

Earlier this session, `RuneProvider.svelte` (`src/packages/ui/src/`) was
changed to additively default-wire `layout` and `palettes`:

```ts
import { layout } from "rune-lab/layout";
import { palettes } from "rune-lab/palettes";
const DEFAULT_PLUGINS: PluginInput[] = [layout, palettes];
```

Before that change, the dependency direction between `ui` and the plugin
packages was **one-way**: `layout`, `palettes`, `i18n`, and `observer` all
import utilities from `rune-lab/ui` (`createPluginKit`, `getKernel`,
`createConfigStore`, etc. — this is pervasive: `layout/plugin.ts`,
`layout/theme-presenter.ts`, `layout/stores/theme.svelte.ts`,
`i18n/plugin.ts`, `i18n/lang/presenter.ts`, `i18n/lang/store.svelte.ts`, and
several `.svelte` components in both packages all import `rune-lab/ui`), but
`ui` never imported anything from a specific plugin package. That
import-analysis is confirmed by:

```nu
grep -rln "rune-lab/ui" src/packages/plugins/layout/src src/packages/plugins/i18n/src
# -> plugin.ts, theme-presenter.ts, stores/theme.svelte.ts, several .svelte
#    components, in both packages
```

`RuneProvider.svelte` importing `layout`/`palettes` reversed that for the
first time, creating a cycle at the **package** level (not a JS-level
circular-import TDZ issue — that was already verified fine): `ui` now depends
on `layout`+`palettes`, and `layout`+`palettes` already depend on `ui`.

`vite.config.ts`'s `test.projects` array runs five isolated vite-plus
projects, one per package, each with its own `root`. When `layout`'s project
runs a test that imports anything from `rune-lab/ui` (which is nearly every
file in the package, since `createPluginKit`/`getKernel` are used throughout),
Vite must transform the whole reachable module graph from that entry —
including `ui/mod.ts`'s re-export of `RuneProvider.svelte`, even though the
test never uses `RuneProvider` directly. `RuneProvider.svelte` then tries to
resolve `rune-lab/layout` — an alias that points back **inside `layout`'s own
project root**, from a file that was itself reached by crossing **out of**
that root via `rune-lab/ui`. That two-hop, out-then-back-in resolution is
what fails inside vite-plus's per-project isolation.

This is exactly the risk the original plugin-registration design doc flagged
before this session ever started — it asked whether `RuneProvider.svelte`
importing plugin objects directly would create a broken cycle, and whether it
would need empirical verification. The verification done earlier this session
(`just check` + `just test-project src/packages/ui` in isolation) was
incomplete: it confirmed no JS-level cycle/TDZ issue within `ui`'s own
isolated test project, but never exercised the case of *another* project's
test transitively loading `RuneProvider.svelte` — which is exactly the case
that broke.

## Why the real app was never affected

`just build`'s `@sveltejs/package` step and the real SvelteKit dev
server/build both resolve the whole `rune-lab` source tree as a single
unified graph — they don't partition resolution by per-package project roots
the way vite-plus's `test.projects` array does. The two-hop cross-root
resolution pattern that breaks in the test runner never arises in the real
build path, which is why `just build`, `just inject`, and the live dev server
all worked throughout — this was purely a property of the test tooling's
project-isolation model.

## Fix

Removed the reversed dependency instead of routing around it:

- `RuneProvider.svelte` no longer imports `layout`/`palettes`; `plugins`
  prop is passed straight through to `createKernel` with no default merge
  (back to its pre-session shape).
- `apps/lab/src/routes/+layout.svelte` now explicitly wires
  `plugins={[layout, palettes, i18n, observer]}`. `apps/lab` is a separate,
  standalone Deno project (not a member of the workspace, and not one of
  `vite.config.ts`'s five test projects) that has resolved
  `rune-lab/layout`/`rune-lab/palettes` correctly as real published-package
  imports all session — this reintroduces no risk.

**Tradeoff:** `layout`/`palettes` are no longer automatically wired in by
`RuneProvider` itself — every consumer (currently just `apps/lab`) must list
all desired plugins explicitly, including `layout`/`palettes`. The
"additive default" behavior discussed earlier this session is not
achievable without reintroducing the `ui` → plugin-package dependency that
causes this exact failure, given `ui` is the package's sole entry point and
`vite.config.ts`'s multi-project test structure is not changing.

## Verification

```nu
just check          # 0 errors, both src/ and apps/lab
just test           # 15/15 test files, 128/128 tests passed
just build && just inject
```
