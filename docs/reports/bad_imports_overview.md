# Overview of Resolved Import Issues

During the standardization of the package source layout (moving `src/lib/*`
files directly under `src/` to support a flat module structure), three main
categories of incorrect/broken imports were identified and resolved.

---

## 1. Relative Config Path Drift in `ui/mod.ts`

### The Issue

In `src/packages/ui/src/lib/mod.ts`, the package version was imported from
`deno.json` using:

```typescript
import pkgConfig from "../../deno.json" with { type: "json" };
```

- **Before Move**: The file was at `src/packages/ui/src/lib/mod.ts`. Going up
  two levels (`../../`) resolved to `src/packages/ui/deno.json` correctly.
- **After Move**: The file was moved to `src/packages/ui/src/mod.ts`. Going up
  two levels now resolved to `src/packages/deno.json` (which does not exist),
  throwing a module resolution error.

### The Fix

Updated the path in
[src/packages/ui/src/mod.ts](file:///home/yrrrrrf/Documents/lab/code/typescript/rune-lab/src/packages/ui/src/mod.ts)
to:

```typescript
import pkgConfig from "../deno.json" with { type: "json" };
```

---

## 2. Stray Cross-Package Import in `message-resolver.test.ts`

### The Issue

In
[src/packages/plugins/i18n/src/lang/message-resolver.test.ts](file:///home/yrrrrrf/Documents/lab/code/typescript/rune-lab/src/packages/plugins/i18n/src/lang/message-resolver.test.ts),
the test was attempting to import functions from the `ui` package via:

```typescript
import { ... } from "../../../../ui/src/lib/i18n/message-resolver.ts";
```

This was broken because:

1. No such file/path existed under `ui`.
2. The core functionality and the target file `message-resolver.ts` were already
   residing locally inside the same directory under `i18n/src/lang/`.

### The Fix

Redirected the test to use the local file:

```typescript
import { ... } from "./message-resolver.ts";
```

---

## 3. Dissolved Context Accessors in `accessors.test.ts`

### The Issue

The test file
[src/packages/ui/src/accessors.test.ts](file:///home/yrrrrrf/Documents/lab/code/typescript/rune-lab/src/packages/ui/src/accessors.test.ts)
was importing accessors from `./stores.svelte.ts`:

```typescript
import {
  getCommandStore,
  getCurrencyStore,
  getLanguageStore,
  getLayoutStore,
  getShortcutStore,
  getThemeStore,
  getToastStore,
} from "./stores.svelte.ts";
```

This was broken because `stores.svelte.ts` was previously dissolved, and all
domain-specific context accessors were moved into their respective plugins
(`layout`, `palettes`, `i18n/money`) to enforce cleaner architectural
boundaries.

### The Fix

Updated the test imports to target their correct plugin packages:

```typescript
import {
  getLanguageStore,
  getLayoutStore,
  getThemeStore,
} from "../../plugins/layout/src/mod.ts";
import {
  getCommandStore,
  getShortcutStore,
  getToastStore,
} from "../../plugins/palettes/src/mod.ts";
import { getCurrencyStore } from "../../plugins/i18n/src/money/mod.ts";
```
