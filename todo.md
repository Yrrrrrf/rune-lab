# Rune Lab — Library Polish Guide
> From "it works for me" to "a dev can drop this into any project"

This guide walks every friction point a consumer developer will hit, ordered roughly by how early in their journey they encounter it. Each item says what the problem is, why it matters, and exactly what to do.

---

## 0. The Missing Quick Start

**Problem:** The README shows a 2-step install but never shows a working 20-line example. A developer reading it cannot tell what their `+layout.svelte` should look like, what stores they get, or what components they can use right away. They have to read source files to figure it out.

**Fix:** Add a minimal, complete "Quick Start" section to the README immediately after Installation. It should show:
- `<RuneProvider>` wrapping the layout
- One call to `useRuneLab()` or `getAppStore().init()` to set metadata
- `<WorkspaceLayout>` with all four snippets filled in with the simplest possible content
- One `toastStore.success()` call to prove the system works end-to-end

This single example will save every new consumer 30–60 minutes of archaeology.

---

## 1. RuneProvider — Props It's Missing

### 1a. Hardcoded favicon (bug)

`RuneProvider.svelte` contains:

```html
<link rel="icon" href={"/img/rune.png"} />
```

This unconditionally overrides the consuming app's favicon on every render. Any app that already has a favicon will find it replaced with the rune logo. This needs to be a prop — `favicon?: string` — with `undefined` as default so the tag is only rendered when explicitly provided.

### 1b. No initial config props

Consumers currently must do this after the provider mounts:

```ts
// Somewhere in a child component, after RuneProvider
const { app, api } = useRuneLab();
$effect(() => {
    app.init({ name: "My App", version: "1.0.0" });
    api.init("https://api.myapp.com", "v1");
});
```

This is awkward — the provider is the natural place to pass this. Add optional props to `RuneProvider`:

```ts
let { 
    children, 
    persistence,
    app,      // Partial<AppData>
    apiUrl,   // string
    favicon,  // string | undefined
} = $props()
```

And internally call `appStore.init(app)` and `apiStore.init(apiUrl)` if provided. This makes the entire setup expressible as a single component in the root layout, with no follow-up `$effect` required.

### 1c. `<svelte:head>` manipulation is unconditional

`RuneProvider` always sets `<title>` and description/author meta tags. If the consuming app wants to manage its own `<title>` per page, these will conflict. The `<svelte:head>` block should be opt-in, either through a prop like `manageHead?: boolean = true` or by removing it from the provider entirely and documenting it as something consumers can do themselves with `getAppStore()`.

---

## 2. Store Architecture — The Toast Outside Context Problem

**Problem:** Module-level store singletons (the pattern consumers naturally write for auth, domain state, etc.) cannot call `getToastStore()` because there is no Svelte component context at that point. Chimera's `AuthStore` and `CRMStore` hit this immediately.

**This is the most practically limiting gap in the library.**

**Fix:** Export a lightweight event-bus escape hatch. A `createToastBridge()` function that returns a `{ notify, wire }` pair would work:

- `notify(type, message)` — callable from anywhere, queues the notification in memory
- `wire(toastStore)` — called once inside a component (e.g., in the layout, right after `useRuneLab()`), drains the queue and connects subsequent calls to the live store

Alternatively, expose a module-level `notifyQueue` array that `RuneProvider` drains automatically on mount. Either approach lets domain stores fire toasts without importing from a context they don't have access to.

---

## 3. ApiStore — Fake Reconnect

**Problem:** `ApiStore.reconnect()` does this:

```ts
await new Promise((resolve) => setTimeout(resolve, 1500));
this.connectionState = "connected";
```

It always succeeds after 1.5 seconds. Chimera had to completely comment out their API store integration because they couldn't plug in a real health check. The library's `ApiMonitor` widget shows a live connection status, which is meaningless when the store never actually checks anything.

**Fix:** `ApiStore.init()` should accept an optional `healthCheck: () => Promise<boolean>` parameter. When provided, `reconnect()` calls it instead of the fake delay. When not provided, the current behavior (simulated success) can remain as a development default with a `DEV` console warning that no real health check is configured.

---

## 4. LayoutStore — Showcase State Does Not Belong Here

**Problem:** `LayoutStore` has two members that are purely demo-specific:

- `activeShowcaseTab: number`  
- `setShowcaseTab(index: number): void`

These are used only by `Showcase.svelte` and `ShowcasePanel.svelte` inside the library's own demo. A consuming developer getting `LayoutStore` from context will find these properties in their autocomplete and have no idea what they're for.

**Fix:** Remove `activeShowcaseTab` and `setShowcaseTab` from `LayoutStore`. Move the tab state to `Showcase.svelte` as a local `$state` variable. It is a component-local UI concern, not a layout-level application concern.

---

## 5. createConfigStore — Wrong Location, Missing Export

