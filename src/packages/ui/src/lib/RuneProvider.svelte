<script lang="ts">
  import { setContext, untrack, type Snippet, onMount, type Component } from "svelte";
  import {
    RUNE_LAB_CONTEXT,
    localStorageDriver,
    sessionStorageDriver,
    cookieDriver,
    createInMemoryDriver,
    createAppStore,
    type AppData,
    type LayoutStore,
    type ConfigStore,
    type ShortcutStore,
    type ICommandStore,
    type ICurrencyStore,
    type Theme,
    type Language,
  } from "./kernel/src/mod.ts";
  import {
    createKernel,
    definePlugin,
    namespaced,
    getRegisteredStore,
  } from "@rune-lab/core";
  import type { PersistenceDriver, RunePlugin, PluginInput, LocaleAdapter } from "@rune-lab/core";

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
    localeAdapter,
    onThemeChange,
    onLanguageChange,
    onCurrencyChange,
  } = $props<{
    children: Snippet;
    config?: RuneLabConfig;
    plugins?: PluginInput[];
    localeAdapter?: LocaleAdapter;
    onThemeChange?: (newTheme: any, oldTheme: any) => void;
    onLanguageChange?: (newLang: any, oldLang: any) => void;
    onCurrencyChange?: (newCurrency: any, oldCurrency: any) => void;
  }>();

  const initialPersistence = untrack(() => {
    let savedDriverType = "local";
    if (typeof window !== "undefined") {
      savedDriverType = window.localStorage.getItem("rl:persistence:driver") || "local";
    }
    let baseDriver = localStorageDriver;
    if (savedDriverType === "memory") baseDriver = createInMemoryDriver();
    else if (savedDriverType === "session") baseDriver = sessionStorageDriver;
    else if (savedDriverType === "cookie") baseDriver = cookieDriver;
    return namespaced(config.persistence ?? baseDriver, "rl:");
  });

  // 0. Create and provide the built-in AppStore
  const appStore = createAppStore();
  untrack(() => {
    if (config.app) {
      appStore.init(config.app);
    }
  });
  setContext(RUNE_LAB_CONTEXT.app, appStore);

  // 1. Construct the kernel
  const kernel = createKernel(plugins, {
    config: untrack(() => config as Record<string, unknown>),
    persistence: initialPersistence,
    localeAdapter,
  });

  // 2. Provide all stores as context
  for (const [id, store] of kernel.stores) {
    const entry = getRegisteredStore(id);
    if (entry?.contextKey && store) {
      setContext(entry.contextKey, store);
    }
  }

  // Also provide the persistence driver itself
  setContext(RUNE_LAB_CONTEXT.persistence, initialPersistence);
  setContext(RUNE_LAB_CONTEXT.settingsSections, kernel.getSettingsSections());

  // 3. Collect all overlays
  const allOverlays = $derived(kernel.overlays as Component[]);

  // ── Initialization for layout ──────────────────────────
  const layoutStore = kernel.stores.get("layout") as unknown as LayoutStore;
  const themeStore = kernel.stores.get("theme") as unknown as ConfigStore<Theme, "name">;
  const languageStore = kernel.stores.get("language") as unknown as ConfigStore<Language, "code">;
  const currencyStore = kernel.stores.get("currency") as unknown as ICurrencyStore;

  onMount(() => {
    if (layoutStore) layoutStore.init();

    // Sync core kernel cells to Svelte stores
    const shortcutStore = kernel.stores.get("shortcut") as unknown as ShortcutStore;
    if (shortcutStore) {
      for (const shortcut of kernel.getShortcuts()) {
        shortcutStore.register(shortcut as any);
      }
    }

    const commandStore = kernel.stores.get("commands") as unknown as ICommandStore;
    if (commandStore) {
      for (const cmd of kernel.getCommands()) {
        commandStore.register(cmd as any);
      }
    }

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
