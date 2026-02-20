// src/lib/stores/app-config.svelte.ts
import { getContext } from "svelte";

// SDK Package - Application Metadata Management

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
export class AppStore {
  // State
  name = $state("Rune Lab");
  version = $state("0.0.1");
  description = $state("Modern toolkit for Svelte 5 Runes");
  author = $state("Yrrrrrf");
  repository = $state("https://github.com/Yrrrrrf/rune-lab");
  license = $state("MIT");
  homepage = $state("https://jsr.io/@yrrrrrf/rune-lab");

  #initialized = false;

  /**
   * Initialize app store with metadata
   */
  init(data: Partial<AppData>): void {
    if (this.#initialized) return;

    if (data.name) this.name = data.name;
    if (data.version) this.version = data.version;
    if (data.description) this.description = data.description;
    if (data.author) this.author = data.author;
    if (data.repository) this.repository = data.repository;
    if (data.license) this.license = data.license;
    if (data.homepage) this.homepage = data.homepage;

    this.#initialized = true;
  }

  /**
   * Get full app information object
   */
  get info(): AppData {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      author: this.author,
      repository: this.repository,
      license: this.license,
      homepage: this.homepage,
    };
  }
}

// Export singleton instance

export function createAppStore() {
  return new AppStore();
}

export function getAppStore() {
  return getContext<AppStore>("rl:app");
}
