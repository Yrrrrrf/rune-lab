// src/lib/forge.svelte.ts
import { BaseClient, TsForge, type SchemaMetadata } from "ts-forge";


interface ApiConfig {
    URL: string;
    VERSION: string;
    TIMEOUT: number;
    IS_CONNECTED: boolean;
}

export class ApiStore {
    URL = $state('http://localhost:8000');
    VERSION = $state('v0-alpha');
    TIMEOUT = $state(30000); // 30 seconds
    IS_CONNECTED = $state(false);

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
}

export const apiStore: ApiStore = new ApiStore();
export const forge: TsForge = new TsForge(new BaseClient(apiStore.URL));
