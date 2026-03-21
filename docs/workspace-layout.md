# rune-lab — WorkspaceLayout Global Style Leak

**Discovered:** 2026-03-15 · **Affects:** any app that imports rune-lab but does NOT use `WorkspaceLayout`

---

## What Happens

`WorkspaceLayout.svelte` contains an unscoped `<style>` block:

```css
/* Global lock for entire screen, relying on WorkspaceLayout scroll areas */
html, body {
    overflow: hidden;
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
}
```

Because this rule targets `html` and `body` directly (not a scoped class),
Svelte does not add a scope hash to it. It becomes a **global stylesheet**
the moment the module is included in the bundle.

Vite/Rollup bundles all component styles at build time regardless of whether
the component is actually rendered. So even though Chimera's Explorer app
never renders `WorkspaceLayout`, the style is injected into the page and
locks scrolling on every route.

---

## Symptoms

- Page renders correctly but is completely unscrollable
- No scrollbar visible anywhere in the app
- Content below the viewport is permanently inaccessible
- Affects every route simultaneously — not page-specific
- No error in the console — purely a CSS cascade issue

---

## Root Cause

The comment in the source says *"Global lock for entire screen, relying on
WorkspaceLayout scroll areas"* — this is intentional design for the agent
dashboard layout which manages its own internal scroll containers. But the
implementation leaks unconditionally into any app that imports rune-lab,
not just apps that use `WorkspaceLayout`.

The rule is also not inside a `@layer`, which means it sits at the top of
the cascade and cannot be overridden by any layered rule without `!important`.

---

## Workaround in Chimera

In `src/client/apps/explorer/src/routes/layout.css`:

```css
/* Override rune-lab WorkspaceLayout global style leak.
   That component locks html/body overflow even when not rendered. */
html, body {
    overflow: revert;
    height: revert;
}
```

`revert` restores the browser default (`overflow: visible`, `height: auto`).
This is placed outside any `@layer` block so it wins by source order over
the rune-lab rule.

---

## Proper Fix in rune-lab

Two options, pick one:

**Option A — Scope the rule to a class (recommended)**

Only apply the lock when `WorkspaceLayout` is actually mounted:

```css
/* Instead of targeting html/body globally */
:global(html):has(.rl-layout),
:global(body):has(.rl-layout) {
    overflow: hidden;
    height: 100%;
}
```

This uses `:has()` to activate the lock only when `.rl-layout` is present
in the DOM — i.e. only when `WorkspaceLayout` is actually rendered.

**Option B — Apply via JavaScript on mount/destroy**

```typescript
// In WorkspaceLayout.svelte
import { onMount } from 'svelte';

onMount(() => {
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';

    return () => {
        // Restore on unmount
        document.documentElement.style.overflow = '';
        document.documentElement.style.height = '';
        document.body.style.overflow = '';
        document.body.style.height = '';
    };
});
```

Remove the `<style>` block entirely. The lock is applied only when the
component mounts and cleaned up when it unmounts — zero global side effects.

Option B is more robust because it also handles the case where `WorkspaceLayout`
is conditionally rendered.

---

## Affected rune-lab consumers

Any SvelteKit app that:
- Imports anything from `rune-lab` (which transitively includes `WorkspaceLayout` in the bundle)
- Does NOT use `WorkspaceLayout` as its top-level layout component
- Relies on native browser scroll behavior

Standard consumer apps (Explorer, marketing sites, landing pages) all fall
into this category. Only the agent dashboard — which uses `WorkspaceLayout`
as intended — is unaffected.
