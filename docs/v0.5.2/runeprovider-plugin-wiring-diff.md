# [[rune-lab]] [[RuneProvider]] — plugin wiring change, raw diff

> [!abstract] Scope
> Raw diff of the currently staged changes to `RuneProvider.svelte` and
> `apps/lab/src/routes/+layout.svelte`. This is the fix described in
> `vite-plus-cross-package-test-resolution.md`, captured here verbatim for
> reference. The `manageHead` removal (last hunk) was confirmed intentional
> by the user in conversation — not collateral damage from the plugin fix.

**Reviewed at:** `0.5.1-rc.3` · **Scope:** `ui/src/RuneProvider.svelte`, `apps/lab/src/routes/+layout.svelte`

---

## Summary

- `RuneProvider.svelte` no longer imports `layout`/`palettes` from
  `rune-lab/layout`/`rune-lab/palettes`, and no longer builds a
  `DEFAULT_PLUGINS` array merged into the kernel's plugin list. `plugins`
  passed in by the consumer is used as-is. This removes the `ui → plugin`
  package cycle diagnosed in `vite-plus-cross-package-test-resolution.md`.
- `apps/lab/src/routes/+layout.svelte` now explicitly lists all four plugins:
  `plugins={[layout, palettes, i18n, observer]}`.
- `RuneLabConfig.manageHead` is removed, and the `{#if config.manageHead !==
  false && appStore}` guard around `<svelte:head>` is removed — head
  management is now unconditional. Confirmed intentional (MANIFEST.md §8, "no
  configuration nobody asked for"): grepped the full repo for `manageHead`
  post-diff, zero remaining references anywhere, including `apps/lab`.

## Raw diff

```diff
diff --git a/apps/lab/src/routes/+layout.svelte b/apps/lab/src/routes/+layout.svelte
index 97512c5..397287f 100755
--- a/apps/lab/src/routes/+layout.svelte
+++ b/apps/lab/src/routes/+layout.svelte
@@ -2,7 +2,9 @@
 import "./layout.css";
 import { RuneProvider, version } from "rune-lab";
 import { i18n } from "rune-lab/i18n";
+import { layout } from "rune-lab/layout";
 import { observer } from "rune-lab/observer";
+import { palettes } from "rune-lab/palettes";
 import type { Snippet } from "svelte";
 import faviconUrl from "$lib/assets/img/rune.png";
 import AppLayout from "./AppLayout.svelte";
@@ -11,7 +13,7 @@ let { children }: { children: Snippet } = $props();
 </script>
 
 <RuneProvider
-  plugins={[i18n, observer]}
+  plugins={[layout, palettes, i18n, observer]}
   config={{
     app: {
       name: "Rune Lab",
diff --git a/src/packages/ui/src/RuneProvider.svelte b/src/packages/ui/src/RuneProvider.svelte
index 3b0ea47..c5e7102 100755
--- a/src/packages/ui/src/RuneProvider.svelte
+++ b/src/packages/ui/src/RuneProvider.svelte
@@ -8,8 +8,6 @@ import {
 	createInMemoryDriver,
 	createKernel,
 } from "rune-lab/core";
-import { layout } from "rune-lab/layout";
-import { palettes } from "rune-lab/palettes";
 import { type Component, type Snippet, setContext, untrack } from "svelte";
 import {
 	cookieDriver,
@@ -19,15 +17,11 @@ import {
 import { RUNE_LAB_CONTEXT } from "./provider/context.ts";
 import { type AppData, createAppStore } from "./reactivity/app.svelte.ts";
 
-const DEFAULT_PLUGINS: PluginInput[] = [layout, palettes];
-
 /**
  * Configuration options for RuneProvider (persistence driver, head management, app metadata).
  */
 export interface RuneLabConfig {
 	persistence?: PersistenceDriver;
-	/** Optional head management properties */
-	manageHead?: boolean;
 	/** App metadata — passed to AppStore.init() */
 	app?: Partial<AppData>;
 	pluginConfig?: Record<string, Record<string, unknown>>;
@@ -69,7 +63,7 @@ setContext(RUNE_LAB_CONTEXT.app, appStore);
 
 // 1. Construct the kernel
 const kernel = createKernel(
-	untrack(() => [...DEFAULT_PLUGINS, ...plugins]),
+	untrack(() => plugins),
 	{
 		persistence: initialPersistence,
 		localeAdapter: untrack(() => localeAdapter),
@@ -107,7 +101,6 @@ const metaTags = $derived([
 </script>
 
 <svelte:head>
-  {#if config.manageHead !== false && appStore}
     {#if appStore.data.name}
       <title>{appStore.data.name}</title>
     {/if}
@@ -123,7 +116,6 @@ const metaTags = $derived([
       rel="stylesheet"
       href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
     />
-  {/if}
 </svelte:head>
 
 <!-- Plugin Overlays -->
```
