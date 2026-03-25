<script lang="ts">
    import { setContext, untrack, type Snippet, onMount } from "svelte";
    import {
        type ExchangeRateStore,
        type CartStoreConfig,
        RUNE_LAB_CONTEXT,
        localStorageDriver,
        initializeStores,
        registerBuiltinStores,
    } from "@rune-lab/kernel";
    import type { PersistenceDriver } from "@rune-lab/kernel";
    import { CommandPalette, ShortcutPalette, Toaster } from "@rune-lab/shortcuts";

    export interface RuneLabConfig {
        persistence?: PersistenceDriver;
        app?: Partial<import("@rune-lab/kernel").AppData>;
        apiUrl?: string;
        apiHealthCheck?: () => Promise<boolean>;
        favicon?: string;
        manageHead?: boolean;
        dictionary?: Record<string, any>;
        locales?: readonly string[];
        onLanguageChange?: (code: string) => void;
        /** Icon provider to use. 'material' injects Google Material Symbols font link. */
        icons?: "material" | "none";

        // Theming (DaisyUI)
        /** Additional custom themes to register alongside the built-in DaisyUI set */
        customThemes?: import("@rune-lab/kernel").Theme[];
        /** Theme to use when no persisted value exists (after system preference detection) */
        defaultTheme?: string;

        // Currencies (Dinero.js)
        /** Additional custom currencies to register */
        currencies?: import("@rune-lab/kernel").Currency[];
        /** Default currency code when no persisted value exists */
        defaultCurrency?: string;
        /** Bootstrap-time exchange rates */
        exchangeRates?: {
            base: string;
            rates: Record<string, number>;
        };
        /** Callback when rates are initialized/updated */
        onRatesUpdate?: (store: ExchangeRateStore) => void;

        // Cart (opt-in)
        /** CartStore configuration — when provided, a CartStore is created and registered in context */
        cart?: CartStoreConfig<any>;

        // Auth (opt-in)
        /** When true, creates and registers a SessionStore in context */
        auth?: {
            enabled?: boolean;
            /** Callback when session changes (login, logout, expiry) */
            onSessionChange?: (session: any) => void;
        };

        /** Callback when theme changes */
        onThemeChange?: (name: string) => void;
    }

    let { children, config = {} } = $props<{
        children: Snippet;
        config?: RuneLabConfig;
    }>();

    // ── Registry-Driven Store Initialization ──────────────────────────────────

    // Capture initial config to avoid Svelte 5 reactive capture warnings
    const initialConfig = untrack(() => ({ ...config }));
    const initialPersistence = untrack(
        () => config.persistence ?? localStorageDriver,
    );

    // 1. Register built-in store entries (idempotent — uses Map overwrite)
    registerBuiltinStores();

    // 2. Initialize all stores via the registry's topological sort
    const stores = initializeStores(
        initialConfig as Record<string, unknown>,
        initialPersistence,
    );

    // 3. Provide all stores as context (single loop, zero manual setContext)
    const CONTEXT_KEY_MAP: Record<string, symbol> = {
        app: RUNE_LAB_CONTEXT.app,
        api: RUNE_LAB_CONTEXT.api,
        toast: RUNE_LAB_CONTEXT.toast,
        theme: RUNE_LAB_CONTEXT.theme,
        language: RUNE_LAB_CONTEXT.language,
        currency: RUNE_LAB_CONTEXT.currency,
        exchangeRate: RUNE_LAB_CONTEXT.exchangeRate,
        shortcut: RUNE_LAB_CONTEXT.shortcut,
        layout: RUNE_LAB_CONTEXT.layout,
        commands: RUNE_LAB_CONTEXT.commands,
        cart: RUNE_LAB_CONTEXT.cart,
        session: RUNE_LAB_CONTEXT.session,
    };

    for (const [key, store] of stores) {
        const contextKey = CONTEXT_KEY_MAP[key];
        if (contextKey) setContext(contextKey, store);
    }

    // Also provide the persistence driver itself
    setContext(RUNE_LAB_CONTEXT.persistence, initialPersistence);

    // Provide user dictionary if given
    const initialDictionary = untrack(() => config.dictionary);
    if (initialDictionary) {
        setContext("rl:dictionary", initialDictionary);
    }

    // ── Convenience accessors for effects ──────────────────────────────────
    const appStore = stores.get("app") as any;
    const apiStore = stores.get("api") as any;
    const layoutStore = stores.get("layout") as any;
    const languageStore = stores.get("language") as any;
    const themeStore = stores.get("theme") as any;
    const exchangeRateStore = stores.get("exchangeRate") as ExchangeRateStore;

    // ── Dynamic config tracking (reactive effects) ────────────────────────

    // Track config changes dynamically
    $effect(() => {
        if (config.app) appStore.init(config.app);
    });

    $effect(() => {
        if (config.apiUrl)
            apiStore.init(config.apiUrl, "v1", config.apiHealthCheck);
    });

    $effect(() => {
        const code = languageStore.current as string;
        if (config.onLanguageChange) {
            config.onLanguageChange(code);
        }
    });

    $effect(() => {
        const name = themeStore.current as string;
        if (config.onThemeChange) {
            config.onThemeChange(name);
        }
    });

    onMount(() => {
        layoutStore.init();
        if (config.onRatesUpdate) {
            config.onRatesUpdate(exchangeRateStore);
        }
    });

    // Meta tags derived from app store state
    const metaTags = $derived([
        { name: "description", content: appStore.description },
        { name: "author", content: appStore.author },
    ]);
</script>

<svelte:head>
    {#if config.manageHead !== false}
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

<!-- Global Overlays -->
<Toaster />
<CommandPalette />
<ShortcutPalette />

<!-- Render Children -->
{@render children()}
