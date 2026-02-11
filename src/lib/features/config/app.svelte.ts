// src/lib/stores/app-config.svelte.ts
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
 *
 * Features:
 * - App name, version, description
 * - Author and repository information
 * - Initialization with partial updates
 * - Console branding on init
 */
class AppStore {
  // State
  name: string = $state("My Application");
  version: string = $state("0.1.0");
  description: string = $state("A modern application");
  author: string = $state("Unknown");
  repository?: string = $state(undefined);
  license?: string = $state(undefined);
  homepage?: string = $state(undefined);

  private initialized: boolean = false;

  /**
   * Initialize app store with metadata
   *
   * @param data - Application metadata (partial update)
   * @param data.name - Application name
   * @param data.version - Application version (semver recommended)
   * @param data.description - Application description
   * @param data.author - Application author
   * @param data.repository - Repository URL (optional)
   * @param data.license - License identifier (optional)
   * @param data.homepage - Homepage URL (optional)
   */
  init(data: Partial<AppData>): void {
    if (this.initialized) {
      console.warn("⚠️ AppStore already initialized");
      return;
    }

    // Update only provided values
    if (data.name) this.name = data.name;
    if (data.version) this.version = data.version;
    if (data.description) this.description = data.description;
    if (data.author) this.author = data.author;
    if (data.repository) this.repository = data.repository;
    if (data.license) this.license = data.license;
    if (data.homepage) this.homepage = data.homepage;

    this.initialized = true;

    // Pretty console output
    this._logAppInit();
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

  /**
   * Get formatted version string
   * Useful for display purposes
   */
  get versionString(): string {
    return `v${this.version}`;
  }

  /**
   * Get app title with version
   */
  get titleWithVersion(): string {
    return `${this.name} v${this.version}`;
  }

  /**
   * Check if repository is available
   */
  get hasRepository(): boolean {
    return !!this.repository;
  }

  /**
   * Check if homepage is available
   */
  get hasHomepage(): boolean {
    return !!this.homepage;
  }

  /**
   * Update app version
   * Useful for version management during development
   */
  updateVersion(version: string): void {
    this.version = version;
    console.log(`📦 Version updated to: v${version}`);
  }

  // Private methods

  /**
   * Log app initialization to console with styling
   */
  private _logAppInit(): void {
    console.clear();

    // Banner style
    console.log(
      "%c╔══════════════════════════════════════════════╗",
      "color: #00d9ff; font-weight: bold;",
    );
    console.log(
      `%c║  ${this.name.padEnd(42)}  ║`,
      "color: #00d9ff; font-weight: bold;",
    );
    console.log(
      "%c╚══════════════════════════════════════════════╝",
      "color: #00d9ff; font-weight: bold;",
    );

    // App details
    console.log("\n📦 Application Details:");
    console.log(`   Name:        ${this.name}`);
    console.log(`   Version:     v${this.version}`);
    console.log(`   Author:      ${this.author}`);
    console.log(`   Description: ${this.description}`);

    if (this.repository) {
      console.log(`   Repository:  ${this.repository}`);
    }
    if (this.license) {
      console.log(`   License:     ${this.license}`);
    }
    if (this.homepage) {
      console.log(`   Homepage:    ${this.homepage}`);
    }

    console.log("\n✨ Application initialized successfully!\n");
  }
}

// Export singleton instance
export const appStore = new AppStore();
