<script lang="ts">
  import { setContext, untrack, type Snippet, onMount, type Component } from "svelte";
  import {
    RUNE_LAB_CONTEXT,
    localStorageDriver,
    initializeStores,
    defineRune,
    createAppStore,
  } from "./kernel/src/mod.ts";
  import type { PersistenceDriver, RunePlugin } from "./kernel/src/mod.ts";
  import type { AppData } from "./kernel/src/mod.ts";

  /**
   * Namespaced configuration for Rune Lab plugins.
   * Keyed by plugin.id.
   */
  export interface RuneLabConfig {
    persistence?: PersistenceDriver;
    /** Optional head management properties */
    favicon?: string;
    manageHead?: boolean;
    icons?: "material" | "none";
    /** App metadata — passed to AppStore.init() */
    app?: Partial<AppData>;
    /** Namespaced config for plugins */
    [pluginId: string]: unknown;
  }

  let {
    children,
    config = {},
    plugins = [],
    onThemeChange,
    onLanguageChange,
    onCurrencyChange,
  } = $props<{
    children: Snippet;
    config?: RuneLabConfig;
    plugins?: RunePlugin[];
    onThemeChange?: (newTheme: any, oldTheme: any) => void;
    onLanguageChange?: (newLang: any, oldLang: any) => void;
    onCurrencyChange?: (newCurrency: any, oldCurrency: any) => void;
  }>();

  const initialPlugins = untrack(() => plugins);
  const initialPersistence = untrack(() => config.persistence ?? localStorageDriver);

  // 0. Create and provide the built-in AppStore
  const appStore = createAppStore();
  untrack(() => {
    if (config.app) {
      appStore.init(config.app);
    }
  });
  setContext(RUNE_LAB_CONTEXT.app, appStore);

  // 1. Register all plugins
  // Note: defineRune maps each slot into the STORE_REGISTRY
  untrack(() => {
    for (const plugin of initialPlugins) {
      defineRune(plugin);
    }
  });

  // 2. Initialize all stores via the registry's topological sort
  const stores = initializeStores(
    initialPlugins,
    untrack(() => config as Record<string, unknown>),
    initialPersistence
  );

  // 3. Provide all stores as context
  // We iterate ALL registered plugins to find the context keys for their slots
  for (const plugin of initialPlugins) {
    for (const slot of plugin.stores) {
      const store = stores.get(slot.id);
      if (store) {
        setContext(slot.contextKey, store);
      }
    }
  }

  // Also provide the persistence driver itself
  setContext(RUNE_LAB_CONTEXT.persistence, initialPersistence);

  // 4. Collect all overlays
  const allOverlays = $derived(plugins.flatMap((p: RunePlugin) => p.overlays ?? []) as Component<Record<never, never>>[]);

  // ── Initialization for layout ──────────────────────────
  const layoutStore = stores.get("layout") as any;
  const themeStore = stores.get("theme") as any;
  const languageStore = stores.get("language") as any;
  const currencyStore = stores.get("currency") as any;

  onMount(() => {
    if (layoutStore) layoutStore.init();

    const unsubs: (() => void)[] = [];

    if (onThemeChange && themeStore) {
      unsubs.push(themeStore.onChange(onThemeChange));
    }
    if (onLanguageChange && languageStore) {
      unsubs.push(languageStore.onChange(onLanguageChange));
    }
    if (onCurrencyChange && currencyStore) {
      unsubs.push(currencyStore.onChange(onCurrencyChange));
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  });

  // Meta tags derived from app store state
  const metaTags = $derived([
    { name: "description", content: appStore.description },
    { name: "author", content: appStore.author },
  ]);
</script>

<svelte:head>
  {#if config.manageHead !== false && appStore}
    <title>{appStore.name}</title>
    {#if config.favicon}
      <link rel="icon" href={config.favicon} />
    {/if}
    {#each metaTags as meta}
      <meta name={meta.name} content={meta.content} />
    {/each}
    {#if config.icons === "material"}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />
    {/if}
  {/if}
</svelte:head>

<!-- Plugin Overlays -->
{#each allOverlays as Overlay}
  <Overlay />
{/each}

<!-- Render Children -->
{@render children()}
