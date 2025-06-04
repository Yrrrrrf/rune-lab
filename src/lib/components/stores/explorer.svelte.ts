// src/lib/components/stores/explorer.svelte.ts
// Define the entity types directly, since Svelte components do not export types
export type ExplorerEntityType =
	| "tables"
	| "views"
	| "enums"
	| "functions"
	| "procedures"
	| "triggers";

interface Breadcrumb {
	schema: string;
	entityType: ExplorerEntityType;
	entityName?: string | null; // Name of specific table/view if focused
	label: string; // Display label for the breadcrumb
}

interface ExplorerState {
	activeSchemaName: string | null;
	activeEntityType: ExplorerEntityType;
	focusedEntityName: string | null; // e.g., table name to highlight or scroll to
	history: Breadcrumb[]; // For back navigation or breadcrumbs display
}

class ExplorerStore {
	#state = $state<ExplorerState>({
		activeSchemaName: null,
		activeEntityType: "tables",
		focusedEntityName: null,
		history: [],
	});

	get activeSchemaName() {
		return this.#state.activeSchemaName;
	}
	get activeEntityType() {
		return this.#state.activeEntityType;
	}
	get focusedEntityName() {
		return this.#state.focusedEntityName;
	}
	get breadcrumbs(): Readonly<Breadcrumb[]> {
		return this.#state.history;
	}

	constructor() {
		// You could load initial state from localStorage here if needed
	}

	selectSchema(name: string | null) {
		if (this.#state.activeSchemaName === name) return;

		this.#state.activeSchemaName = name;
		this.#state.activeEntityType = "tables"; // Default to tables when schema changes
		this.#state.focusedEntityName = null;
		this._updateHistory({
			schema: name || "",
			entityType: "tables",
			label: name ? `Schema: ${name}` : "Schemas",
		});
		console.log("[ExplorerStore] Schema selected:", name);
	}

	selectEntityType(type: ExplorerEntityType) {
		if (this.#state.activeEntityType === type) return;

		this.#state.activeEntityType = type;
		this.#state.focusedEntityName = null; // Clear focus when changing entity type
		if (this.#state.activeSchemaName) {
			this._updateHistory({
				schema: this.#state.activeSchemaName,
				entityType: type,
				label: `${
					type.charAt(0).toUpperCase() + type.slice(1)
				} in ${this.#state.activeSchemaName}`,
			});
		}
		console.log("[ExplorerStore] Entity type selected:", type);
	}

	navigateToEntity(schema: string, entityType: ExplorerEntityType, entityName: string) {
		console.log("[ExplorerStore] Navigating to entity:", {
			schema,
			entityType,
			entityName,
		});
		this.#state.activeSchemaName = schema;
		this.#state.activeEntityType = entityType;
		this.#state.focusedEntityName = entityName; // This can be used to scroll/highlight
		this._updateHistory({
			schema: schema,
			entityType: entityType,
			entityName: entityName,
			label: `${entityName} (${entityType.slice(0, -1)})`,
		});
	}

	focusOnEntity(entityName: string | null) {
		this.#state.focusedEntityName = entityName;
		// Optionally update history if focus implies a deeper navigation step
	}

	goBack() {
		if (this.#state.history.length > 1) {
			this.#state.history.pop(); // Remove current state
			const prevState = this.#state.history[this.#state.history.length - 1];
			if (prevState) {
				this.#state.activeSchemaName = prevState.schema;
				this.#state.activeEntityType = prevState.entityType;
				this.#state.focusedEntityName = prevState.entityName || null;
				console.log("[ExplorerStore] Navigated back to:", prevState);
			}
		} else {
			console.log("[ExplorerStore] No more history to go back to.");
			// Optionally reset to a default state or clear selection
			// this.selectSchema(null);
		}
	}

	_updateHistory(breadcrumb: Omit<Breadcrumb, "label"> & { label?: string }) {
		const newCrumb: Breadcrumb = {
			...breadcrumb,
			label: breadcrumb.label ||
				`${breadcrumb.entityType} in ${breadcrumb.schema}${
					breadcrumb.entityName ? ` > ${breadcrumb.entityName}` : ""
				}`,
		};

		// Avoid duplicate consecutive entries
		const lastEntry = this.#state.history[this.#state.history.length - 1];
		if (
			lastEntry &&
			lastEntry.schema === newCrumb.schema &&
			lastEntry.entityType === newCrumb.entityType &&
			lastEntry.entityName === newCrumb.entityName
		) {
			return;
		}

		// Simple history: just push. For more complex, consider replacing if same schema/type but different entity.
		this.#state.history.push(newCrumb);
		// Optional: limit history size
		// if (this.#state.history.length > 10) this.#state.history.shift();
	}

	reset() {
		this.#state.activeSchemaName = null;
		this.#state.activeEntityType = "tables";
		this.#state.focusedEntityName = null;
		this.#state.history = [];
	}
}

export const explorerStore = new ExplorerStore();

// Some...
// Some...
// Some...

// --- Column & Reference Types ---
export interface RLColumnReference {
	schema: string;
	table: string;
	column: string;
}

export interface RLColumnMetadata {
	name: string;
	type: string; // SQL data type string
	nullable: boolean;
	isPrimaryKey: boolean;
	isEnum: boolean;
	references?: RLColumnReference;
}

// --- Entity Types (Tables, Views) ---
export interface RLBaseEntityMetadata {
	name: string;
	schema: string;
}

export interface RLTableMetadata extends RLBaseEntityMetadata {
	columns: RLColumnMetadata[];
}

export interface RLViewMetadata extends RLBaseEntityMetadata {
	columns: RLColumnMetadata[];
}

// --- Enum Type ---
export interface RLEnumMetadata extends RLBaseEntityMetadata {
	values: string[];
}

// --- Function & Parameter Types ---
export interface RLFunctionParameter {
	name: string;
	type: string; // SQL data type string
	mode: "IN" | "OUT" | "INOUT" | "VARIADIC";
	hasDefault: boolean;
	defaultValue?: string | null;
}

// File: src/lib/types/explorer.ts
export type RLFunctionKind =
	| "SCALAR"
	| "TABLE"
	| "SET_RETURNING"
	| "AGGREGATE"
	| "WINDOW"
	| "PROCEDURE"
	| "TRIGGER"
	| "FUNCTION"
	| "UNKNOWN";

export interface RLFunctionMetadata extends RLBaseEntityMetadata {
	kind: RLFunctionKind; // Combines prism-ts's 'type' and 'objectType' for simpler UI logic
	description?: string | null;
	parameters: RLFunctionParameter[];
	returnType?: string | null;
	isStrict: boolean;
	// Add trigger-specific data if needed for future UI features for triggers
	triggerData?: {
		timing: string; // BEFORE, AFTER, INSTEAD OF
		events: string[]; // INSERT, UPDATE, DELETE, TRUNCATE
		targetTableSchema: string;
		targetTableName: string;
	};
}

// --- Full Schema ---
export interface RLSchemaData {
	name: string;
	tables: Record<string, RLTableMetadata>;
	views: Record<string, RLViewMetadata>;
	enums: Record<string, RLEnumMetadata>;
	functions: Record<string, RLFunctionMetadata>; // Includes procedures and triggers as function-like objects
	procedures: Record<string, RLFunctionMetadata>; // If you want to keep procedures separate
	triggers: Record<string, RLFunctionMetadata>; // If you want to keep triggers separate
}

export interface RLApiInterfaceActionParams {
	operation: "GET" | "POST" | "PUT" | "DELETE";
}