**Problem:** `createConfigStore` lives at `$lib/devtools/createConfigStore.svelte.ts`. The `devtools/` folder name implies internal/tooling code. But chimera imported it directly to build persistent filter stores — it is clearly a public utility for consumers.

Additionally, it is not clear whether `createConfigStore` is exported from the main `rune-lab` entry point or only from `rune-lab/config`. Consumers have to guess.

**Fix:**
1. Move `createConfigStore` out of `devtools/` into `lib/` (e.g., `lib/stores/createConfigStore.svelte.ts`)
2. Re-export it explicitly from the main `index.ts` barrel
3. Add a JSDoc example showing how to use it for persistent application settings (filter states, view layouts, etc.)

---

## 6. Icon Component — No Extensibility

**Problem:** The `Icon` component ships 6 icons: `search`, `chevron-down`, `info`, `shortcut`, `close`, `external`. Chimera had to use `name="info"` as a fallback for grid, list, and plus icons because they don't exist. The fallback logs a warning and renders a question mark, which makes it into production if the consumer doesn't notice.

Two problems:
1. The built-in set is too small for real apps
2. There is no way to register custom icons without forking the library

**Fix (minimal):** Add at minimum: `plus`, `minus`, `check`, `trash`, `edit` (pencil), `grid`, `list`, `table`, `arrow-left`, `arrow-right`, `chevron-right`, `menu` (hamburger), `bell`, `user`, `settings`, `logout`. These are the icons every business app needs in its first screen.

**Fix (extensible):** Add an `icons` prop that lets consumers pass in a partial map of additional SVG path strings:

```svelte
<Icon name="custom-icon" icons={{ "custom-icon": "<path d=...>" }} />
```

Or better, expose a module-level `registerIcons(map: Record<string, string>)` function that consumers call once at app startup to extend the default set globally.

---

## 7. Layout System — Snippet Optionality

**Problem:** `WorkspaceLayout` renders four snippets: `workspaceStrip`, `navigationPanel`, `content`, and `detailPanel`. If a consumer omits any of them, Svelte will throw at runtime because snippets are not optional by default.

Looking at the layout's template, all four are rendered unconditionally via `{@render snippet()}`.

