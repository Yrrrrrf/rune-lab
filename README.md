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

**Rune Lab** is a modern, extensible **plugin-based UI shell** for **Svelte 5**
applications. Harnessing the power of Svelte's new **Runes** system, it provides
a complete application skeleton with built-in layout management, dynamic
theming, i18n, keyboard shortcuts, a command palette, toast notifications, and a
highly precise money/currency subsystem.

Everything is wired through a centralized **Provider + Registry + Context**
architecture, ensuring clean dependency injection and state isolation across
your app.

## Key Features

- **✨ Svelte 5 Runes-First:** Built from the ground up using `$state`,
  `$derived`, and `$effect`. No legacy Svelte 4 stores.
- **🧩 Extensible Plugin Architecture:** Features are isolated into plugins
  (`LayoutPlugin`, `PalettesPlugin`, `MoneyPlugin`). Only load what you need.
- **🎨 Dynamic Theming & i18n:** 32 DaisyUI themes and 13 pre-configured locales
  powered by Paraglide JS, with zero-flash SSR persistence.
- **💾 Abstract Persistence Layer:** Swap between cookies, localStorage,
  sessionStorage, or in-memory state seamlessly via generic drivers.
- **💸 Robust Money Subsystem:** Backed by Dinero.js for floating-point-safe
  precision arithmetic, complete with exchange rate strategies and masked
  currency inputs.
- **⌨️ Developer & Power-User Friendly:** Out-of-the-box Command Palette
  (`Ctrl+K`) and interactive Shortcuts Palette (`Ctrl+/`).

## Installation

### Using NPM / Bun

```bash
npm install rune-lab
# or
bun install rune-lab
```

## Project Configuration (Required)

After installing, two configuration steps are required to ensure the framework's
components are compiled and styled correctly in your consuming project.

### Step 1 — Vite: Process `rune-lab` through the Svelte compiler

By default, Vite externalizes `node_modules` during SSR, bypassing the Svelte
compiler. Add the following to your `vite.config.ts` to process `rune-lab`
properly:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    noExternal: ["rune-lab"], // 👈 CRITICAL for Svelte 5 components in node_modules
  },
});
```

### Step 2 — Tailwind CSS v4: Scan `rune-lab` for utility classes

Tailwind only generates CSS for classes it finds by scanning your source files.
Add a `@source` directive to your project's main CSS file so Tailwind compiles
the DaisyUI classes used internally by `rune-lab`:

```css
/* app.css / layout.css / global.css */
@import "tailwindcss";
@source "../node_modules/rune-lab/dist"; /* 👈 add this */
```

## Quick Start

Get your application shell running in less than 40 lines. Inside your
`+layout.svelte`:

```svelte
<script lang="ts">
  import { 
    RuneProvider, 
    WorkspaceLayout, 
    ConnectedNavigationPanel,
    LayoutPlugin,
    PalettesPlugin,
    cookieDriver
  } from "rune-lab";
  import type { NavigationSection } from "rune-lab";

  let { children } = $props();

  const sections: NavigationSection[] = [
    {
      id: "main",
      title: "Main Menu",
      items: [
        { id: "home", label: "Dashboard", icon: "🏠" },
        { id: "settings", label: "Settings", icon: "⚙️" }
      ]
    }
  ];
</script>

<!-- Initialize the system with your required plugins -->
<RuneProvider
  config={{
    app: { name: "My Startup", version: "1.0.0" },
    persistence: cookieDriver,
  }}
  plugins={[LayoutPlugin, PalettesPlugin]}
>
  <WorkspaceLayout>
    {#snippet navigationPanel()}
      <!-- Auto-wires to LayoutStore state -->
      <ConnectedNavigationPanel {sections} />
    {/snippet}

    {#snippet content()}
      <div class="p-8">
        {@render children()}
      </div>
    {/snippet}
  </WorkspaceLayout>
</RuneProvider>
```

You now have a fully reactive layout, a keyboard command palette, a toast
notification system, and theme/language switchers.

## Money & Currency Plugin

Rune Lab provides a robust money layer that handles precision arithmetic,
formatting, and live exchange-rate triangulation. To use it, simply register the
`MoneyPlugin`:

```svelte
<script lang="ts">
  import { MoneyPlugin } from "rune-lab";
</script>

<RuneProvider
  config={{
    "rune-lab.money": {
      defaultCurrency: "USD",
      exchangeRates: { 
        base: "USD", 
        rates: { MXN: 17.23, EUR: 0.91 } 
      },
    }
  }}
  plugins={[LayoutPlugin, PalettesPlugin, MoneyPlugin]}
>
  <!-- App Content -->
</RuneProvider>
```

### Displaying & Inputting Money

```svelte
<script lang="ts">
  import { MoneyDisplay, MoneyInput, useMoney } from "rune-lab";
  
  let price = $state(15000); // Minor units (e.g., cents) -> $150.00
  const { convert, format } = useMoney();
</script>

<!-- Formats safely and localizes based on the active LanguageStore -->
<MoneyDisplay amount={price} currency="USD" />

<!-- Compact notation ($1.5M) -->
<MoneyDisplay amount={150000000} currency="USD" compact />

<!-- Integer-backed masked input (prevents floating point errors) -->
<MoneyInput bind:amount={price} currency="USD" />
```

## Persistence Drivers

Rune Lab provides generic drivers to remember user preferences across reloads.
Pass one to `config.persistence` on `<RuneProvider>`:

- `cookieDriver`: Best for SSR applications (like SvelteKit) to prevent "theme
  flash" on initial load.
- `localStorageDriver`: Best for client-only applications (SPAs).
- `sessionStorageDriver`: For preferences that should clear when the browser tab
  closes.

```svelte
<script lang="ts">
  import { cookieDriver } from "rune-lab";
</script>

<RuneProvider config={{ persistence: cookieDriver }} plugins={[...]}>
```

## Advanced Patterns

### Keyboard Shortcuts (Auto-Cleanup)

Any component deep in your tree can register its own keyboard shortcuts using
the `useShortcuts` composable. It handles Svelte's `$effect` lifecycle
internally, ensuring shortcuts unregister when the component unmounts:

```svelte
<script lang="ts">
  import { useShortcuts, getToastStore } from "rune-lab";

  const toasts = getToastStore();

  useShortcuts([
    {
      id: "feature.save",
      keys: "ctrl+s, cmd+s", // Comma-separated alternative keys
      label: "Save Document",
      category: "Editor",
      scope: "global",
      handler: (e) => {
        e.preventDefault();
        toasts.success("Document Saved!");
      }
    }
  ]);
</script>
```

### SvelteKit Route Syncing

To keep your layout's active navigation state synchronized with the SvelteKit
router, use an `$effect` inside your `+layout.svelte` right after the provider:

```svelte
<script lang="ts">
    import { page } from "$app/state";
    import { getLayoutStore } from "rune-lab";

    const layoutStore = getLayoutStore();

    $effect(() => {
        // Automatically open the correct nav tree branch
        const segment = page.url.pathname.split("/")[1] || "home";
        layoutStore.navigate(segment);
    });
</script>
```

### Calling Toasts from Outside Svelte Components

If you need to trigger a toast from a pure `.ts` file (like a fetching utility
or global error handler), you can use the Toast Bridge:

```ts
import { createToastBridge } from "rune-lab";

const { notify } = createToastBridge();

export async function fetchUser() {
  try {
    // ...
  } catch (err) {
    // Safely queues the toast if the UI hasn't mounted yet
    notify("Failed to fetch user data", "error");
  }
}
```

## License

MIT License - See [LICENSE](LICENSE) for details.
