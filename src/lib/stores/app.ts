// src/lib/stores/app.ts
import { writable } from 'svelte/store';

// Type definition
export interface AppData {
    name: string;
    version: string;
    description: string;
    author: string;
}

// Default values
const defaultData: AppData = {
    name: 'Unnamed App',
    version: '0.0.0',
    description: 'No description provided',
    author: 'Anonymous'
};

// Create the store
function createAppStore() {
    const { subscribe, set, update } = writable<AppData>(defaultData);

    return {
        subscribe,
        init: (data: Partial<AppData>) => {
            update(current => ({ ...current, ...data }));
        },
        reset: () => set(defaultData)
    };
}

// Export the store instance
export const app = createAppStore();