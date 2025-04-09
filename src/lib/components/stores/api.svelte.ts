// src/lib/stores/api.svelte.ts
import { BaseClient, type CrudOperations, Prism } from "@yrrrrrf/prism-ts";

// Simple string union type
export type ConnectionState = "connected" | "connecting" | "disconnected";

// API configuration interface
export interface APIConfig {
	url: string;
	version: string;
	maxRetries?: number;
	retryTimeout?: number;
}

class APIStore {
	// URL: string = $state("http://3.88.132.195:8000");
	URL: string = $state("http://localhost:8000");
	VERSION: string = $state("v1");
	connectionState: ConnectionState = $state("disconnected");

	// Private configuration
	private retryCount = $state(0);
	private maxRetries = $state(3);
	private retryTimeout = $state(3000); // 3 seconds
	private retryTimerId?: number;

	// Lazy-initialized clients
	private _baseClient?: BaseClient;
	private _prismClient?: Prism;

	constructor() {
		this.checkConnection();
	}

	/**
	 * Initialize API store with configuration
	 */
	init(config: Partial<APIConfig> = {}): void {
		// Update only provided values
		if (config.url) this.URL = config.url;
		if (config.version) this.VERSION = config.version;
		if (config.maxRetries !== undefined) this.maxRetries = config.maxRetries;
		if (config.retryTimeout !== undefined) this.retryTimeout = config.retryTimeout;

		// Reset clients and check connection
		this._resetClients();
		this.checkConnection();

		console.log("🌐 API configured:", {
			url: this.URL,
			version: this.VERSION,
			maxRetries: this.maxRetries,
			retryTimeout: this.retryTimeout,
		});
	}

	/**
	 * Get base client (lazy initialization)
	 */
	get baseClient(): BaseClient {
		if (!this._baseClient) {
			this._baseClient = new BaseClient(this.URL);
		}
		return this._baseClient;
	}

	/**
	 * Get Prism client (lazy initialization)
	 */
	get prism(): Prism {
		if (!this._prismClient) {
			this._prismClient = new Prism(this.baseClient);
		}
		return this._prismClient;
	}

	// Status getters
	get IS_CONNECTED(): boolean {
		return this.connectionState === "connected";
	}

	get IS_LOADING(): boolean {
		return this.connectionState === "connecting";
	}

	/**
	 * Check API connection
	 */
	async checkConnection(): Promise<void> {
		this.connectionState = "connecting";

		try {
			const response = await fetch(`${this.URL}/health`, {
				method: "GET",
				headers: { "Accept": "application/json" },
				signal: AbortSignal.timeout(10000),
			});

			if (response.ok) {
				this.connectionState = "connected";
				this.retryCount = 0;
				console.log("🌐 API connected:", this.URL);
				return;
			}

			this._handleRetry();
		} catch (error) {
			const errorMessage = error instanceof Error
				? error.message.split(".")[0]
				: "Unknown error";
			console.error(`API connection error: \x1b[90m${errorMessage}\x1b[0m`);
			this._handleRetry();
		}
	}

	/**
	 * Handle connection retry
	 */
	private _handleRetry(): void {
		this.retryCount++;

		if (this.retryCount <= this.maxRetries) {
			console.log(`Retrying connection (${this.retryCount}/${this.maxRetries})...`);

			if (this.retryTimerId) {
				clearTimeout(this.retryTimerId);
			}

			this.retryTimerId = setTimeout(() => {
				this.checkConnection();
			}, this.retryTimeout) as unknown as number;
		} else {
			console.error(`Connection failed after ${this.maxRetries} attempts`);
			this.connectionState = "disconnected";
			this.retryCount = 0;
		}
	}

	/**
	 * Reset client instances when configuration changes
	 */
	private _resetClients(): void {
		this._baseClient = undefined;
		this._prismClient = undefined;
		this.retryCount = 0;
	}

	/**
	 * Set API URL and reconnect
	 */
	setApiUrl(url: string): void {
		if (url !== this.URL) {
			this.URL = url;
			this._resetClients();
			this.checkConnection();
		}
	}

	/**
	 * Set API version
	 */
	setApiVersion(version: string): void {
		this.VERSION = version;
	}

	/**
	 * Manually reconnect to API
	 */
	reconnect(): void {
		this._resetClients();
		this.checkConnection();
	}

	/**
	 * Get table operations with automatic connection check
	 * Type-safe wrapper around Prism client
	 */
	async getTableOperations<T = Record<string, unknown>>(
		schemaName: string,
		tableName: string,
	): Promise<CrudOperations<T>> {
		if (!this.IS_CONNECTED) {
			await this.checkConnection();
			if (!this.IS_CONNECTED) {
				throw new Error("API not connected");
			}
		}

		return this.prism.getTableOperations<T>(schemaName, tableName);
	}
}

export const apiStore = new APIStore();
