<h1 align="center">
  <img src="https://raw.githubusercontent.com/Yrrrrrf/rune-lab/main/static/rune.png" alt="Rune Lab Icon" width="128" height="128" description="Icon representing the Svelte Runes system">
  <div align="center">Rune Lab</div>
</h1>

<div align="center">

[![JSR](https://jsr.io/badges/@yrrrrrf/rune-lab)](https://jsr.io/@yrrrrrf/rune-lab)
[![NPM Package](https://img.shields.io/npm/v/rune-lab.svg)](https://www.npmjs.com/package/rune-lab)
[![GitHub](https://img.shields.io/badge/GitHub-Yrrrrrf%2Frune--lab-blue)](https://github.com/Yrrrrrf/rune-lab)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://choosealicense.com/licenses/mit/)

</div>

## Overview

**Rune Lab** is your modern toolkit for crafting stunning, reactive web applications with **Svelte 5**. Harnessing the power of Svelte's new **Runes** system, Rune Lab offers a suite of elegant UI components designed for seamless data handling and beautiful theming.

It's built to integrate effortlessly with your data sources, especially shining when connected to the [prism-py](https://github.com/Yrrrrrf/prism-py) and [prism-ts](https://github.com/Yrrrrrf/prism-ts) ecosystem for end-to-end type-safe API interactions.

## Key Features

-   **✨ Svelte 5 Runes Core:** Experience fine-grained reactivity and cleaner component logic.
-   **🎨 Dynamic Theming:** Powered by DaisyUI & Tailwind CSS for extensive customization and out-of-the-box themes.
-   **🔒 TypeScript First:** Robust type-safety for a confident and productive development workflow.
-   **📊 Data-Aware Components:** Tools and components built to handle and visualize complex data.
-   **🛰️ Interactive Schema Explorer:** A standout feature! Visually explore and interact with database schemas exposed by `prism-py` APIs directly within your Svelte application. Test CRUD operations, execute functions, and understand your data structure like never before.
-   **🌐 Smart API Integration:** Includes `apiStore` (using `prism-ts`) for easy and type-safe connection to backend APIs.
-   **📦 Lightweight Core:** Designed to be lean, with optional integrations.
-   **🦕 Universal Access:** Available on JSR (for Deno) and NPM (for Node.js/Bun/Yarn).

## The Prism Ecosystem Advantage

Rune Lab is designed to be a perfect companion to the Prism ecosystem:
*   **[prism-py](https://github.com/Yrrrrrf/prism-py):** Automatically generates REST APIs from your database schema.
*   **[prism-ts](https://github.com/Yrrrrrf/prism-ts):** A TypeScript client that consumes these APIs with full type-safety.

When used together, Rune Lab's API integration tools (like the `apiStore` and `RLSchemaExplorer`) provide a remarkably streamlined and type-safe path from your backend data to your frontend UI.

## Installation

### Using Deno / JSR

```bash
# Add to your Deno project
deno add @yrrrrrf/rune-lab
```

### Using NPM / Bun / Yarn

```bash
# NPM
npm install rune-lab

# Bun
bun add rune-lab

# Yarn
yarn add rune-lab
```

## License

MIT License - See [LICENSE](LICENSE) for details.