**Fix:** Make each snippet optional with a typed `Snippet | undefined` prop and guard each render call. Provide sensible defaults:
- `workspaceStrip` → empty / hidden column (consumers often don't need the Discord-style strip)
- `navigationPanel` → hidden
- `content` → empty div
- `detailPanel` → hidden

This way the layout works even for minimal usage, and consumers can opt into panels as they need them.

---

## 8. Missing SvelteKit Route Sync Helper

**Problem:** Every SvelteKit app using `WorkspaceLayout` needs to sync the current URL path to `layoutStore.navigate()`. Every consumer will write a manual `$effect`:

```ts
$effect(() => {
    const segment = $page.url.pathname.split("/")[1] || "home";
    layoutStore.navigate(segment);
});
```

This also has a subtlety: the import should be from `"$app/state"` (Svelte 5), not `"$app/stores"` (Svelte 4). Consumers who learned SvelteKit on Svelte 4 will use the wrong import.

**Fix:** Export a `createSvelteKitRouteSync` utility (or at minimum document this exact pattern in the README, with the correct import path). The utility itself could be a Svelte action or a simple function that takes a `LayoutStore` and a route pathname and does the sync. Since it uses SvelteKit-specific imports, it should live in a separate sub-export like `rune-lab/kit` so the core library stays framework-agnostic.

---

## 9. Shortcut Registration — Wrong Pattern Documentation

**Problem:** The natural place consumers will register shortcuts is `onMount`. But `onMount` doesn't set up cleanup. The correct pattern is `$effect` with a cleanup return:

```ts
// WRONG — shortcuts accumulate and never clean up on component re-mount
onMount(() => {
    shortcutStore.register({ id: "app:nav", keys: "g h", ... });
});

// CORRECT
$effect(() => {
    shortcutStore.register({ id: "app:nav", keys: "g h", ... });
    return () => shortcutStore.unregister("app:nav");
});
```

The library uses the correct pattern internally but neither the README nor JSDoc on `ShortcutStore.register()` mentions this.

**Fix:**
1. Add a JSDoc `@example` to `ShortcutStore.register()` showing the `$effect` pattern
2. Add a warning in `DEV` mode when the same shortcut ID is registered more than once without an intervening unregister (which is the fingerprint of the `onMount` mistake)
3. Document this in the README under a "Keyboard Shortcuts" section

---

## 10. Persistence Driver — Undiscoverable

**Problem:** `drivers.ts` exports `localStorageDriver`, `sessionStorageDriver`, `cookieDriver`, and `createInMemoryDriver`. These are exactly what consumers need to pass to `RuneProvider`'s `persistence` prop. But:

1. It is not clear they are exported from the public API
2. The README does not mention them
3. Consumers have to implement their own driver or guess that these exist

**Fix:**
1. Verify these are exported from the main `rune-lab` entry point (they should be)
2. Add a `persistence` section to the README showing the three standard drivers and when to use each
3. Add a `cookieDriver` example specifically — it's the right choice for SSR apps because it survives the initial server render without a theme flash

---

## 11. LayoutStore.init() Is Never Called

**Problem:** `LayoutStore` has an `init()` method that loads persisted state (collapsed sections, active workspace) from the driver. But looking at `RuneProvider.svelte`, it calls `createLayoutStore(initialPersistence)` and never calls `.init()` on the result. This means layout persistence is silently broken — sections and workspace selection are never restored from storage even when a driver is provided.

**Fix:** Call `layoutStore.init()` inside `RuneProvider` after creation, or (better) move the persistence initialization logic into the constructor so it runs automatically. The pattern of "create then separately init" is error-prone for a library component that consumers don't control.

---

## 12. Paraglide Locale Coupling

**Problem:** `createLanguageStore` internally calls `setLocale` from the library's own compiled paraglide runtime (`$lib/paraglide/runtime.js`). This updates the library's i18n locale (for labels in `ThemeSelector`, `LanguageSelector`, etc.) but has no effect on the consuming app's paraglide instance, which has its own separate runtime.

When chimera's user changes language via `LanguageSelector`, the library's labels update correctly but the app's own translated strings do not, because the app's `setLocale` was never called.

**Fix:** `createLanguageStore` should accept an optional `onLocaleChange?: (code: string) => void` callback. Consumers pass their own `setLocale` from `"$lib/paraglide/runtime"`. This keeps the library decoupled from the consuming app's paraglide setup while still enabling proper coordination.

---

## 13. TypeScript — Missing or Unclear Exports

These types are needed by consumers to properly type their app code but their export status is unclear or the ergonomics are poor:

- **`PersistenceDriver`** — needs to be exported from the main barrel so consumers can type their custom drivers without knowing the internal path
- **`NavigationSection` / `NavigationItem`** — exported from `state/index.ts` but should also be in the root barrel since they're needed just to construct the `sections` prop on `ConnectedNavigationPanel`
- **`WorkspaceItem`** — same as above
- **`AppData`** — consumers passing initial config to `RuneProvider` (once the prop exists) need this type
- **`ConnectionState`** — consumers reading `apiStore.connectionState` may want to switch on it; should be exported

Run `publint` and also check that `tsc --declaration` produces clean `.d.ts` files for all the above. Any type that appears in a component's props must be exported from the public API.

---

## 14. Known Bugs to Fix Before v1

### Warning toast icon is broken

In `Toaster.svelte`, the warning type has this comment directly in the source:

```ts
iconPath: "M12 9a.75.75 0 1 0 0-1.5... // This path looks wrong in original, replacing with simpler"
```

The "simpler" replacement renders two dots and is not a recognizable warning icon. Fix the SVG path to a proper triangle-exclamation warning icon before shipping v1.

### `cn.ts` and `formatters.ts` are empty

These utility files exist in `sdk/ui/src/lib/utils/` (chimera) but are also empty stubs in rune-lab's own structure. If they're meant to be part of the library, implement them. If they're not, remove them so they don't appear as false promise in the file tree.

---

## 15. Library Hygiene — Things to Remove or Rename

### `devtools/` folder name is misleading

The `devtools/` folder contains:
- `API_Monitor.svelte` — a real, useful component consumers want
- `Toaster.svelte` — essential rendering component
- `createConfigStore.svelte.ts` — public utility
- `message-resolver.ts` — internal

The folder name implies "only for development debugging". Rename it to something accurate like `internal/` for the truly private parts, and move the public-facing pieces (`ApiMonitor`, `Toaster`) to `components/`.

### `AppStateInspector` is dev-only but not labeled as such

`AppStateInspector` is a useful debug component but a consumer shipping to production shouldn't render it outside a dev guard. Add a prominent note in JSDoc that it is a development-only component and should be conditionally rendered with `{#if import.meta.env.DEV}`.

### `Showcase` / `ShowcaseCard` / showcase tabs

These are entirely internal to the library's demo app. They should not be exported from the public API. Check whether they appear in `index.ts` and remove them if so.

---

## Summary Priority Order

**Fix before any production tag:**
1. Hardcoded `/img/rune.png` favicon in RuneProvider
2. `LayoutStore.init()` never called (persistence silently broken)
3. Warning toast icon SVG path

**Fix before calling it stable:**
4. `RuneProvider` app/api initial config props
5. Toast from outside context (the bridge utility)
6. `createConfigStore` moved out of `devtools/` and properly exported
7. Snippet optionality in `WorkspaceLayout`
8. `activeShowcaseTab` removed from `LayoutStore`

**Fix before marketing it to other developers:**
9. Icon extensibility
10. Quick Start example in README
11. Persistence driver documentation
12. SvelteKit route sync pattern documented
13. Shortcut `$effect` pattern documented
14. ApiStore real health check hook
15. TypeScript exports audit
16. Paraglide locale callback for consumer apps