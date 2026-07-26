# The rune-lab build pipeline

This document explains **why** the build is shaped the way it is — not just what
each command does, but the specific tool behavior that forced each decision.
Every claim here was verified against the actual tool source
(`@sveltejs/load-config`, `@sveltejs/package`, `svelte2tsx`), not guessed from
symptoms.

If you only remember one thing: **the whole pipeline exists to turn a Deno
workspace using `@rune-lab/*` source aliases into a plain npm package that
imports itself as `rune-lab`.** Every step below is either producing that
package or verifying it didn't lie about itself.

---

## 1. Why `vite` is an explicit root dependency

`just types` runs `svelte-check`, and for years this repo had no
`svelte.config.js` — Svelte options live in `vite.config.ts` instead, which is
the currently-recommended approach.

The mechanism matters here. `svelte-check` doesn't parse `vite.config.ts`
itself. It calls `@sveltejs/load-config`, which:

1. Finds the nearest `vite.config.*` walking up from each file being checked.
2. `require.resolve('vite', { paths: [projectRoot] })` — resolving the **plain
   `vite` package**, not `vite-plus` or anything that merely embeds it.
3. Calls `vite.resolveConfig()` on your file to fully resolve it.
4. Reads Svelte options off the plugin named `vite-plugin-svelte:config` in the
   resolved plugin list.

Step 2 is a `require.resolve` from the **workspace root** — it does not follow
into `node_modules/.deno/vite-plus@.../node_modules/vite`. Before this fix,
`vite` only existed as `vite-plus`'s transitive dependency, buried where
root-level resolution can't see it. Step 2 failed silently, and `load-config`
returns "nothing found" rather than surfacing why — which is exactly the canned
message you'd see: _"No Svelte configuration found in vite config."_

The fix is one import in the root `deno.json`:

```json
"vite": "npm:vite@^8"
```

Version 8 specifically because that's what `vite-plus` and the rest of the
toolchain in this repo already resolve to — pinning it keeps `deno install` from
landing on a version `vite-plus` wasn't built against. It's a dev-only addition:
`manifest.ts` only ever reads _package-level_ `deno.json` files when building
the dependency list, so nothing here leaks into the published `package.json`.

**Verify:** `just types` should show zero "Error while loading config" / "Error
in vite.config" entries. Any remaining errors are genuine type-resolution issues
in your code, not this bug.

---

## 2. Why `svelte-package` runs from `src/`, not from each package directory

This was the subtler bug — no error, no warning, just **missing `.d.ts` files in
`build/dist`**, with `@sveltejs/package` reporting success.

### What actually generates the `.d.ts` files

`@sveltejs/package` doesn't compile types itself. It calls `svelte2tsx`'s
`emitDts()`, which:

1. Walks **upward from the input directory** to find the nearest `tsconfig.json`
   / `jsconfig.json`.
2. Rewrites that config's `include` to scope it to just the library input.
3. Runs a real TypeScript program with `declaration: true`,
   `emitDeclarationOnly: true`, writing to a `declarationDir` that is resolved
   **relative to the found tsconfig's directory**, not relative to the process's
   current working directory.
4. Copies the emitted files from that temp location into the final output.

The repo's only `tsconfig.json` covering the packages lives at
`src/tsconfig.json`. The old recipe did
`cd src/packages/ui; svelte-package -i src -o <abs path>`. `emitDts` found
`src/tsconfig.json` (two directories up from cwd) and computed its declaration
output path _relative to that tsconfig's directory_ — which is not where the
process's cwd was. TypeScript wrote real `.d.ts` files, just to a path
`svelte-package`'s copy step never looked at. No error was raised anywhere in
that chain — it's a silent path mismatch, not a failure.

### The second, independent bug this exposed

`emitDts` also reads a `package.json` from cwd to decide which Svelte version
shims to generate against:

```js
const svelte_dep = pkg.peerDependencies?.svelte || pkg.dependencies?.svelte ||
  "3.0";
```

With no `package.json` in the package directory, it silently assumes **Svelte
3**. Verified experimentally: without a shim, a component with typed props
(`let { label }: { label: string } = $props()`) emits a Svelte-3-style
declaration —

```ts
export default class Comp extends SvelteComponentTyped<CompProps, ...> {}
// where CompProps = Record<string, never>
```

