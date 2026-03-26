<script lang="ts">
  import { setContext, untrack, type Snippet, onMount, type Component } from "svelte";
  import {
    RUNE_LAB_CONTEXT,
    localStorageDriver,
    initializeStores,
    defineRune,
  } from "@rune-lab/kernel";
  import type { PersistenceDriver, RunePlugin } from "@rune-lab/kernel";

  /**
   * Namespaced configuration for Rune Lab plugins.
   * Keyed by plugin.id.
   */
  export interface RuneLabConfig {
    persistence?: PersistenceDriver;
    /** Backward compat: App settings */
    app?: Record<string, any>;
    /** Backward compat: API settings */
    apiUrl?: string;
    apiHealthCheck?: () => Promise<boolean>;
    /** Backward compat: Layout settings */
    favicon?: string;
    manageHead?: boolean;
    /** Backward compat: i18n settings */
    locales?: readonly string[];
    onLanguageChange?: (code: string) => void;
    /** Backward compat: Theme settings */
    customThemes?: any[];
    defaultTheme?: string;
    onThemeChange?: (name: string) => void;
    /** Backward compat: Money settings */
    currencies?: any[];
    defaultCurrency?: string;
    exchangeRates?: any;
    onRatesUpdate?: (store: any) => void;

    /** Namespaced config for plugins */
    [pluginId: string]: any;
  }

  let { children, config = {}, plugins = [] } = $props<{
    children: Snippet;
    config?: RuneLabConfig;
    plugins?: RunePlugin[];
  }>();

  // 1. Flatten backward-compat top-level props into namespaced config
  // This is a shim for v0.4.x
  const shimmedConfig = $derived.by(() => {
    const c = { ...config };
    
    // Layout & Config shim
    c["rune-lab.layout"] = {
      ...c["rune-lab.layout"],
      customThemes: c.customThemes,
      defaultTheme: c.defaultTheme,
      locales: c.locales,
    };

    // Palettes shim
    c["rune-lab.palettes"] = {
      ...c["rune-lab.palettes"],
    };

    // Money shim
    c["rune-lab.money"] = {
      ...c["rune-lab.money"],
      currencies: c.currencies,
      defaultCurrency: c.defaultCurrency,
      exchangeRates: c.exchangeRates,
    };

    // Kythrill shim
    c["rune-lab.kythrill"] = {
      ...c["rune-lab.kythrill"],
      app: c.app,
    };

    return c;
  });

  // 2. Register all plugins
  // Note: defineRune maps each slot into the STORE_REGISTRY
  for (const plugin of plugins) {
    defineRune(plugin);
  }

  const initialPersistence = untrack(() => config.persistence ?? localStorageDriver);

  // 3. Initialize all stores via the registry's topological sort
  const stores = initializeStores(
    plugins,
    untrack(() => shimmedConfig),
    initialPersistence
  );

  // 4. Provide all stores as context
  // We iterate ALL registered plugins to find the context keys for their slots
  for (const plugin of plugins) {
    for (const slot of plugin.stores) {
      const store = stores.get(slot.id);
      if (store) {
        setContext(slot.contextKey, store);
      }
    }
  }

  // Also provide the persistence driver itself
  setContext(RUNE_LAB_CONTEXT.persistence, initialPersistence);

  // 5. Collect all overlays
  const allOverlays = $derived(plugins.flatMap(p => p.overlays ?? []) as Component<Record<never, never>>[]);

  // ── Accessors for effects (backward compat) ──────────────────────────
  const appStore = stores.get("app") as any;
  const apiStore = stores.get("api") as any;
  const layoutStore = stores.get("layout") as any;
  const languageStore = stores.get("language") as any;
  const themeStore = stores.get("theme") as any;
  const exchangeRateStore = stores.get("exchangeRate") as any;

  // ── Reactive effects for legacy config sync ──────────────────────────
  $effect(() => {
    if (config.app && appStore) appStore.init(config.app);
  });

  $effect(() => {
    if (config.apiUrl && apiStore)
      apiStore.init(config.apiUrl, "v1", config.apiHealthCheck);
  });

  $effect(() => {
    if (languageStore) {
      const code = languageStore.current as string;
      if (config.onLanguageChange) {
        config.onLanguageChange(code);
      }
    }
  });

  $effect(() => {
    if (themeStore) {
      const name = themeStore.current as string;
      if (config.onThemeChange) {
        config.onThemeChange(name);
      }
    }
  });

  onMount(() => {
    if (layoutStore) layoutStore.init();
    if (config.onRatesUpdate && exchangeRateStore) {
      config.onRatesUpdate(exchangeRateStore);
    }
  });

  // Meta tags derived from app store state
  const metaTags = $derived(appStore ? [
    { name: "description", content: appStore.description },
    { name: "author", content: appStore.author },
  ] : []);
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
