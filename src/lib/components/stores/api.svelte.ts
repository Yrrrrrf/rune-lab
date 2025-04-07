// src/lib/stores/api.svelte.ts

/**
 * Enum representing possible connection states for the API
 */
export enum ConnectionState {
	CONNECTED = "connected",
	CONNECTING = "connecting",
	DISCONNECTED = "disconnected",
}

class APIStore {
	URL: string = $state("http://localhost:8000");
	VERSION: string = $state("v1");

	// Connection state using the enum
	connectionState: ConnectionState = $state(ConnectionState.DISCONNECTED);

	// Track retry attempts
	private retryCount: number = $state(0);
	private maxRetries: number = 3;
	private retryTimeout: number = 5000; // 5 seconds
	private retryTimerId: number | undefined;

	constructor() {
		this.checkConnection();
	}

	/**
	 * Check if the connection state is CONNECTED
	 */
	get IS_CONNECTED(): boolean {
		return this.connectionState === ConnectionState.CONNECTED;
	}

	/**
	 * Check if the connection state is CONNECTING
	 */
	get IS_LOADING(): boolean {
		return this.connectionState === ConnectionState.CONNECTING;
	}

	/**
	 * Attempt to connect to the API with retry mechanism
	 */
	async checkConnection(): Promise<void> {
		// Set state to connecting
		this.connectionState = ConnectionState.CONNECTING;

		try {
			const response = await fetch(`${this.URL}/health`, {
				method: "GET",
				headers: { "Accept": "application/json" },
				// Add a timeout to avoid hanging requests
				signal: AbortSignal.timeout(10000),
			});

			if (response.ok) {
				// Connection successful
				this.connectionState = ConnectionState.CONNECTED;
				this.retryCount = 0; // Reset retry counter on success
				return;
			}

			// If response not OK, handle retry
			this.handleRetry();
		} catch (error) {
			console.error("API connection error:", error);
			this.handleRetry();
		}
	}

	/**
	 * Handle retry logic
	 */
	private handleRetry(): void {
		this.retryCount++;

		if (this.retryCount <= this.maxRetries) {
			console.log(
				`Connection attempt failed. Retrying (${this.retryCount}/${this.maxRetries}) in ${
					this.retryTimeout / 1000
				}s...`,
			);

			// Clear any existing timers
			if (this.retryTimerId) {
				clearTimeout(this.retryTimerId);
			}

			// Schedule retry
			this.retryTimerId = setTimeout(() => {
				this.checkConnection();
			}, this.retryTimeout) as unknown as number;
		} else {
			// Max retries reached
			console.error(`Connection failed after ${this.maxRetries} attempts`);
			this.connectionState = ConnectionState.DISCONNECTED;
			this.retryCount = 0; // Reset for next time
		}
	}

	/**
	 * Set the API URL and initiate a connection check
	 */
	setApiUrl(url: string): void {
		this.URL = url;
		this.retryCount = 0; // Reset retry counter
		this.checkConnection();
	}

	/**
	 * Set the API version
	 */
	setApiVersion(version: string): void {
		this.VERSION = version;
	}

	/**
	 * Manual reconnect method that can be called by user
	 */
	reconnect(): void {
		this.retryCount = 0;
		this.checkConnection();
	}
}

export const apiStore: APIStore = new APIStore();
