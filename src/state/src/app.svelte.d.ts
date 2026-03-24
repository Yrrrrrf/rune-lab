/**
 * Application metadata interface
 */
export interface AppData {
  name: string;
  version: string;
  description: string;
  author: string;
  repository?: string;
  license?: string;
  homepage?: string;
}
/**
 * App Store
 * Manages application metadata and identity
 */
export declare class AppStore {
  #private;
  name: string;
  version: string;
  description: string;
  author: string;
  repository: string;
  license: string;
  homepage: string;
  customIcons: Record<string, string>;
  /**
   * Initialize app store with metadata.
   *
   * @contract init() is idempotent. Call it once at app startup via RuneProvider.
   * Subsequent calls are silently ignored to maintain stability across SSR/CSR cycles.
   */
  init(data: Partial<AppData>): void;
  /**
   * @internal Test-only. Resets initialization guard.
   */
  __reset(): void;
  /**
   * Get full app information object
   */
  get info(): AppData;
  /**
   * Registers custom SVG icons to be available globally in the Icon component
   */
  registerIcons(icons: Record<string, string>): void;
}
export declare function createAppStore(): AppStore;
export declare function getAppStore(): AppStore;
