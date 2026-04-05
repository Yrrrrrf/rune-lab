# Rune Lab — Monolith Split: Implementation Plan

## 0. Executive Summary

This plan splits the current `rune-lab` repository from a single SvelteKit
project (where the library and its showcase app are entangled) into two cleanly
separated projects living side-by-side in the same repo. The library
(`src/rune-lab/`) becomes a pure Svelte 5 package managed by **bun**, publishing
to npm. The showcase app (`src/lab/`) becomes an independent SvelteKit
application managed by **Deno**, consuming the library's compiled `dist/`
exactly like any external consumer would. This separation enforces the contract
boundary at build time, eliminates the false `@sveltejs/kit` peer dependency
from the published package, enables runtime-agnostic validation (bun for
library, Deno for app), and sets the foundation for the lab to evolve its own
component library without polluting the published package.

---

## 1. Context & Constraints

**Project context:** Existing single-repo SvelteKit project at ~123 files, ~84k
tokens. Library source lives in `src/lib/`, demo app in `src/routes/`. Build
produces `dist/` via `@sveltejs/package` and publishes to npm as `rune-lab`.

**Goals:**

- Decouple the library (pure Svelte 5) from the showcase app (SvelteKit)
- Library uses `bun` with `package.json`; lab uses `Deno` with `deno.json` (no
  pinned versions)
- Lab consumes the library's `dist/` directory — never raw source
- Library drops `@sveltejs/kit` from peer dependencies
- Library translations (currencies, themes, languages) stay in the library;
  lab-specific translations move to the lab
- Existing tests for the library must keep passing
- Scripts/justfile refinement is explicitly deferred to later

**Out of scope:**

- Writing new tests (only ensure existing ones still pass from `src/rune-lab/`)
- Refactoring justfile recipes (deferred)
- Any changes to the library's internal logic or API surface
- E2E testing of the lab
- CI/CD pipeline changes

**Assumptions:**

- [ASSUMPTION] The lab will use `inject.just` to copy `dist/` into its local
  `node_modules/rune-lab/` during development
- [ASSUMPTION] `@sveltejs/package` requires the source to live under a
  `src/lib/` directory relative to where it's invoked — the library's internal
  structure must preserve this path
- [ASSUMPTION] The published npm package name remains `rune-lab` and the version
  stays at `0.4.6` for this refactor
- [ASSUMPTION] The lab's `deno.json` will use bare `npm:` specifiers without
  version pinning

---

## 2. Architecture Overview

**Before (current):**

```
rune-lab/                     ← one SvelteKit project
├── package.json              ← mixed: library deps + sveltekit deps
├── svelte.config.js          ← sveltekit config (lab concern)
├── vite.config.ts            ← sveltekit + tailwind + paraglide (lab concern)
├── tsconfig.json             ← extends .svelte-kit/tsconfig (lab concern)
├── src/
│   ├── app.html              ← lab concern
│   ├── hooks.server.ts       ← lab concern
│   ├── hooks.ts              ← lab concern
│   ├── lib/                  ← THE LIBRARY
│   │   ├── mod.ts
│   │   ├── RuneProvider.svelte
│   │   ├── i18n/             ← mixed: library translations + lab translations
│   │   ├── kernel/
│   │   └── runes/
│   └── routes/               ← THE LAB (showcase app)
```

**After (target):**

