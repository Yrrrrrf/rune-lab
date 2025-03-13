// src/lib/stores/api.svelte.ts

class APIStore {
    URL: string = $state("http://localhost:8000");
    VERSION: string = $state("v1");
    IS_CONNECTED: boolean = $state(false);

    constructor() {
        this.checkConnection();
    }

    async checkConnection(): Promise<void> {
        try {
            const response = await fetch(`${this.URL}/health`, { 
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            this.IS_CONNECTED = response.ok;
        } catch (error) {
            this.IS_CONNECTED = false;
            console.error("API connection error:", error);
        }
    }

    setApiUrl(url: string): void {
        this.URL = url;
        this.checkConnection();
    }

    setApiVersion(version: string): void {
        this.VERSION = version;
    }
}

export const apiStore: APIStore = new APIStore();