# 🚀 Pipeline Architecture & Seamlessness Roadmap

> *Technical analysis and actionable roadmap for elevating the `rune-lab` CI/CD and developer loop from a functional migration to a 10/10 high-performance, seamless harness.*

---

## 🧭 Executive Summary

With the migration to the **4-phase CLI-assisted harness** (`neo-harness`), the workspace now benefits from centralized configurations in [`config/`](file:///home/yrrrrrf/Documents/lab/code/typescript/rune-lab/config), unified task discovery via `dv list` / `dv menu`, and deterministic `cycle: prepare (ci "-vp") build` execution.

However, the pipeline is currently at a **functional baseline (~7/10)**. Five specific friction points prevent it from achieving peak developer velocity and aesthetic polish.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CURRENT HARNESS                                 │
│  [prepare] ➔ [test: core only] ➔ [check: fmt/lint/types] ➔ [build: serial]  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │  Evolutionary Upgrades
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            10/10 SEAMLESS HARNESS                           │
│  • dv rm (auto-cleans shims)                                                │
│  • dv matrix: Vitest + Deno Test (120+ tests concurrently)                  │
│  • dv matrix: Svelte Check + Deno Lint (Parallel Quality Gates)             │
│  • dv batch / -p: Parallel Packaging (14s ➔ 3s)                            │
│  • config/biome.json: Whisper-Quiet Dist Lint Overrides                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ The 5 Friction Points & Seamless Upgrades

### 1. ⚠️ The Phantom Test Suite (Vitest is Orphaned from CI)

* **Current Friction**:
  [`scripts/test.just`](file:///home/yrrrrrf/Documents/lab/code/typescript/rune-lab/scripts/test.just) only executes `deno test` against `src/packages/core` (18 unit tests). The entire Svelte component and plugin test suite (100+ tests across `ui`, `layout`, `palettes`, `i18n`, `observer`) is omitted from `ci`.
* **Root Cause**:
  In [`vite.config.ts`](file:///home/yrrrrrf/Documents/lab/code/typescript/rune-lab/vite.config.ts), `svelte()` is declared at both the root level and within each project in `projects: [...]`. Under Vitest 5+, inline projects extend the root config by default, causing Svelte to compile `.svelte.ts` files twice. The second pass attempts to compile client JS (`import * as $ from 'svelte/internal/client'`), throwing `CompileError: The $ name is reserved`.
* **The Seamless Upgrade**:
  1. Remove duplicate `svelte()` from inline projects in [`vite.config.ts`](file:///home/yrrrrrf/Documents/lab/code/typescript/rune-lab/vite.config.ts) or set `extends: false`.
  2. Wire Vitest directly into `TEST_RULES` in [`scripts/test.just`](file:///home/yrrrrrf/Documents/lab/code/typescript/rune-lab/scripts/test.just):
     ```json
     {
       "packages": "src/packages/*",
       "pattern": "src/packages/**/*.test.ts",
       "engine": "vitest",
       "cwd": "{root}",
       "command": ["deno", "run", "-A", "npm:vitest", "run", "--project", "{name}"]
     }
     ```
  3. **Impact**: All 120+ tests run natively in `dv matrix` with live progress bars, zero permission prompts, and deterministic exit codes.

---

### 2. 💣 The `with-shim` Filesystem Mutation Hazard

* **Current Friction**:
  `svelte-package` and `test-project` temporarily copy [`scripts/shims/package.json`](file:///home/yrrrrrf/Documents/lab/code/typescript/rune-lab/scripts/shims/package.json) to `src/package.json` or `./package.json`. If execution is aborted (`Ctrl+C`, `SIGTERM`, process kill), the `finally` block is bypassed, leaving an untracked `package.json` in the working tree that taints `git status`.
* **The Seamless Upgrade**:
  1. **Immediate Safety**: Add `'package.json'` to the `dv rm` path pattern in `prune`:
     ```just
     prune *flags:
         ^{{ CLI }} rm --glob '**/node_modules' '**/.svelte-kit' '**/.vite' 'build' 'dist' 'coverage' 'package.json' {{ flags }}
     ```
  2. **Architectural Purity**: Provide a virtual manifest via a Vite/Svelte-package loader hook or run packaging inside an isolated ephemeral staging directory, eliminating filesystem mutation in source roots.

---

### 3. 📜 Procedural & Serial Build Packaging

* **Current Friction**:
  In [`scripts/deploy.just`](file:///home/yrrrrrf/Documents/lab/code/typescript/rune-lab/scripts/deploy.just), `build` runs 8 separate sequential commands. Each member (`ui`, `core`, and the four plugins) is compiled one by one:
  ```just
  just svelte-package ui
  just svelte-package core
  "{{ BUILD_PLUGINS }}" | split row " " | each {|p| just svelte-package $"plugins/($p)" } | ignore
  ```
  This serial execution takes **~14 seconds** on modern multi-core machines.
* **The Seamless Upgrade**:
  Use `dv batch` or parallel execution (`-p`) to package independent workspace members concurrently:
  ```just
  [group('deploy')]
  package-all *flags:
      ^{{ CLI }} exec {{ flags }} -p --title PACKAGE --cwd 'src/packages/plugins/*' 'src/packages/ui' 'src/packages/core' -- deno run -A npm:@sveltejs/package -i src -o '{root}/build/dist/{name}'
  ```
  **Impact**: Drops package bundling time from **~14s to ~3–4s**.

---

### 4. 📢 Biome Noise Pollution on Generated Artifacts

* **Current Friction**:
  At the end of `build`, running `biome check --fix ./build` emits **150+ lines of warnings and errors** on generated `.d.ts` declaration files (e.g. Svelte-generated `{}` type signatures and accessibility warnings on pre-compiled templates). Because the recipe uses `-biome`, it ignores the failure, but the console is flooded with noise.
* **The Seamless Upgrade**:
  In [`config/biome.json`](file:///home/yrrrrrf/Documents/lab/code/typescript/rune-lab/config/biome.json), disable the linter for compiled artifacts while preserving formatting:
  ```json
  "overrides": [
    {
      "includes": ["build/**", "**/paraglide/**"],
      "linter": {
        "enabled": false
      }
    }
  ]
  ```
  **Impact**: `build` remains fully verified and formatted without dumping 150 lines of static analysis noise into the terminal.

---

### 5. 🎨 Unified Terminal Cadence & Visual Rhythm

* **Current Friction**:
  `just check` and `just test` render rich `dv` UI cards (`◆ FMT`, `◆ LINT`, `◆ TYPES`, `◆ TEST`). However, `just build` falls back to unformatted raw Nushell prints (`Patching build/dist...`, `verified export '.'...`).
* **The Seamless Upgrade**:
  Wrap build verification stages in `dv exec`:
  ```just
  build:
      ^{{ CLI }} rm --paths '["build"]'
      ^{{ CLI }} exec --title BUILD --label "Generate Manifest" -- deno run -A scripts/manifest.ts {{ BUILD_PLUGINS }}
      just _paraglide ...
      just package-all -p
      ^{{ CLI }} exec --title BUILD --label "Patch Distribution" -- nu scripts/build.nu
      ^{{ CLI }} exec --title BUILD --label "Format Artifacts" -- biome format --config-path=config/biome.json --write ./build
  ```
  **Impact**: End-to-end visual harmony with live timers, progress bars, and zero screen tearing across all `cycle` phases.

---

## 📊 Comparison Matrix

| Quality Dimension | Baseline Migration (Current) | 10/10 Seamless State |
| :--- | :--- | :--- |
| **Component Test Coverage** | ❌ Omitted from CI | ✅ 120+ tests executed in `dv matrix` |
| **Packaging Duration** | ⏳ ~14s (serial loop) | ⚡ ~3–4s (parallel `dv` batch) |
| **Git Working Tree Hygiene** | ⚠️ Aborted shims leak `package.json` | 🛡️ Auto-cleaned by `prune` / zero shims |
| **Build Console Output** | 📢 150+ lines of Biome noise | 🤫 Whisper-quiet, pristine logs |
| **Telemetry & Aesthetics** | 🔀 Mixed (dv cards + raw stdout) | 🎯 Unified 60fps frame dashboards |
