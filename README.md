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

Rune Lab requires `tailwindcss@^4` and `daisyui@^5` as dev dependencies in
your app.

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

## Setup & Quick Start

Configure your application layout with the plugins. Here is what you need to set
up in your root `+layout.svelte`:

```svelte
<script lang="ts">
import "./layout.css";
import { pushState, replaceState } from "$app/navigation";
import { RuneProvider, version } from "rune-lab";
import { I18nPlugin } from "rune-lab/i18n";
import { LayoutPlugin } from "rune-lab/layout";
import { PalettesPlugin } from "rune-lab/palettes";
import type { Snippet } from "svelte";
import AppLayout from "./AppLayout.svelte";

import faviconUrl from "$lib/assets/img/rune.png";

let { children }: { children: Snippet } = $props();

const layoutPlugin = LayoutPlugin.with({ theme: "dark" });

// Wiring a router adapter lets the command palette and settings modal
// update the URL through SvelteKit's router instead of raw history calls.
const palettesPlugin = PalettesPlugin.with({
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
  plugins={[layoutPlugin, palettesPlugin, I18nPlugin]}
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