— i.e. **the props are erased**. With a `package.json` declaring
`"peerDependencies": { "svelte": "^5.0.0" }` present, the same input correctly
emits:

```ts
declare const Comp: import("svelte").Component<$$ComponentProps, {}, "">;
```

with real prop types. This isn't cosmetic — it's the difference between a
published package whose components are usable from TypeScript and one where
every consumer sees `never`.

### The fix

Run `svelte-package` **from `src/`** — the same directory the tsconfig already
lives in — with a package.json shim present there for the duration of the
command:

```just
svelte-package dir out=("src" / dir):
    just with-shim src "{{ SVELTE_SHIM }}" \
      deno run -A npm:@sveltejs/package -i packages/{{ dir }}/src \
      -o "{{ justfile_directory() }}/build/dist/{{ out }}"
```

`cwd == tsconfig dir` closes the path-mismatch bug. The shim
(`scripts/shims/svelte-package.json`, containing only
`{ "peerDependencies": { "svelte": "^5.0.0" } }`) closes the Svelte-3-shim bug.
`with-shim` (already used for the test recipe) copies it in, runs the command,
and always removes it after — so it never pollutes the tree or collides with a
real `package.json` if one is added later.

Bonus: because this now uses the _real_ `src/tsconfig.json` — the one with
`@rune-lab/*` path mappings — cross-package imports resolve correctly during
declaration emit too. Before, a plugin importing `@rune-lab/core` inside a
per-directory `svelte-package` run had no way to resolve that specifier, so
those types could silently degrade to `any` as well.

**Verify:** `fd -e d.ts . build/dist` should return one file per compiled
module, not zero.

---

## 3. Why there's no more "reshuffle" step

Originally, `ui` was packaged flat into `build/dist/` (svelte-package's
default), while every other member went into a nested `build/dist/<name>` path.
`scripts/build.nu` then had a `reshuffle` function that manually moved `ui`'s
flat output into `src/ui`, plus two regex blocks in `patch-file` that rewrote
`ui`'s relative imports to compensate for the directory move (root `mod.js` →
`./src/ui/`, and back-references from inside `src/ui` → `../../mod.js`).

Once every package is packaged into a uniform `build/dist/src/<path>` layout
(`ui` included — see the `out=("src" / dir)` default above), there's nothing to
reshuffle. The reshuffle function and both special-case rewrite blocks were
deleted entirely — about 70 lines of the script's trickiest, most bug-prone code
— with zero effect on package consumers, because **consumers only ever see the
`exports` map in `package.json`, never the internal `dist/` paths**. Internal
layout is free to be as uniform as it wants.

---

## 4. `BUILD_PLUGINS`: one list, three consumers

Plugins are opt-in and declared exactly once, in `scripts/_shared.just`:

```just
# Plugins shipped in the published rune-lab package (core + ui always ship).
BUILD_PLUGINS := "layout palettes i18n observer"
```

Three things read this list and cannot disagree with each other, because they
all derive from the same value:

