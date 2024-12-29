// src/lib/stores/api.svelte.ts
interface ApiConfig {
    URL: string;
    VERSION: string;
    TIMEOUT: number;
    IS_CONNECTED: boolean;
}

export class ApiStore {
    // Core API configuration
    URL = $state(import.meta.env.VITE_URL || 'http://localhost:8000');
    VERSION = $state('v1');
    TIMEOUT = $state(30000); // 30 seconds
    IS_CONNECTED = $state(false);

    // Computed API base URL
    baseUrl = $derived(`${this.URL}/api/${this.VERSION}`);

    // Initialize API configuration
    init(config: Partial<ApiConfig>) {
        if (config.URL) this.URL = config.URL;
        if (config.VERSION) this.VERSION = config.VERSION;
        if (config.TIMEOUT) this.TIMEOUT = config.TIMEOUT;

        console.log('🌐 API initialized:', {
            url: this.URL,
            version: this.VERSION,
            timeout: this.TIMEOUT
        });

        this.checkConnection();
    }

    // Check API connection
    async checkConnection() {
        try {
            const response = await fetch(this.URL + '/health', {
                method: 'GET',
                signal: AbortSignal.timeout(5000) // 5 second timeout for health check
            });
            this.IS_CONNECTED = response.ok;
        } catch (error) {
            console.error('API connection check failed:', error);
            this.IS_CONNECTED = false;
        }
    }

    // Get full API configuration
    getConfig(): ApiConfig {
        return {
            URL: this.URL,
            VERSION: this.VERSION,
            TIMEOUT: this.TIMEOUT,
            IS_CONNECTED: this.IS_CONNECTED
        };
    }
}

// Export singleton instance
export const apiStore = new ApiStore();
