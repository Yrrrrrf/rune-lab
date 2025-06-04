// File: src/lib/tools/schema-transformer.ts

import type {
	ColumnMetadata,
	ColumnReference,
	EnumMetadata,
	FunctionMetadata,
	FunctionParameter,
	SchemaMetadata,
	TableMetadata,
	ViewMetadata,
} from "@yrrrrrf/prism-ts";

import type {
	RLColumnMetadata,
	RLColumnReference,
	RLEnumMetadata,
	RLFunctionKind,
	RLFunctionMetadata,
	RLFunctionParameter,
	RLSchemaData,
	RLTableMetadata,
	RLViewMetadata,
} from "../components/stores/explorer.svelte.ts";

// --- Helper Functions ---

function transformPrismColumnReference(
	ref?: ColumnReference | null, // Updated to accept null
): RLColumnReference | undefined {
	if (!ref) return undefined; // Handles both null and undefined
	return {
		schema: ref.schema,
		table: ref.table,
		column: ref.column,
	};
}

export function transformPrismColumn(prismCol: ColumnMetadata): RLColumnMetadata {
	return {
		name: prismCol.name,
		type: prismCol.type,
		nullable: prismCol.nullable,
		// Corrected to use snake_case properties from prism-ts types
		isPrimaryKey: prismCol.is_pk === true,
		isEnum: prismCol.is_enum === true,
		references: transformPrismColumnReference(prismCol.references), // Pass directly
	};
}

function transformPrismTableOrView(
	prismEntity: TableMetadata | ViewMetadata,
	schema: string,
): RLTableMetadata | RLViewMetadata {
	return {
		name: prismEntity.name,
		schema: schema,
		columns: (prismEntity.columns || []).map(transformPrismColumn),
	};
}

function transformPrismEnum(prismEnum: EnumMetadata, schema: string): RLEnumMetadata {
	return {
		name: prismEnum.name,
		schema: schema,
		values: prismEnum.values || [],
	};
}

function transformPrismFunctionParameter(param: FunctionParameter): RLFunctionParameter {
	return {
		name: param.name,
		type: param.type,
		mode: param.mode as RLFunctionParameter["mode"] || "IN",
		// Corrected to use snake_case properties
		hasDefault: param.has_default === true,
		defaultValue: param.default_value === undefined ? null : String(param.default_value),
	};
}

function determineRLFunctionKind(prismFn: FunctionMetadata): RLFunctionKind {
	// Corrected to use snake_case property
	const objectType = (prismFn.object_type || "").toUpperCase();
	const fnType = (prismFn.type || "").toUpperCase();

	if (objectType === "PROCEDURE") return "PROCEDURE";
	if (objectType === "TRIGGER") return "TRIGGER";
	if (objectType === "FUNCTION" || objectType === "") {
		if (fnType === "SCALAR") return "SCALAR";
		if (fnType === "TABLE") return "TABLE";
		if (fnType === "SET") return "SET_RETURNING";
		if (fnType === "AGGREGATE") return "AGGREGATE";
		if (fnType === "WINDOW") return "WINDOW";
		return "FUNCTION";
	}
	return "UNKNOWN";
}

export function transformPrismFunction(
	prismFn: FunctionMetadata,
	schema: string,
): RLFunctionMetadata {
	const kind = determineRLFunctionKind(prismFn);

	const transformed: RLFunctionMetadata = {
		name: prismFn.name,
		schema: schema,
		kind: kind,
		description: prismFn.description === undefined ? null : prismFn.description,
		parameters: (prismFn.parameters || []).map(transformPrismFunctionParameter),
		// Corrected to use snake_case properties
		returnType: prismFn.return_type === undefined ? null : prismFn.return_type,
		isStrict: prismFn.is_strict === true,
	};

	// If prism-py ever adds detailed trigger data directly to FunctionMetadata for triggers,
	// you would map it here. The dt-schemas.json shows `trigger_data` on the top-level trigger object,
	// which prism-ts's TriggerMetadata should capture.
	// If you need to transform prismFn.trigger_data (assuming it exists on PrismFunctionMetadata if it's a trigger)
	// to RLFunctionMetadata.triggerData:
	if (kind === "TRIGGER" && (prismFn as any).trigger_data) { // Cast to any if trigger_data is not on PrismFunctionMetadata
		const prismTriggerData = (prismFn as any).trigger_data;
		transformed.triggerData = {
			timing: prismTriggerData.timing,
			events: prismTriggerData.events,
			// The dt-schemas.json shows table_schema and table_name on trigger_data.
			targetTableSchema: prismTriggerData.table_schema,
			targetTableName: prismTriggerData.table_name,
		};
	}

	return transformed;
}

// --- Main Transformation Function ---

export function transformPrismSchemasToRLData(
	prismSchemas: SchemaMetadata[],
): RLSchemaData[] {
	return prismSchemas.map((prismSchema) => {
		const rlSchema: RLSchemaData = {
			name: prismSchema.name,
			tables: {},
			views: {},
			enums: {},
			functions: {},
			procedures: {},
			triggers: {},
		};

		Object.entries(prismSchema.tables || {}).forEach(([name, table]) => {
			rlSchema.tables[name] = transformPrismTableOrView(
				table,
				prismSchema.name,
			) as RLTableMetadata;
		});
		Object.entries(prismSchema.views || {}).forEach(([name, view]) => {
			rlSchema.views[name] = transformPrismTableOrView(
				view,
				prismSchema.name,
			) as RLViewMetadata;
		});
		Object.entries(prismSchema.enums || {}).forEach(([name, enumData]) => {
			rlSchema.enums[name] = transformPrismEnum(enumData, prismSchema.name);
		});
		// The 'functions', 'procedures', and 'triggers' from prism-ts SchemaMetadata
		// are all of type Record<string, FunctionMetadata> or Record<string, TriggerMetadata>.
		// TriggerMetadata extends FunctionMetadata.
		Object.entries(prismSchema.functions || {}).forEach(([name, func]) => {
			rlSchema.functions[name] = transformPrismFunction(func, prismSchema.name);
		});
		Object.entries(prismSchema.procedures || {}).forEach(([name, proc]) => {
			// Procedures are also FunctionMetadata in prism-ts
			rlSchema.procedures[name] = transformPrismFunction(proc, prismSchema.name);
		});
		Object.entries(prismSchema.triggers || {}).forEach(([name, trig]) => {
			// Triggers are TriggerMetadata in prism-ts, which extends FunctionMetadata.
			// transformPrismFunction should be able to handle it if TriggerMetadata fields
			// are a superset or compatible. If specific trigger_data needs transformation,
			// ensure transformPrismFunction handles it.
			rlSchema.triggers[name] = transformPrismFunction(trig, prismSchema.name);
		});

		return rlSchema;
	});
}
