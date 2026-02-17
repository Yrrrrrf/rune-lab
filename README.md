<h1 align="center">
  <img src="https://raw.githubusercontent.com/Yrrrrrf/rune-lab/main/static/img/rune.png" alt="Rune Lab Icon" width="128" height="128" description="Icon representing the Svelte Runes system">
  <div align="center">Rune Lab</div>
</h1>

<div align="center">

[![JSR](https://jsr.io/badges/@yrrrrrf/rune-lab)](https://jsr.io/@yrrrrrf/rune-lab)
[![NPM Package](https://img.shields.io/npm/v/rune-lab.svg)](https://www.npmjs.com/package/rune-lab)
[![GitHub](https://img.shields.io/badge/GitHub-Yrrrrrf%2Frune--lab-blue)](https://github.com/Yrrrrrf/rune-lab)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://choosealicense.com/licenses/mit/)

</div>

## Overview

**Rune Lab** is your modern toolkit for crafting stunning, reactive web
applications with **Svelte 5**. Harnessing the power of Svelte's new **Runes**
system, Rune Lab offers a suite of elegant UI components designed for seamless
data handling and beautiful theming.

## Key Features

- **✨ Svelte 5 Runes Core:** Experience fine-grained reactivity and cleaner
  component logic.
- **🎨 Dynamic Theming:** Powered by DaisyUI & Tailwind CSS for extensive
  customization and out-of-the-box themes.
- **🔒 TypeScript First:** Robust type-safety for a confident and productive
  development workflow.
- **📊 Data-Aware Components:** Tools and components built to handle and
  visualize complex data.

<!-- - **🛰️ Interactive Schema Explorer:** A standout feature! Visually explore and
  interact with database schemas exposed by `prism-py` APIs directly within your
  Svelte application. Test CRUD operations, execute functions, and understand
  your data structure like never before.
- **🌐 Smart API Integration:** Includes `apiStore` (using `prism-ts`) for easy
  and type-safe connection to backend APIs. -->

- **📦 Lightweight Core:** Designed to be lean, with optional integrations.

<!-- - **🦕 Universal Access:** Available on JSR (for Deno) and NPM (for
  Node.js/Bun/Yarn). -->

## Installation

<!-- ### Using Deno / [JSR](https://jsr.io/@yrrrrrf/rune-lab)

```bash
# Add to your Deno project
deno add @yrrrrrf/rune-lab
``` -->

### Using [NPM](https://www.npmjs.com/package/rune-lab) / Bun

```bash
npm install rune-lab
bun install rune-lab
```

## Project Configuration

After installing, two configuration steps are required to ensure components are
compiled and styled correctly in your consuming project.

### Step 1 — Vite: process `rune-lab` through the Svelte compiler

Vite's SSR module runner externalizes `node_modules` by default, which means
`.svelte` files from this package would be loaded as raw ES modules, bypassing
the Svelte compiler entirely. Add the following to your `vite.config.ts` to
force Vite to process `rune-lab` through its plugin pipeline:

```ts
// vite.config.ts
export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    noExternal: ["rune-lab"],
  },
});
```

This ensures the Svelte plugin transforms the components correctly during SSR,
just as it would for your own source files.

### Step 2 — Tailwind CSS: scan `rune-lab` for utility classes

Tailwind only generates CSS for the classes it can find by scanning your source
files. Because `rune-lab` lives in `node_modules`, its DaisyUI classes are not
scanned by default and the components will appear unstyled.

Add a `@source` directive to your project's main CSS file to tell Tailwind to
also scan the `rune-lab` dist output:

```css
/* app.css / layout.css / global.css — wherever you import Tailwind */
@import "tailwindcss";
@source "../node_modules/rune-lab/dist"; /* 👈 add this */
```

> **Note:** Adjust the relative path to `node_modules` if your CSS file lives at
> a different depth in your project tree. With both steps in place, all DaisyUI
> component classes used by `rune-lab` will be included in your build and theme
> switching will work across library components and your own code alike.

## License

MIT License - See [LICENSE](LICENSE) for details.
