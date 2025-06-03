// File: src/lib/tools/schema-transformer.ts

import type {
	ColumnMetadata as PrismColumnMetadata, // This is prism-ts's ColumnMetadata
	ColumnReference as PrismColumnReference,
	EnumMetadata as PrismEnumMetadata,
	FunctionMetadata as PrismFunctionMetadata,
	FunctionParameter as PrismFunctionParameter,
	SchemaMetadata as PrismSchemaMetadata,
	TableMetadata as PrismTableMetadata,
	ViewMetadata as PrismViewMetadata,
} from "@yrrrrrf/prism-ts";

// CORRECTED IMPORT PATH HERE:
import type {
	RLColumnMetadata, // This is Rune Lab's RLColumnMetadata
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
	ref?: PrismColumnReference,
): RLColumnReference | undefined {
	if (!ref) return undefined;
	return {
		schema: ref.schema, // prism-ts seems to use 'schema' directly
		table: ref.table,
		column: ref.column,
	};
}

export function transformPrismColumn(prismCol: PrismColumnMetadata): RLColumnMetadata {
	return {
		name: prismCol.name,
		type: prismCol.type,
		nullable: prismCol.nullable,
		// Adapting from prism-ts field `isPrimaryKey` to `isPrimaryKey`
		// And `isEnum` to `isEnum`
		isPrimaryKey: prismCol.isPrimaryKey === true,
		isEnum: prismCol.isEnum === true,
		references: transformPrismColumnReference(prismCol.references),
	};
}

function transformPrismTableOrView(
	prismEntity: PrismTableMetadata | PrismViewMetadata,
	schema: string,
): RLTableMetadata | RLViewMetadata {
	return {
		name: prismEntity.name,
		schema: schema, // prism-ts's TableMetadata includes schema
		columns: (prismEntity.columns || []).map(transformPrismColumn),
	};
}

function transformPrismEnum(prismEnum: PrismEnumMetadata, schema: string): RLEnumMetadata {
	return {
		name: prismEnum.name,
		schema: schema, // prism-ts's EnumMetadata includes schema
		values: prismEnum.values || [],
	};
}

function transformPrismFunctionParameter(param: PrismFunctionParameter): RLFunctionParameter {
	return {
		name: param.name,
		type: param.type,
		mode: param.mode as RLFunctionParameter["mode"] || "IN", // prism-ts uses string
		hasDefault: param.hasDefault === true,
		defaultValue: param.defaultValue === undefined ? null : String(param.defaultValue),
	};
}

function determineRLFunctionKind(prismFn: PrismFunctionMetadata): RLFunctionKind {
	const objectType = (prismFn.objectType || "").toUpperCase();
	const fnType = (prismFn.type || "").toUpperCase(); // e.g., SCALAR, TABLE, SET

	if (objectType === "PROCEDURE") return "PROCEDURE";
	if (objectType === "TRIGGER") return "TRIGGER";
	if (objectType === "FUNCTION" || objectType === "") { // Default to FUNCTION if objectType is missing
		if (fnType === "SCALAR") return "SCALAR";
		if (fnType === "TABLE") return "TABLE";
		if (fnType === "SET") return "SET_RETURNING"; // prism-ts calls it 'set'
		if (fnType === "AGGREGATE") return "AGGREGATE";
		if (fnType === "WINDOW") return "WINDOW";
		// todo: Check if prism-ts has other specific function types
		// todo: If prism-ts has a 'FUNCTION' type, we can return it here
		// todo: Check if we need to handle 'FUNCTION' as a generic type...
		return "FUNCTION"; // Generic function if type is not more specific
		// todo: (probably not needed, as we can use 'FUNCTION' for generic functions)
		// todo: (probably not needed, as we can use 'FUNCTION' for generic functions)
		// todo: (probably not needed, as we can use 'FUNCTION' for generic functions)
	}
	return "UNKNOWN";
}

export function transformPrismFunction(
	prismFn: PrismFunctionMetadata,
	schema: string,
): RLFunctionMetadata {
	const kind = determineRLFunctionKind(prismFn);

	const transformed: RLFunctionMetadata = {
		name: prismFn.name,
		schema: schema, // prism-ts's FunctionMetadata includes schema
		kind: kind,
		description: prismFn.description === undefined ? null : prismFn.description,
		parameters: (prismFn.parameters || []).map(transformPrismFunctionParameter),
		returnType: prismFn.returnType === undefined ? null : prismFn.returnType,
		isStrict: prismFn.isStrict === true,
	};

	// Example: If prism-ts provides trigger-specific data on its FunctionMetadata when objectType is 'trigger'
	// We would map it here to transformed.triggerData
	// if (kind === 'TRIGGER' && (prismFn as any).triggerData) {
	//     transformed.triggerData = {
	//         timing: (prismFn as any).triggerData.timing,
	//         events: (prismFn as any).triggerData.events,
	//         targetTableSchema: (prismFn as any).triggerData.table_schema,
	//         targetTableName: (prismFn as any).triggerData.table_name,
	//     };
	// }

	return transformed;
}

// --- Main Transformation Function ---

export function transformPrismSchemasToRLData(
	prismSchemas: PrismSchemaMetadata[],
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
		Object.entries(prismSchema.functions || {}).forEach(([name, func]) => {
			rlSchema.functions[name] = transformPrismFunction(func, prismSchema.name);
		});
		Object.entries(prismSchema.procedures || {}).forEach(([name, proc]) => {
			rlSchema.procedures[name] = transformPrismFunction(proc, prismSchema.name);
		});
		Object.entries(prismSchema.triggers || {}).forEach(([name, trig]) => {
			rlSchema.triggers[name] = transformPrismFunction(trig, prismSchema.name);
		});

		return rlSchema;
	});
}