```
rune-lab/                         ← repo root
├── LICENSE
├── README.md
├── justfile
├── .gitignore
├── docs/
├── scripts/
│   ├── ci.just
│   ├── deploy.just
│   ├── dev.just
│   └── inject.just
│
├── src/rune-lab/                 ← THE LIBRARY (bun)
│   ├── package.json              ← bun-managed, svelte peer only
│   ├── src/
│   │   └── lib/                  ← required by @sveltejs/package
│   │       ├── mod.ts
│   │       ├── RuneProvider.svelte
│   │       ├── i18n/
│   │       │   ├── message-resolver.ts
│   │       │   ├── message-resolver.test.ts
│   │       │   ├── project.inlang/
│   │       │   │   └── settings.json
│   │       │   └── translations/
│   │       │       ├── en.json   ← library-intrinsic keys ONLY
│   │       │       ├── es.json
│   │       │       └── ...13 locale files
│   │       ├── kernel/
│   │       │   └── src/
│   │       │       ├── mod.ts
│   │       │       ├── actions/
│   │       │       ├── context/
│   │       │       ├── persistence/
│   │       │       ├── registry/
│   │       │       └── tokens/
│   │       └── runes/
│   │           ├── layout/
│   │           ├── palettes/
│   │           └── plugins/
│   └── dist/                     ← build output (git-ignored)
│
├── src/lab/                      ← THE LAB (deno + sveltekit)
│   ├── deno.json                 ← deno-managed, no pinned versions
│   ├── svelte.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── static/
│   │   └── attributions.md
│   └── src/
│       ├── app.html
│       ├── app.d.ts
│       ├── hooks.server.ts
│       ├── hooks.ts
│       ├── lib/
│       │   └── i18n/             ← lab-specific translations + paraglide config
│       │       ├── project.inlang/
│       │       │   └── settings.json
│       │       └── translations/
│       │           ├── en.json   ← lab-specific keys ONLY
│       │           ├── es.json
│       │           └── ...13 locale files
│       └── routes/
│           ├── +layout.svelte
│           ├── +layout.ts
│           ├── +page.svelte
│           ├── AppLayout.svelte
│           ├── InteractionDeck.svelte
│           ├── LabHeader.svelte
│           ├── layout.css
│           ├── PersistenceInspector.svelte
│           ├── StoresMirror.svelte
│           ├── panels/
│           │   ├── DashboardPanel.svelte
│           │   └── ShortcutsPanel.svelte
│           └── showcase/
│               ├── shared.ts
│               ├── Showcase.svelte
│               ├── ShowcaseCard.svelte
│               ├── state.svelte.ts
│               └── tabs/
│                   ├── Actions.svelte
│                   ├── DataInput.svelte
│                   ├── Display.svelte
│                   ├── Feedback.svelte
│                   ├── Navigation.svelte
│                   └── Visual.svelte
```

**Data flow at dev time:**

```
[src/rune-lab/]                    [src/lab/]
      │                                 │
      │  bun run build                  │
      │  (@sveltejs/package)            │
      ▼                                 │
   dist/  ──── inject.just ────►  node_modules/rune-lab/
                                        │
                                   deno task dev
                                   (sveltekit dev server)
```

---

## 3. Design Patterns & Code Standards

### Pattern: Package Boundary as Contract

**What:** The library exposes a single entry point (`dist/mod.js`) with
TypeScript declarations. The lab never imports source files — only the compiled
package.

**Why:** This is the same boundary any npm consumer hits. By forcing the lab
through the same door, you catch packaging bugs (missing exports, broken
`.ts → .js` rewrites, missing declarations) before publish. At year 3, when the
library has dozens of external consumers, you'll have confidence because you've
been testing the real artifact all along.

**How it's applied:** The lab's `deno.json` declares `rune-lab` as an npm
dependency. The `inject.just` script physically overwrites
`node_modules/rune-lab/` with the freshly built `dist/` plus `package.json`. No
Vite aliases, no workspace protocols, no symlinks.

**Standards to enforce:**

- The lab must NEVER import from `../rune-lab/src/` — only from `"rune-lab"`
- The library must NEVER import from `@sveltejs/kit`, `$app/`, or any
  SvelteKit-specific module
- All library exports go through `src/lib/mod.ts` — no side-channel exports

### Pattern: Translation Domain Separation

**What:** Two independent paraglide projects with separate translation domains.

**Why:** The library's translations are intrinsic (currency names, theme names,
language labels) — they ship with the package. The lab's translations are
presentational (dashboard labels, inspector UI, section headers) — they exist
only for the showcase. Mixing them means every consumer inherits lab-specific
i18n keys they'll never use, and the library's build wastes time compiling
translations that aren't its responsibility.

**How it's applied:** Each project has its own `project.inlang/settings.json`
and its own `translations/` directory. The library's paraglide compiles during
`@sveltejs/package` build. The lab's paraglide compiles during Vite dev/build
via the paraglide Vite plugin.

**Standards to enforce:**

- Library translation keys: currencies, themes, languages, and generic UI labels
  used by library components (e.g., `all_themes`, `all_currencies`)
- Lab translation keys: dashboard-specific labels (`live_store_dashboard`,
  `api_status`, `commands_label`, `app_info`, etc.)
- If a key is only used in `src/lab/src/routes/`, it belongs in the lab
  translations
- If a key is used by components in `src/rune-lab/src/lib/runes/`, it belongs in
  the library translations

---

## 4. Component Map & Directory Structure

### Component: `src/rune-lab/` — The Library

**Responsibility:** Publishable Svelte 5 UI shell framework with kernel
(context, persistence, registry), layout runes, palette runes (commands,
shortcuts, notifications), money plugin, and i18n utilities.

**Location:** `src/rune-lab/`

**Interfaces exposed:** Single barrel export at `src/lib/mod.ts` re-exporting:

- `RuneProvider` (Svelte component)
- All kernel exports (context, stores, persistence drivers, registry, actions,
  tokens)
