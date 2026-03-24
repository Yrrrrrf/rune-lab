// sdk/state/src/registry/builtin-entries.ts
// Built-in store registry entries for all core stores.
// These are registered once at module load time.

import { registerStore } from "./index.ts";
import type { PersistenceDriver } from "@internal/core";

import { type AppStore, createAppStore } from "../app.svelte.ts";
import { type ApiStore, createApiStore } from "../api.svelte.ts";
import { createToastStore, type ToastStore } from "../toast.svelte.ts";
import { createThemeStore, type ThemeStoreOptions } from "../theme.svelte.ts";
import { createLanguageStore } from "../language.svelte.ts";
import {
  createCurrencyStore,
  type Currency,
  type CurrencyStoreOptions,
} from "../currency.svelte.ts";
import {
  createExchangeRateStore,
  type ExchangeRateStore,
} from "../exchange-rate.svelte.ts";
import { createShortcutStore } from "../shortcuts.svelte.ts";
import { createLayoutStore } from "../layout.svelte.ts";
import { createCommandStore } from "../commands.svelte.ts";
import { type CartStoreConfig, createCartStore } from "../cart.svelte.ts";
import { createSessionStore } from "../auth/index.ts";

/** Narrow a generic config record for type-safe property access. */
type Cfg = Record<string, unknown>;

/**
 * Register all built-in stores.
 * Called once when the module is imported — idempotent via the Map's overwrite behavior.
 *
 * Factory signature: (config, driver, stores) => StoreInstance | null
 * - `config` is the full RuneLabConfig (typed as `unknown` by StoreFactory)
 * - `driver` is the resolved PersistenceDriver
 * - `stores` is a Map of already-created stores (for dependency injection)
 */
export function registerBuiltinStores(): void {
  // ── Tier 0: No dependencies ────────────────────────────────────────────
  registerStore({
    key: "app",
    factory: () => createAppStore(),
    noPersistence: true,
  });

  registerStore({
    key: "api",
    factory: () => createApiStore(),
    noPersistence: true,
  });

  registerStore({
    key: "toast",
    factory: () => createToastStore(),
    noPersistence: true,
  });

  registerStore({
    key: "shortcut",
    factory: () => createShortcutStore(),
    noPersistence: true,
  });

  registerStore({
    key: "exchangeRate",
    factory: (config: unknown) => {
      const c = config as Cfg;
      const store = createExchangeRateStore();
      const rates = c.exchangeRates as
        | { base: string; rates: Record<string, number> }
        | undefined;
      if (rates) {
        store.setRates(rates.base, rates.rates);
      }
      return store;
    },
    noPersistence: true,
  });

  // ── Tier 1: Depend on persistence driver ───────────────────────────────
  registerStore({
    key: "theme",
    factory: (config: unknown, driver: PersistenceDriver) => {
      const c = config as Cfg;
      const opts: ThemeStoreOptions = {
        driver,
        customThemes: c.customThemes as ThemeStoreOptions["customThemes"],
        defaultTheme: c.defaultTheme as string | undefined,
      };
      return createThemeStore(opts);
    },
  });

  registerStore({
    key: "language",
    factory: (config: unknown, driver: PersistenceDriver) => {
      const c = config as Cfg;
      return createLanguageStore({
        driver,
        locales: c.locales as readonly string[] | undefined,
      });
    },
  });

  registerStore({
    key: "currency",
    factory: (
      config: unknown,
      driver: PersistenceDriver,
      stores: Map<string, unknown>,
    ) => {
      const c = config as Cfg;
      const opts: CurrencyStoreOptions = {
        driver,
        customCurrencies: c.currencies as Currency[] | undefined,
        defaultCurrency: c.defaultCurrency as string | undefined,
        exchangeRateStore: stores.get("exchangeRate") as ExchangeRateStore,
      };
      return createCurrencyStore(opts);
    },
    dependsOn: ["exchangeRate"],
  });

  registerStore({
    key: "layout",
    factory: (_config: unknown, driver: PersistenceDriver) =>
      createLayoutStore(driver),
  });

  // ── Tier 2: Depend on other stores ─────────────────────────────────────
  registerStore({
    key: "commands",
    factory: (
      _config: unknown,
      _driver: PersistenceDriver,
      stores: Map<string, unknown>,
    ) =>
      createCommandStore({
        appStore: stores.get("app") as AppStore,
        apiStore: stores.get("api") as ApiStore,
        toastStore: stores.get("toast") as ToastStore,
        themeStore: stores.get("theme") as ReturnType<typeof createThemeStore>,
        languageStore: stores.get("language") as ReturnType<
          typeof createLanguageStore
        >,
        currencyStore: stores.get("currency") as ReturnType<
          typeof createCurrencyStore
        >,
      }),
    dependsOn: ["app", "api", "toast", "theme", "language", "currency"],
    noPersistence: true,
  });

  // ── Opt-in stores ──────────────────────────────────────────────────────
  registerStore({
    key: "cart",
    factory: (config: unknown) => {
      const c = config as Cfg;
      return createCartStore(c.cart as CartStoreConfig<unknown>);
    },
    conditional: "cart",
    optional: true,
    noPersistence: true,
  });

  registerStore({
    key: "session",
    factory: (config: unknown) => {
      const c = config as Cfg;
      const authConfig = c.auth as { enabled?: boolean } | undefined;
      if (authConfig?.enabled === false) return null;
      return createSessionStore();
    },
    conditional: "auth",
    optional: true,
    noPersistence: true,
  });
}
