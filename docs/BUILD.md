# Rune Lab — Package & Build Overview

Rune Lab is bundled and published as a single npm package (`rune-lab`). At
development time, the code is organized into a modular workspace (with core, ui,
and plugins). At build time, these submodules are compiled and nested under a
unified `src/` folder, leaving only the primary UI entry point at the true root
of `dist/`.

## 1. Directory Layout

The compiled distribution (`build/`) has the following canonical structure:

```
build/
├── package.json
├── LICENSE
├── README.md
└── dist/
    ├── mod.js / mod.d.ts        ← Primary entry point (UI)
    └── src/
        ├── core/                ← Kernel (framework-agnostic DI layer)
        ├── ui/                  ← Svelte 5 UI adapter files
        └── plugins/
            ├── layout/          ← layout plugin
            ├── palettes/        ← palettes (notifications, commands, shortcuts) plugin
            ├── observer/        ← observer plugin
            └── lang/            ← i18n lang paraglide files
            └── money/           ← i18n money primitives and subpath
```

## 2. Exports Map & Import Paths

The package exposes the following entry points through its `package.json`
`exports` map:

| Public Import Path    | Internal Target                    | Purpose                                      |
| --------------------- | ---------------------------------- | -------------------------------------------- |
| `rune-lab`            | `dist/mod.js`                      | Svelte 5 UI adapter components & hooks       |
| `rune-lab/core`       | `dist/src/core/mod.js`             | Kernel & Dependency Injection API            |
| `rune-lab/layout`     | `dist/src/plugins/layout/mod.js`   | Layout components & language/theme selection |
| `rune-lab/palettes`   | `dist/src/plugins/palettes/mod.js` | Command palette, shortcut list, toaster      |
| `rune-lab/i18n/money` | `dist/src/plugins/money/mod.js`    | Currency stores & selections                 |
| `rune-lab/i18n/lang`  | `dist/src/plugins/lang/mod.js`     | Internal localization / paraglide entry      |

## 3. Build & Packaging Pipeline (`just build`)

The build pipeline consists of the following steps:

1. **Clean**: Removes the previous `build/` directory.
2. **Manifest Generation**: Assembles `build/package.json` by combining root
   metadata and dynamically gathering dependencies from all workspace packages'
   `deno.json` files.
3. **Compilation**: Runs `@sveltejs/package` per workspace package to output
   JavaScript/Svelte components.
4. **Reshuffling**: Moves each compiled submodule into its nested path inside
   `build/dist/src/` (with ui components split so that only `mod.js`/`mod.d.ts`
   stay at `build/dist/`).
5. **Formatting**: Formats the compiled files using `deno fmt`.
6. **Patching**: Strips test files/artifacts, converts `.ts` relative imports to
   `.js`, inlines package version, and rewrites workspace specifiers
   (`@rune-lab/*` -> `rune-lab/*`).
7. **Verification**: Executes quality gates to verify there are no specifier
   leaks, that all exported paths exist, and that TypeScript types/boundary
   checks pass.