- All layout exports (WorkspaceLayout, NavigationPanel, ThemeSelector, etc.)
- All palette exports (CommandPalette, ShortcutPalette, Toaster, etc.)
- All money exports (MoneyDisplay, MoneyInput, CurrencySelector, useMoney, etc.)
- `version()` function

**Dependencies consumed:** `svelte` (peer), `esm-env`, `hotkeys-js`, `daisyui`,
`dinero.js`

**What it must NOT do:**

- Import from `@sveltejs/kit` or `$app/*`
- Reference any file outside `src/rune-lab/`
- Contain any SvelteKit route files (`+page`, `+layout`, `+server`, etc.)
- Contain lab-specific translation keys

### Component: `src/lab/` — The Showcase App

**Responsibility:** SvelteKit application that demonstrates every feature of the
rune-lab library. Serves as living documentation, visual regression testbed, and
dogfooding environment.

**Location:** `src/lab/`

**Interfaces exposed:** None (it's an application, not a library). Produces a
static site via `adapter-static`.

**Dependencies consumed:** `rune-lab` (via npm/inject), `@sveltejs/kit`,
`@sveltejs/adapter-static`, `@tailwindcss/vite`, `@inlang/paraglide-js`, `vite`,
`tailwindcss`, `daisyui`

**What it must NOT do:**

- Import from `../rune-lab/src/` (always use the `"rune-lab"` specifier)
- Define components that should be part of the published library
- Modify the library's `dist/` directory

---

## 5. Trade-off Analysis

```
DECISION: How the lab references the library at dev time
OPTIONS CONSIDERED:
  A. Vite alias pointing to source (../rune-lab/src/lib/mod.ts)
     — Pro: instant HMR, no rebuild cycle
     — Con: hides packaging bugs, couples the projects at dev time
  B. inject.just copies dist/ into node_modules/rune-lab/
     — Pro: tests the real artifact, catches packaging errors early
     — Con: requires rebuild on every library change
  C. npm/bun workspace protocol
     — Pro: native tooling support
     — Con: can't use with deno.json on the lab side, mixed runtime complexity
CHOSEN: B (inject.just)
REASON: The user's existing inject.just pattern already solves this cleanly.
  The rebuild cost is small (~seconds for @sveltejs/package) and the
  correctness guarantee is worth it. You catch real bugs this way.
REVISIT IF: The library grows large enough that rebuild time becomes painful
  (>30s), at which point a hybrid approach (alias for dev, inject for CI)
  might be worth it.
```

```
DECISION: Lab dependency manifest format
OPTIONS CONSIDERED:
  A. package.json with bun (same as library)
     — Pro: uniform tooling
     — Con: doesn't validate cross-runtime compatibility
  B. deno.json with no pinned versions
     — Pro: validates that the library works under Deno's npm resolution,
       ensures no bun-specific assumptions leak into the published package
     — Con: less familiar tooling for some, version resolution less predictable
CHOSEN: B (deno.json)
REASON: The explicit goal is cross-runtime validation. If the lab works under
  Deno, it'll work anywhere. No pinned versions means you always test against
  latest, catching upstream breakage early.
REVISIT IF: Deno's npm compatibility regresses for SvelteKit projects, or if
  the team grows and tooling familiarity becomes a blocker.
```

```
DECISION: How to split translations between library and lab
OPTIONS CONSIDERED:
  A. Keep all translations in the library, lab imports them
     — Pro: single source of truth
     — Con: library ships lab-specific keys, consumers get junk they don't need
  B. Split: library keeps intrinsic keys, lab owns its own
     — Pro: clean separation, smaller published package, each project owns its i18n
     — Con: some keys need judgment calls on where they belong, two paraglide configs
  C. Lab has no translations, uses hardcoded English
     — Pro: simplest
     — Con: can't validate that the library's i18n system works with a real multilingual app
CHOSEN: B (split)
REASON: The whole point of the lab is to prove the library works — including its
  i18n system. The lab needs its own translations to be a real consumer. And the
  published package shouldn't carry dashboard labels that no external app will ever use.
REVISIT IF: The translation split creates too much duplication. If many keys are
  genuinely needed in both contexts, consider a shared base + overrides pattern.
```

```
DECISION: Library's internal src/ structure
OPTIONS CONSIDERED:
  A. Flatten: src/rune-lab/src/mod.ts (no lib/ subdirectory)
     — Pro: simpler nesting
     — Con: @sveltejs/package requires src/lib/ path convention to work
  B. Preserve: src/rune-lab/src/lib/mod.ts
     — Pro: @sveltejs/package works out of the box with `-i src -o dist`
     — Con: deeper nesting (src/rune-lab/src/lib/)
CHOSEN: B (preserve src/lib/)
REASON: @sveltejs/package is opinionated about the input directory structure.
  Fighting it creates fragile build scripts. The extra nesting level is cosmetic.
REVISIT IF: @sveltejs/package adds support for custom entry points, or if the
  library migrates to a different build tool.
```

---

## 6. Phased Implementation Plan

### Phase 1 — Scaffold the New Directory Structure

**Goal:** Create the target directory layout with empty placeholder files. No
logic changes yet.

**Steps:**

1. **Create the `src/rune-lab/` directory:**
   ```
   mkdir -p src/rune-lab/src/lib
   ```

2. **Create the `src/lab/` directory:**
   ```
   mkdir -p src/lab/src/lib/i18n/project.inlang
   mkdir -p src/lab/src/lib/i18n/translations
   mkdir -p src/lab/src/routes
   mkdir -p src/lab/static
   ```

3. **Create `src/rune-lab/package.json`** with the following shape:
   - `name`: `"rune-lab"`
   - `version`: `"0.4.6"`
   - `description`: same as current
   - `type`: `"module"`
   - `license`: `"MIT"`
   - `author`: same as current
   - `repository`: same as current
   - `exports`:
     `{ ".": { "svelte": "./dist/mod.js", "types": "./dist/mod.d.ts", "default": "./dist/mod.js" } }`
   - `files`: `["dist"]`
   - `peerDependencies`: **ONLY** `"svelte": "npm:svelte"` — remove
     `@sveltejs/kit` and `@inlang/paraglide-js`
   - `dependencies`: `esm-env`, `hotkeys-js`, `daisyui`, `dinero.js` (same as
     current)
   - `devDependencies`: `@sveltejs/package`, `svelte`, `typescript`, `vite`,
     `vite-plus`, `@sveltejs/vite-plugin-svelte`, `jsdom`,
     `@testing-library/jest-dom`
   - `keywords`: same as current
   - `exclude`: `[".*", "scripts/**", "dist/**", "**/*.test.ts"]`

4. **Create `src/lab/deno.json`** with the following shape:
   - `tasks`:
     `{ "dev": "deno run -A npm:vite dev", "build": "deno run -A npm:vite build", "preview": "deno run -A npm:vite preview" }`
   - `imports`: `{ "rune-lab": "npm:rune-lab" }` — no version pinned
   - `nodeModulesDir`: `"auto"` — so Deno creates a `node_modules/` that
     inject.just can write to
   - `compilerOptions`:
     `{ "lib": ["ESNext", "DOM", "DOM.Iterable", "DOM.AsyncIterable"] }`
   - npm dependencies listed via `imports` or `nodeModulesDir` resolution:
     `@sveltejs/kit`, `@sveltejs/adapter-static`, `@tailwindcss/vite`,
     `@inlang/paraglide-js`, `vite`, `tailwindcss`, `daisyui`, `svelte`

**Exit criteria:** Both directories exist. `package.json` and `deno.json` are
syntactically valid. No files have moved yet.

---

### Phase 2 — Move the Library Source

**Goal:** Relocate all library source files into `src/rune-lab/src/lib/` with
zero logic changes.

**Steps:**

1. **Move the entire `src/lib/` tree into `src/rune-lab/src/lib/`:**
   - `src/lib/mod.ts` → `src/rune-lab/src/lib/mod.ts`
   - `src/lib/RuneProvider.svelte` → `src/rune-lab/src/lib/RuneProvider.svelte`
   - `src/lib/i18n/` → `src/rune-lab/src/lib/i18n/` (entire directory)
   - `src/lib/kernel/` → `src/rune-lab/src/lib/kernel/` (entire directory)
   - `src/lib/runes/` → `src/rune-lab/src/lib/runes/` (entire directory)

2. **Update `src/rune-lab/src/lib/mod.ts`:**
   - The `import pkgConfig from "../../package.json"` path needs to change to
     `"../../package.json"` — this should still resolve correctly because the
     `package.json` is at `src/rune-lab/package.json` and `mod.ts` is at
     `src/rune-lab/src/lib/mod.ts`, so the relative path `../../package.json`
     still works (two levels up from `src/lib/` lands at `src/rune-lab/`).
     **Verify this resolves correctly.**

3. **Verify: no file inside `src/rune-lab/src/lib/` imports from `@sveltejs/kit`
   or `$app/`.** Run a grep across the moved files:
   ```
   grep -r "@sveltejs/kit\|\\$app/" src/rune-lab/src/lib/
   ```
   This should return zero results. If it does return results, those imports are
   bugs that need fixing (they shouldn't exist in the library).

**Exit criteria:** All library source is under `src/rune-lab/src/lib/`. The old
`src/lib/` is empty or deleted. No import paths inside the library are broken
(all relative imports are internal, so they remain valid).

---

### Phase 3 — Move the Lab Source

**Goal:** Relocate all lab/showcase files into `src/lab/` with minimal import
path updates.

**Steps:**

1. **Move SvelteKit config files into `src/lab/`:**
   - `svelte.config.js` → `src/lab/svelte.config.js`
   - `vite.config.ts` → `src/lab/vite.config.ts`
   - `tsconfig.json` → `src/lab/tsconfig.json`

2. **Move SvelteKit app shell files into `src/lab/src/`:**
   - `src/app.html` → `src/lab/src/app.html`
   - `src/app.d.ts` → `src/lab/src/app.d.ts`
   - `src/hooks.server.ts` → `src/lab/src/hooks.server.ts`
   - `src/hooks.ts` → `src/lab/src/hooks.ts`

3. **Move routes into `src/lab/src/routes/`:**
   - `src/routes/*` → `src/lab/src/routes/*` (entire directory tree, preserving
     structure)

4. **Move static assets:**
   - `static/attributions.md` → `src/lab/static/attributions.md`
   - Any other static assets (favicon, images) → `src/lab/static/`

5. **Update `src/lab/vite.config.ts`:**
   - **Remove** the `rune-lab` resolve alias entirely (the lab uses the real
     package now via `node_modules/`)
   - Update the paraglide plugin `project` path to point to the lab's own inlang
     project: `"./src/lib/i18n/project.inlang"`
   - Update the paraglide plugin `outdir` to: `"./src/lib/i18n/paraglide"`
   - Keep `sveltekit()` and `tailwindcss()` plugins as-is
   - Remove the `server.fs.allow` entry for `package.json` (no longer needed —
     the lab doesn't read the library's package.json at runtime)
   - Keep the `test` config if you want lab-level tests later, or remove it for
     now

6. **Update `src/lab/svelte.config.js`:**
   - **Remove** the `alias` block that mapped `"rune-lab"` to `"src/lib/mod.ts"`
     — the lab resolves `"rune-lab"` from `node_modules/` now
   - Keep the `adapter: adapter()` config

7. **Update `src/lab/tsconfig.json`:**
   - It currently extends `.svelte-kit/tsconfig.json` — this continues to work
     because SvelteKit generates it relative to the project root (`src/lab/`)

8. **Update `src/lab/src/hooks.server.ts`:**
   - The import `from "./lib/i18n/paraglide/server.js"` — this still works
     because the lab will have its own paraglide output at
     `src/lab/src/lib/i18n/paraglide/`

9. **Update `src/lab/src/hooks.ts`:**
   - The import `from "./lib/i18n/paraglide/runtime.js"` — same as above, still
     works

10. **Update `src/lab/src/routes/+layout.svelte`:**
    - The import `from "rune-lab"` — **no change needed**, it resolves from
      `node_modules/`
    - The import `from "../lib/i18n/paraglide/runtime.js"` — **no change
      needed**, relative path still valid within the lab's structure
    - The import `from "./AppLayout.svelte"` — **no change needed**, still a
      sibling

11. **Update `src/lab/src/routes/layout.css`:**
    - The `@source` directive currently reads
      `"../../node_modules/rune-lab/dist"` — update the path if the relative
      distance to `node_modules/` changes. From `src/lab/src/routes/layout.css`,
      the path to `src/lab/node_modules/rune-lab/dist` would be
      `"../../node_modules/rune-lab/dist"`. **Verify this resolves correctly.**
      If the lab's `node_modules/` is at `src/lab/node_modules/`, this is three
      levels up from `routes/`: `../../../node_modules/rune-lab/dist`.

    Actual path calculation: `src/lab/src/routes/layout.css` → go up 3 dirs →
    `src/lab/` → then `node_modules/rune-lab/dist`. So:
    `"../../../node_modules/rune-lab/dist"`.

**Exit criteria:** All lab files are under `src/lab/`. The old `src/routes/`,
`src/app.html`, `src/hooks.*`, `svelte.config.js`, `vite.config.ts`,
`tsconfig.json` are deleted from the repo root. The old `src/` directory (at
repo root) contains only `rune-lab/` and `lab/`.

---

### Phase 4 — Split the Translations

**Goal:** Separate library-intrinsic i18n keys from lab-specific i18n keys.

**Steps:**

1. **Identify which keys belong where.** Here's the classification for the
   English file as reference — apply the same split to all 13 locale files:

   **Library keys** (stay in `src/rune-lab/src/lib/i18n/translations/*.json`):
   - Language names: `de`, `en`, `es`, `fr`, `it`, `pt`, `ru`, `hi`, `ar`, `zh`,
     `ja`, `ko`, `vi`
   - Currency names: `USD`, `EUR`, `MXN`, `CNY`, `JPY`, `KRW`, `AED`, `GBP`,
     `CAD`, `BRL`, `INR`
   - Theme names: `light`, `dark`, `system`, `cupcake`, `bumblebee`, `emerald`,
     `corporate`, `synthwave`, `retro`, `cyberpunk`, `valentine`, `halloween`,
     `garden`, `forest`, `aqua`, `lofi`, `pastel`, `fantasy`, `wireframe`,
     `black`, `luxury`, `dracula`, `cmyk`, `autumn`, `business`, `acid`,
     `lemonade`, `night`, `coffee`, `winter`, `dim`, `nord`, `sunset`,
     `caramellatte`, `abyss`, `silk`
   - Generic category labels used by library components: `languages`,
     `currency`, `theme`, `themes`, `all_themes`, `all_currencies`,
     `all_languages`
   - The `hello_world` key (used in examples/tests)

   **Lab keys** (move to `src/lab/src/lib/i18n/translations/*.json`):
   - `extended_controls`
   - `live_store_dashboard`
   - `real_time_monitor_desc`
   - `api_status`
   - `active_toasts`
   - `commands_label`
   - `app_info`
   - `appearance`
   - `localization`
   - `name_label`
   - `version_label`
   - `current_theme`
   - `current_language`
   - `current_currency`
   - `state_label`
   - `url_label`
   - `currently_in_queue`
   - `registered_in_registry`

2. **For each of the 13 locale files** (`ar`, `de`, `en`, `es`, `fr`, `hi`,
   `it`, `ja`, `ko`, `pt`, `ru`, `vi`, `zh`):
   - Edit `src/rune-lab/src/lib/i18n/translations/{locale}.json`: remove all lab
     keys listed above
   - Create `src/lab/src/lib/i18n/translations/{locale}.json`: contains only the
     lab keys listed above, plus the `$schema` line

3. **Create `src/lab/src/lib/i18n/project.inlang/settings.json`:**
   - Copy from the library's `settings.json`
   - Same `baseLocale`, same `locales`, same `modules`
   - Update `pathPattern` to: `"./translations/{locale}.json"`

4. **Verify:** The library's `project.inlang/settings.json` still points to its
   own translations directory. The `pathPattern` should be
   `"./translations/{locale}.json"` — since it's relative to the
   `project.inlang/` directory, this should still work.

**Exit criteria:** Every locale file exists in both projects. Library files
contain only library keys. Lab files contain only lab keys. No key is duplicated
across both. The `$schema` line is present in every JSON file.

---

### Phase 5 — Verify the Library Builds and Tests Pass

**Goal:** Confirm that `src/rune-lab/` can build independently and all existing
tests pass.

**Steps:**

1. **Navigate to `src/rune-lab/` and install dependencies:**
   ```
   cd src/rune-lab && bun install
   ```

2. **Compile paraglide for the library:**
   ```
   bun run -b @inlang/paraglide-js compile --project ./src/lib/i18n/project.inlang --outdir ./src/lib/i18n/paraglide
   ```
   (The `-b` flag tells bun to run a binary from node_modules.)

   **Note:** You may need `@inlang/paraglide-js` in devDependencies for this.
   Add it if missing:
   ```json
   "devDependencies": {
     "@inlang/paraglide-js": "npm:@inlang/paraglide-js",
     ...
   }
   ```

3. **Build the library package:**
   ```
   bun run -b @sveltejs/package -- -i src -o dist
   ```
   This reads `src/lib/` and outputs compiled files to `dist/`.

4. **Run the post-build cleanup steps** (from the current `deploy.just`):
   - Remove `dist/i18n/project.inlang`, `dist/i18n/translations`,
     `dist/i18n/paraglide/.gitignore`
   - Remove test files from dist: `fd -e test.js . dist/i18n -x rm {}`
   - Rewrite `.ts` → `.js` in import paths across dist
   - Inject the package version string (replace `pkgConfig.version` references)
   - Remove `.svelte-kit/__package__` if it exists
   - Format dist: `deno fmt --no-config dist`

5. **Run existing tests:**
   ```
   cd src/rune-lab && bun test
   ```
   Or via vite-plus: configure a `vite.config.ts` in `src/rune-lab/` for test
   purposes only (minimal — just the test config block, no sveltekit plugin).

   Create `src/rune-lab/vite.config.ts` — a minimal config for testing only:
   - `test.environment`: `"jsdom"`
   - `test.setupFiles`: `["@testing-library/jest-dom/vitest"]`
   - No sveltekit plugin, no tailwind, no paraglide — this is library-level unit
     testing only

   Then run: `bun run vite-plus test` or `bunx vite-plus test`

6. **Verify the dist/ output:**
   - `dist/mod.js` exists
   - `dist/mod.d.ts` exists
   - No `.ts` extensions remain in import statements inside `dist/`
   - No `import pkgConfig from` statements remain (should be replaced with
     version string literal)
   - `dist/i18n/paraglide/` exists with compiled message functions

**Exit criteria:** `bun install` succeeds. Build produces a valid `dist/`. All
existing tests (message-resolver, persistence drivers, persistence provider,
registry, currency, exchange-rate, money-primitive, money, strategies) pass. The
dist/ artifact is structurally identical to what the current build produces.

**Risk flags:**

- [REVISIT] The `@sveltejs/package` tool might expect a `svelte.config.js` in
  the project root. If it does, create a minimal one in `src/rune-lab/` with no
  adapter (the library doesn't need one — only the `kit.alias` might be needed
  if internal imports reference it, but they shouldn't since all imports are
  relative).
- [REVISIT] The paraglide compile step currently runs from the repo root. Paths
  in `settings.json` are relative to the `project.inlang/` directory, so this
  should still work from `src/rune-lab/`, but verify.

---

### Phase 6 — Wire Up the Lab

**Goal:** Make the lab's SvelteKit dev server boot and render the showcase using
the library's `dist/`.

**Steps:**

1. **Install lab dependencies with Deno:**
   ```
   cd src/lab && deno install
   ```
   This creates `src/lab/node_modules/` based on `deno.json` imports.

2. **Inject the library:**
   ```
   just -f ../../scripts/inject.just inject $PWD
   ```
   (Or adjust the inject.just path as needed for the new layout.)

   This copies `src/rune-lab/dist/` and `src/rune-lab/package.json` into
   `src/lab/node_modules/rune-lab/`.

3. **Compile the lab's paraglide:** The `vite.config.ts` paraglide plugin
   handles this automatically during dev/build. But verify the paths:
   - `project`: `"./src/lib/i18n/project.inlang"`
   - `outdir`: `"./src/lib/i18n/paraglide"`

4. **Start the lab dev server:**
   ```
   deno task dev
   ```

5. **Verify:**
   - The SvelteKit app boots without errors
   - The layout renders (WorkspaceLayout, NavigationPanel, etc.)
   - Theme switching works
   - Language switching works (both library component labels and lab-specific
     labels translate)
   - Command palette opens with `Ctrl+K`
   - Shortcuts palette opens with `Ctrl+/`
   - Money components render
   - Persistence inspector shows stored values
   - The showcase tab panels all render

6. **Fix any import path issues.** Common things to check:
   - `layout.css` `@source` path to `node_modules/rune-lab/dist`
   - Any route component that imported from `"../lib/i18n/paraglide/runtime.js"`
     — verify the lab's paraglide output is where the import expects it
   - The `hooks.server.ts` import of `paraglideMiddleware` — verify the lab's
     paraglide server output exists

**Exit criteria:** `deno task dev` boots. All showcase panels render. Theme,
language, and currency switching work. No console errors related to missing
imports or broken resolution.

---

### Phase 7 — Clean Up the Repo Root

**Goal:** Remove all orphaned files from the repo root that have been relocated.

**Steps:**

1. **Delete from repo root:**
   - `src/lib/` (moved to `src/rune-lab/src/lib/`)
   - `src/routes/` (moved to `src/lab/src/routes/`)
   - `src/app.html` (moved to `src/lab/src/`)
   - `src/app.d.ts` (moved to `src/lab/src/`)
   - `src/hooks.server.ts` (moved to `src/lab/src/`)
   - `src/hooks.ts` (moved to `src/lab/src/`)
   - `svelte.config.js` (moved to `src/lab/`)
   - `vite.config.ts` (moved to `src/lab/`)
   - `tsconfig.json` (moved to `src/lab/`)
   - `package.json` (replaced by `src/rune-lab/package.json`)

2. **Keep at repo root:**
   - `LICENSE`
   - `README.md`
   - `justfile`
   - `.gitignore`
   - `scripts/`
   - `docs/` (create if it doesn't exist)

3. **Update `.gitignore`** to cover:
   - `src/rune-lab/dist/`
   - `src/rune-lab/node_modules/`
   - `src/rune-lab/src/lib/i18n/paraglide/` (generated)
   - `src/lab/node_modules/`
   - `src/lab/.svelte-kit/`
   - `src/lab/build/`
   - `src/lab/src/lib/i18n/paraglide/` (generated)

4. **Update `README.md`** to reflect the new structure. The installation
   instructions for consumers don't change (they still `npm install rune-lab`).
   Add a "Development" section explaining the two-project layout and the
   build→inject→dev workflow.

**Exit criteria:** The repo root is clean. Only shared/meta files remain at root
level. Both `src/rune-lab/` and `src/lab/` are self-contained. `git status`
shows only the intended structural changes.

---

## 7. Implementation Management

**Sequencing (dependency graph):**

```
Phase 1 (scaffold)
    │
    ├──► Phase 2 (move library)
    │        │
    │        └──► Phase 5 (verify library builds + tests)
    │
    └──► Phase 3 (move lab)
             │
             └──► Phase 4 (split translations)
                      │
                      └──► Phase 6 (wire up lab)
                               │
                               └──► Phase 7 (cleanup)
```

Phases 2 and 3 can technically be done in parallel, but it's safer to do Phase 2
first so you can verify the library independently (Phase 5) before the lab tries
to consume it (Phase 6).

**Critical path:** Phase 2 → Phase 5 → Phase 6. If the library doesn't build
cleanly, nothing else works.

**Breaking changes:**

- [HIGH RISK] Deleting the root `package.json` means any existing dev workflow
  that runs `bun install` or `npm install` from root will break. This is
  intentional but be aware.
- [HIGH RISK] The root `tsconfig.json` disappears. Any editor/IDE integration at
  root level will lose type-checking until you open the project from within
  `src/lab/` or `src/rune-lab/`.
- [REVISIT] The `inject.just` paths will need updating for the new directory
  layout. The current script references `justfile_directory()/../dist` which
  assumes `scripts/` is one level below the library root. After the split, the
  dist is at `src/rune-lab/dist/`, so the inject script needs to know this new
  path. **Defer this to your scripts cleanup pass.**

---

## 8. Validation & Testing Strategy

| Layer               | Test Type                                                                                                  | What it verifies                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Library i18n        | Unit (message-resolver.test.ts)                                                                            | Translation resolution, key extraction, batch resolve                           |
| Library persistence | Unit (drivers.test.ts, provider.test.ts)                                                                   | Cookie/localStorage/sessionStorage drivers, provider initialization             |
| Library registry    | Unit (registry.test.ts)                                                                                    | Plugin registration, topological sort, dependency resolution                    |
| Library money       | Unit (currency.test.ts, exchange-rate.test.ts, money.test.ts, money-primitive.test.ts, strategies.test.ts) | Currency operations, exchange rate triangulation, money arithmetic, formatting  |
| Package build       | Build verification                                                                                         | dist/ output has correct exports, no .ts extensions, version injected           |
| Lab integration     | Manual (for now)                                                                                           | SvelteKit boots, all components render, theme/language/currency switching works |

**Local dev validation workflow:**

1. `cd src/rune-lab && bun install && bun test` — library tests pass
2. `cd src/rune-lab && bun run build` (or the equivalent build recipe) — dist/
   produced
3. `cd src/lab && deno install` — lab dependencies resolved
4. From `src/lab/`: `just -f ../../scripts/inject.just inject $PWD` — dist
   injected
5. `cd src/lab && deno task dev` — lab boots, manual smoke test

---

## 9. Open Questions & Risks

1. **`@sveltejs/package` config expectations:** Does it need a
   `svelte.config.js` in the project root to function? If yes, create a minimal
   one in `src/rune-lab/` with no adapter. This needs to be tested in Phase 5.
   If it fails, the fix is straightforward — add a minimal config file.

2. **Paraglide compile from new path:** The `project.inlang/settings.json` uses
   relative paths for the translation files. Since the entire `i18n/` directory
   moves intact (preserving the relative relationship between `project.inlang/`
   and `translations/`), this should work. But verify during Phase 5.

3. **Deno + SvelteKit compatibility:** Deno's npm compatibility is good but not
   perfect. SvelteKit's dev server and build process involve complex Vite plugin
   interactions. If Deno chokes on something, the fallback is to temporarily use
   `bun` for the lab as well and revisit Deno later. [REVISIT]

4. **Lab translation imports:** After the split, lab components need to import
   from the lab's own paraglide output, not the library's. Currently, routes
   import from `"../lib/i18n/paraglide/runtime.js"`. After the move, this path
   resolves to `src/lab/src/lib/i18n/paraglide/runtime.js` — which is correct as
   long as the lab's paraglide compiles to that location. Verify in Phase 6.

5. **`inject.just` path adjustments:** The current script assumes the `dist/`
   and `package.json` are at `justfile_directory()/..`. After the split, they're
   at `src/rune-lab/dist/` and `src/rune-lab/package.json`. The inject script
   needs updating, but this is explicitly deferred.

6. **Root-level `package.json` for tooling:** Some tools (Prettier, ESLint,
   editors) look for a root `package.json` or `tsconfig.json`. After deletion,
   you may need a minimal root `tsconfig.json` that references both
   sub-projects, or configure your editor to open from within each sub-project.
   This is a quality-of-life concern, not a blocker.
