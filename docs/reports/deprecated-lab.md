# Deprecated Lab Layout Syntax and Migration Guide

This document explains the transition from the legacy layout store architecture
to the new Svelte 5 and Forge slot-based layout system.

## 1. Store Access

### Legacy Syntax (Deprecated)

Previously, layout, theme, and language stores were accessed via global
module-level singletons or custom accessors that required manually managing
storage drivers:

```typescript
import { getLayoutStore, languageStore, themeStore } from "@rune-lab/layout";

// Set drivers manually
themeStore.setDriver(myDriver);
```

### New Slot-Based Syntax

Under the new slot contract, stores are created dynamically by the Forge
container and persisted automatically using injected Persistence drivers. Global
singletons are eliminated. Always retrieve stores via slot accessors:

```typescript
import {
  getLanguageStore,
  getLayoutStore,
  getTextStore,
  getThemeStore,
} from "@rune-lab/layout";

const layout = getLayoutStore(); // Zone preset store
const theme = getThemeStore(); // ConfigStore for theme selection
const language = getLanguageStore(); // ConfigStore for locale selection
const text = getTextStore(); // Dynamic Pretext facade
```

---

## 2. Layout Zones and Presets

### Legacy Syntax (Deprecated)

The old layout store had manually managed booleans (`navOpen`, `detailOpen`) and
unstructured settings:

```typescript
layoutStore.toggleNav();
layoutStore.navOpen = true;
```

### New Slot-Based Syntax

Layout geometry has been generalized into **Layout Zones** and **Presets**. The
closed set of zones consists of:

- `nav`
- `strip`
- `content`
- `detail`
- `statusbar`
- `overlay-anchor`

Each zone's visibility and sizes are managed within the layout store's `zones`
record:

```typescript
// Inspect zone visibility/size
const isNavVisible = layoutStore.zones.nav.visible;
const navWidth = layoutStore.zones.nav.size;

// Toggle visibility
layoutStore.toggleZone("nav");

// Apply standard presets ("page" | "docs" | "workspace")
layoutStore.applyPreset("docs");
```

_(Note: For backward compatibility, `layoutStore.navOpen` and
`layoutStore.detailOpen` getters/setters remain available and redirect to their
respective zones)._

---

## 3. Dynamic Text Rendering (Pretext Integration)

### Legacy Syntax (Deprecated)

Standard text wrapping used browser-default SVG/DOM measurements or primitive
string length calculations:

```svelte
<!-- Legacy browser wrapping -->
<div class="truncate">{myText}</div>
```

### New Slot-Based Syntax

The Layout plugin now features the `pretext` typesetting engine. We provide
ready-to-use Svelte 5 wrappers that reactively compute DOM line segments on
resize, theme changes, or locale updates:

#### Plain Text Wrapping

```svelte
<script lang="ts">
import { Text } from "@rune-lab/layout";
</script>

<Text
  content="This is a long paragraph typeset by Pretext."
  font="14px Inter"
  lineHeight={20}
  clamping={3}
/>
```

#### Rich Inline Fragment Runs (with spacing and pills)

```svelte
<script lang="ts">
import { RichText } from "@rune-lab/layout";
import type { RichInlineItem } from "@rune-lab/core";

const fragments: RichInlineItem[] = [
  { text: "Status:", font: "12px sans-serif" },
  { text: "Success", font: "bold 12px sans-serif", break: "never" }, // Renders as atomic pill
];
</script>

<RichText items={fragments} lineHeight={20} />
```

#### Programmatic Measurements

Access the raw `TextMeasurer` engine (only available in browser environments,
guard with `ready` flag):

```typescript
const textStore = getTextStore();

if (textStore.ready) {
  const prepared = textStore.engine.prepareWithSegments(
    "Hello world",
    "14px Inter",
  );
  const stats = textStore.engine.measureLineStats(prepared, 200);
  console.log(`Requires ${stats.lineCount} lines at 200px width.`);
}
```
