// src/lib/stores/database.svelte.ts

import { BaseClient, TsForge, type SchemaMetadata } from "ts-forge";

export interface DatabaseState {
    schemas: Record<string, SchemaMetadata>;
    tables: Record<string, Record<string, any>>;
    activeSchema: string | null;
    activeTable: string | null;
    showModal: boolean;
    currentOperation: 'POST' | 'GET' | 'PUT' | 'DELETE' | null;
}

class DatabaseStore {   
    // Core state with proper initialization
    schemas = $state<Record<string, SchemaMetadata>>({});
    tables = $state<Record<string, Record<string, any>>>({});
    activeSchema = $state<string | null>(null);
    activeTable = $state<string | null>(null);
    showModal = $state(false);
    currentOperation = $state<DatabaseState['currentOperation']>(null);
    
    // Change this derived state
    currentTables = $derived(
        this.activeSchema ? this.schemas[this.activeSchema] : null
    );

    toggleSchema(schema: string) {
        // Simple toggle, don't clear if already active
        this.activeSchema = schema;
        console.log('Active schema:', this.activeSchema, 'Tables:', this.schemas[schema]);
    }
    // Base client
    private baseClient = new BaseClient('http://localhost:8000/');
    private forge = new TsForge(this.baseClient);


    // Table management
    setActiveTable(schema: string, table: string) {
        this.activeSchema = schema;
        this.activeTable = table;
        console.log('Set active:', { schema, table });
    }

    // CRUD operations
    setOperation(operation: DatabaseState['currentOperation']) {
        this.currentOperation = operation;
        this.showModal = !!operation;
    }

    async handleCrudOperation(operation: DatabaseState['currentOperation']) {
        this.setOperation(operation);
    }

    // Initialize the store
    async init() {
        try {
            await this.forge.init();
            this.schemas = this.forge.schemaLookup;
            console.log('Database store initialized:', { 
                schemas: Object.keys(this.schemas)
            });
        } catch (error) {
            console.error('Database store initialization failed:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const databaseStore = new DatabaseStore();