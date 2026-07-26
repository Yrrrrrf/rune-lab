<h1 align="center">
  <img src="https://raw.githubusercontent.com/Yrrrrrf/rune-lab/refs/heads/main/apps/lab/src/lib/assets/img/rune.png" alt="Rune Lab Icon" width="128" height="128" description="Icon representing the Svelte Runes system">
  <div align="center">Rune Lab</div>
</h1>

<div align="center">

[![JSR](https://jsr.io/badges/@yrrrrrf/rune-lab)](https://jsr.io/@yrrrrrf/rune-lab)
[![NPM Package](https://img.shields.io/npm/v/rune-lab.svg)](https://www.npmjs.com/package/rune-lab)
[![GitHub](https://img.shields.io/badge/GitHub-Yrrrrrf%2Frune--lab-blue)](https://github.com/Yrrrrrf/rune-lab)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://choosealicense.com/licenses/mit/)

</div>

## Overview

**Rune Lab** is a modern, extensible **plugin-based UI shell** for **Svelte 5**
applications. Harnessing the power of Svelte's new **Runes** system, it provides
a complete application skeleton with layout management, dynamic theming, i18n,
keyboard shortcuts, a command palette, toast notifications, and currency
controls.

Everything is wired through a centralized **Provider + Registry + Context**
architecture, ensuring clean dependency injection and state isolation across
your app.

## Installation

```bash
npm install rune-lab
# or
bun install rune-lab
```

Rune Lab requires `tailwindcss@^4` and `daisyui@^5` as dev dependencies in your
app.

Rune Lab ships pre-compiled Tailwind/daisyUI classes in its `dist`. Tailwind
skips `node_modules` when scanning for classes, so your app's CSS entrypoint
**must** opt back in with `@source`, or every rune-lab component renders
unstyled:

```css
/* e.g. src/routes/layout.css */
@import "tailwindcss";
@plugin "daisyui" {
  themes: all;
}

@source "../node_modules/rune-lab/dist";
```

Adjust the `@source` path to wherever `rune-lab` actually resolves to inside
your `node_modules`.

### Preventing theme flash

A persisted theme hydrates during component init — after first paint in SPA
mode. `app.html` is a static shell, not a Svelte component, so a library cannot
inject into it. Paste this literally into `<head>`, as early as possible —
before any other script or stylesheet that could paint content:

```html
<!-- app.html -->
<script>
try {
  var t = localStorage.getItem("rune-lab.layout:theme:theme");
  if (t && t !== "system") document.documentElement.dataset.theme = t;
} catch (_) {}
</script>
```

This is exactly the markup `rune-lab/layout`'s exported `THEME_BOOT_SCRIPT`
string constant contains — import it anywhere you _can_ run JS (e.g. a build
script that writes `app.html`) if you'd rather not hand-copy the key. It reads
the persisted theme and sets `data-theme` synchronously; if nothing is
persisted, it leaves `data-theme` unset so daisyUI's `:root:not([data-theme])`
CSS rule can resolve the OS preference instead.

## Setup & Quick Start

Configure your application layout with the plugins. Here is what you need to set
up in your root `+layout.svelte`:

```svelte
<script lang="ts">
import "./layout.css";
import { pushState, replaceState } from "$app/navigation";
import { RuneProvider, version } from "rune-lab";
import { i18n } from "rune-lab/i18n";
import { layout } from "rune-lab/layout";
import { palettes } from "rune-lab/palettes";
import type { Snippet } from "svelte";
import AppLayout from "./AppLayout.svelte";

import faviconUrl from "$lib/assets/img/rune.png";

let { children }: { children: Snippet } = $props();

const layoutPlugin = layout.with({ theme: { default: "dark" } });

// Wiring a router adapter lets the command palette and settings modal
// update the URL through SvelteKit's router instead of raw history calls.
const palettesPlugin = palettes.with({
  registry: {
    router: {
      replaceState: (url: string) => replaceState(url, {}),
      pushState: (url: string) => pushState(url, {}),
    },
  },
});
</script>

<RuneProvider
  config={{
    icons: "material",
    app: {
      name: "Rune Lab",
      version: version(),
      description: "Plugin test bench",
      author: "Yrrrrrf",
      icon: faviconUrl,
    },
  }}
  plugins={[layoutPlugin, palettesPlugin, i18n]}
>
  <AppLayout>
    {@render children()}
  </AppLayout>
</RuneProvider>
```

## Plugins

Rune Lab is modular. Plugins are documented in their respective directories:

- **Layout Plugin (`rune-lab/layout`)**: workspace layout shell, theming
  (`data-theme`, daisyUI themes), and the pretext text engine.
- **Palettes Plugin (`rune-lab/palettes`)**: command palette, keyboard
  shortcuts, toast notifications, and the settings modal.
- **i18n Plugin (`rune-lab/i18n`)**: language selection and currency
  formatting/selection.

## License

MIT License - See [LICENSE](LICENSE) for details.