- **`just build`** loops over it to call `svelte-package plugins/<name>` for
  each entry (`core` and `ui` are packaged unconditionally, outside the loop —
  they're not optional).
- **`scripts/manifest.ts`** receives the same list as CLI args
  (`deno run -A scripts/manifest.ts {{ BUILD_PLUGINS }}`) and derives both the
  `exports` map (`"./layout"`, `"./palettes"`, …) and the dependency- gathering
  path list (`src/packages/plugins/<name>`) from it.

Adding a plugin (e.g. the planned `explorer`) is: create the package, add one
word to `BUILD_PLUGINS`. No other file changes.

`manifest.ts` reads each plugin's `deno.json` with **no try/catch** — a typo'd
name in `BUILD_PLUGINS` now fails immediately, at the manifest step, with a
clear "file not found" pointing at the exact path. Previously a bad path would
have been swallowed as a warning and only surfaced later as a confusing
export-gate failure deep in `build.nu`.

---

## 5. What `scripts/manifest.ts` actually assembles

`build/package.json` is **not** a copy of any single `deno.json`. It's
synthesized from:

- **Identity fields** (`name`, `version`, `description`, `license`,
  `repository`, derived `homepage`/`bugs`) — from the **root** `deno.json`,
  which is treated as the canonical source of truth for the published package's
  identity.
- **`exports`** — generated structurally from `BUILD_PLUGINS`, uniform per entry
  (`types` / `svelte` / `default`, pointing at the corresponding `dist/src/...`
  path). `core` has no `svelte` key since it ships no components.
- **`dependencies`** — collected by reading every shipped member's `deno.json`
  `imports` block, parsing each `npm:pkg@range` specifier, and keeping only the
  ones that (a) aren't in the `DEV_DEPS` set (build/tooling packages like
  `svelte` itself, `tailwindcss`, `@inlang/paraglide-js` — these are peer/dev
  concerns for a _consumer_, not runtime deps of the shipped JS) and (b) aren't
  internal `@rune-lab/*` cross-references (those get collapsed away by
  `build.nu`'s specifier rewrite instead — see §6).

This is why the dependency list in `build/package.json` doesn't match any one
`deno.json` — it's the union across every shipped member, filtered.

---

## 6. What `scripts/build.nu` does after packaging

Runs once, after every `svelte-package` call has already written raw output into
`build/dist`:

1. **Strip i18n build artifacts** — `svelte-package` faithfully copies
   _everything_ under `src`, including the inlang project file, translation
   sources, and `.gitignore` inside the paraglide output directory. None of that
   belongs in a published package; it's deleted.
2. **Strip all `*.test.*` files** — tests live next to source (Deno convention)
   but must never ship.
3. **Per-file rewrite pass** (`patch-file`), across every remaining `.js` /
   `.ts` / `.svelte` file:
   - `from "./foo.ts"` → `from "./foo.js"` — TS source imports its siblings with
     `.ts` extensions (correct for Deno), but a published npm package must
     reference the compiled `.js`.
   - `@rune-lab/core` → `rune-lab/core`, `@rune-lab/svelte` → `rune-lab`, etc. —
     the workspace's internal source-alias names get rewritten to the names a
     real npm consumer would actually import. This is the single mechanism that
     makes the _published_ package self-consistent even though every source file
     was written against workspace aliases.
   - Strips any leftover dev-time
     `import pkgConfig from ".../deno.json" with
     { type: "json" }` and
     replaces `pkgConfig.version` with the version string inlined as a literal —
     so the shipped JS has no import of a file that won't exist in
     `node_modules`.
4. **Verification gates** — for every entry in `build/package.json`'s `exports`,
   confirm the `types` target and `default`/`svelte` target actually exist on
   disk. This is what turns "the manifest _says_ there's a `./layout` export"
   into "there is provably a file there." A plugin added to `BUILD_PLUGINS` but
   never actually packaged (or packaged to the wrong path) fails the build here,
   loudly, instead of shipping broken.

## 7. Post-`build.nu` gates in the `build` recipe

Two `ripgrep` checks run after `build.nu` returns:

- **Specifier-leak gate** — `rg "@rune-lab" build/` must find nothing. If it
  does, some file's `@rune-lab/*` import survived the rewrite pass unrewritten,
  which would mean a real consumer's `npm install` produces a package that
  references packages by names that don't exist on the registry.
- **Augmentation-survival gate** — `rg "@rune-lab/core" build/dist/`
  specifically, as a narrower belt-and-suspenders check on the most
  commonly-imported internal package.

Both exist because the rewrite regexes in `patch-file` are string patterns, not
a real specifier parser — a gate that fails loudly on any miss is cheaper than
auditing every file by hand.

---

## 8. Why `pretext` must be imported by its real name

`layout`'s `deno.json` aliases the vanity name `pretext` to
`npm:@chenglou/pretext`. That alias is a **Deno import-map convenience** — it
has no equivalent once the file ships as plain JS in an npm package.
`patch-file`'s rewrite list only knows about `@rune-lab/*` names; it has no rule
for `pretext`, so `import * as pretext from "pretext"` ships into `build/dist`
**unrewritten**, while `manifest.ts` (correctly) lists the real dependency as
`@chenglou/pretext`. A consumer's `npm install` then has a `pretext` import with
nothing on the npm registry actually named that.

Fix: import `@chenglou/pretext` and `@chenglou/pretext/rich-inline` directly in
`layout/src/text/adapter.ts`, and rename the `deno.json` import key to match.
`@chenglou/pretext` ships full `.d.ts` for both the root export and
`./rich-inline`, so this also resolves the two related `svelte-check` errors in
`src/` with no ambient type declarations needed.

**General rule this implies:** any `deno.json` import alias that renames an npm
package to something other than its published name is invisible to `build.nu`'s
rewriter and will leak into `build/dist` as a broken specifier. Prefer importing
packages by their real names in source.

---

## 9. Why the lab must import `rune-lab`, not `@rune-lab/*`

The lab app used to import `@rune-lab/layout`, `@rune-lab/svelte`, etc. —
correctly resolved by Vite at dev time via `resolve.alias` in the root
`vite.config.ts`, pointing straight at workspace source. But `svelte-check` is a
TypeScript tool: it never reads a Vite alias or a Deno import map. It resolves
specifiers the Node way — `node_modules`, or `paths` in the active tsconfig.
`src/tsconfig.json` has `@rune-lab/*` path mappings (which is why checking
`src/` was clean); the lab's tsconfig, extending the SvelteKit- generated one,
has none. So TypeScript went looking for `node_modules/@rune-lab/layout` — which
has never existed. What _does_ exist, after `just inject`, is
`node_modules/rune-lab` with subpath exports like `rune-lab/layout`. The lab was
asking for a package under a name nobody publishes it under.

This is also a design correction, not just a type-checker workaround: the lab is
supposed to be the _proof_ that the published package works for a real consumer.
A real consumer can never import `@rune-lab/layout` — that name only exists
inside this workspace. So:

1. All lab source now imports `rune-lab` / `rune-lab/layout` /
   `rune-lab/palettes` / etc. — exactly what an external consumer would write.
2. `apps/lab/deno.json` maps `"rune-lab": "npm:rune-lab"` so Deno's resolver
   (which does expand npm subpath exports from a single mapped specifier) can
   find it.
3. The lab's `vite.config.ts` and `layout.css` now apply the exact same two
   steps the published README tells every consumer to apply
   (`ssr.noExternal: ["rune-lab"]`, and the Tailwind `@source` directive pointed
   at `node_modules/rune-lab/dist`). This means the lab now continuously
   validates that the README's installation instructions are correct, rather
   than only asserting it once by hand.

**The trade-off this introduces:** editing `src/packages/*` no longer
hot-reloads the lab through source aliases. As a genuine npm consumer, the lab
only sees changes after `just build && just inject`. That's the accepted cost of
dogfooding the real artifact rather than a source-aliased stand-in.
`just prepare`'s `deno install` step can restore the stale registry copy of
`rune-lab` — re-run `just inject` after any fresh install.

---

## 10. Why paraglide needs `--emit-ts-declarations`

`i18n/src/lang/messages.ts` imports `./paraglide/messages.js` with a
`// @deno-types="./paraglide/messages.d.ts"` pragma. That pragma is a Deno-only
mechanism — plain `tsc`/`svelte-check` ignores it entirely and instead looks for
a **sibling `.d.ts` file next to the `.js`**, the normal Node/TS convention.
Compiling paraglide without `--emit-ts-declarations` produces `messages.js` with
no sibling `.d.ts`, so TypeScript falls back to treating the import as implicit
`any` and flags it. Restoring the flag on the `paraglide` recipe makes the
sibling file exist, which both `src/` and the lab's own generated messages
module depend on.

---

## A note on the newest errors (this is expected, and good)

Once everything above is fixed, `just types` starts surfacing errors like:

```
Type '(ForgedPlugin<"rune-lab.layout", LayoutSlots> | ...)[]' is not
assignable to type 'never'.
```

This is **not a build-pipeline problem** — it's the build pipeline working
exactly as intended. Every error up to this point was the type-checker failing
to _find_ your types at all (missing d.ts, wrong specifier, no resolvable
config). Now it's actually reading real, correctly-generated `ForgedPlugin<...>`
generic types from the injected package and finding a genuine inference mismatch
in how `plugins={[...]}` is typed at the call site. That's an application-level
typing question (likely the `plugins` prop needs an explicit generic parameter,
or the array needs a `satisfies`/`as
const` to stop TypeScript widening it to
`never[]`) — a different, smaller problem, and a sign the plumbing this document
covers is now solid.
