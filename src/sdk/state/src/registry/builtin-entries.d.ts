/**
 * Register all built-in stores.
 * Called once when the module is imported — idempotent via the Map's overwrite behavior.
 *
 * Factory signature: (config, driver, stores) => StoreInstance | null
 * - `config` is the full RuneLabConfig (typed as `unknown` by StoreFactory)
 * - `driver` is the resolved PersistenceDriver
 * - `stores` is a Map of already-created stores (for dependency injection)
 */
export declare function registerBuiltinStores(): void;
