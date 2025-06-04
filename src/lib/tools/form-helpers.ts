// File: src/lib/tools/form-helpers.ts
import type {
	RLColumnMetadata,
	RLEnumMetadata,
	// RLColumnReference,
	// RLFunctionKind,
	// RLFunctionMetadata,
	// RLFunctionParameter,
	// RLSchemaData,
	// RLTableMetadata,
	// RLViewMetadata,
} from "../components/stores/explorer.svelte.ts";
/**
 * Maps SQL data types to HTML input element types.
 * @param sqlType The SQL data type string.
 * @param columnName (Optional) The name of the column, can be used for heuristics.
 * @returns The corresponding HTML input type string.
 */
export function mapSqlTypeToInputType(sqlType: string, columnName?: string): string {
	const lowerSqlType = sqlType.toLowerCase();

	if (lowerSqlType.includes("bool")) return "checkbox";
	if (
		lowerSqlType.includes("int") || lowerSqlType.includes("serial") ||
		lowerSqlType.includes("numeric") || lowerSqlType.includes("decimal") ||
		lowerSqlType.includes("real") || lowerSqlType.includes("double")
	) return "number";
	if (lowerSqlType.includes("date") && !lowerSqlType.includes("timestamp")) return "date";
	if (lowerSqlType.includes("timestamp")) return "datetime-local";
	if (lowerSqlType.includes("time") && !lowerSqlType.includes("timestamp")) return "time";
	if (
		lowerSqlType.includes("text") ||
		(columnName && columnName.toLowerCase().includes("description"))
	) return "textarea";
	if (lowerSqlType.includes("json")) return "textarea"; // JSON often best edited as text in simple forms

	return "text"; // Default
}

/**
 * Determines numeric input attributes like min, max, step based on SQL type.
 * @param sqlType The SQL data type string.
 * @returns An object with min, max, step attributes.
 */
export function getNumericInputAttributes(sqlType: string): { min?: string; max?: string; step?: string } {
    const lowerSqlType = sqlType.toLowerCase();
    const attributes: { min?: string; max?: string; step?: string } = {};

    if (lowerSqlType.includes('int') || lowerSqlType.includes('serial')) {
        attributes.step = '1';
        if (lowerSqlType.includes('smallint') || lowerSqlType.includes('smallserial')) {
            attributes.min = '-32768';
            attributes.max = '32767';
        } else if (lowerSqlType.includes('bigint') || lowerSqlType.includes('bigserial')) {
            // HTML min/max for number inputs are limited by IEEE 754 double precision
            // so true bigint range might not be enforceable by browser.
            // We can set step to 1. Min/max might be omitted or set to very large/small numbers
            // if the browser/JS can handle them (often they are strings for bigint in JS).
            // For HTML input, it's safer to just ensure it's an integer.
        } else { // Default integer (typically 4-byte)
            attributes.min = '-2147483648';
            attributes.max = '2147483647';
        }
    } else if (lowerSqlType.includes('numeric') || lowerSqlType.includes('decimal') ||
               lowerSqlType.includes('real') || lowerSqlType.includes('double')) {
        attributes.step = 'any';
    }
    // Note: NUMERIC(p,s) precision and scale could refine 'step' or offer more validation,
    // but HTML input attributes are limited. Actual validation often happens server-side or with JS.
    return attributes;
}


/**
 * Formats a column reference object into a display string.
 * @param ref The column reference object.
 * @returns A string representation like "schema.table.column".
 */
export function formatReferenceText(
	ref: { schema: string; table: string; column: string } | undefined,
): string {
	if (!ref) return "";
	return `${ref.schema}.${ref.table}.${ref.column}`;
}


/**
 * Finds the RLEnumMetadata for a given column if it's an enum.
 * Uses heuristics to match column name to enum definition name.
 * @param column The column metadata.
 * @param enumsInSchema A record of all enums in the current schema.
 * @param currentTableOrViewName The name of the table/view the column belongs to (for better heuristics).
 * @returns The RLEnumMetadata if found, otherwise undefined.
 */
export function getEnumMetadataForColumn(
    column: RLColumnMetadata,
    enumsInSchema: Record<string, RLEnumMetadata>,
    currentTableOrViewName: string
): RLEnumMetadata | undefined {
    if (!column.isEnum || !enumsInSchema || Object.keys(enumsInSchema).length === 0) {
        return undefined;
    }

    const colNameLower = column.name.toLowerCase();
    const tableNameLower = currentTableOrViewName.toLowerCase();

    const possibleEnumKeys = [
        colNameLower,                               // exact match: status -> status
        `${colNameLower}_enum`,                     // common suffix: status -> status_enum
        `${tableNameLower}_${colNameLower}_enum`,   // table_column_enum: user_status_enum
        `${tableNameLower}_${colNameLower}`,        // table_column: user_status
    ];

    for (const key of possibleEnumKeys) {
        if (enumsInSchema[key]) return enumsInSchema[key];
        // Check case-insensitively if not found directly
        for (const enumKeyInSchema in enumsInSchema) {
            if (enumKeyInSchema.toLowerCase() === key) return enumsInSchema[enumKeyInSchema];
        }
    }
    
    // Broader search if specific patterns fail
    for (const enumKey in enumsInSchema) {
        const enumMeta = enumsInSchema[enumKey];
        const enumNameLower = enumMeta.name.toLowerCase();
        if (enumNameLower.includes(colNameLower) && enumNameLower.endsWith("_enum")) {
            return enumMeta;
        }
    }
    return undefined;
}

/**
 * Determines a suitable display field name from a list of columns for FK dropdowns.
 * Prefers 'name', 'title', 'label', 'username', then the first string column, then 'id'.
 * @param columns Array of RLColumnMetadata for the referenced table.
 * @returns The name of the column to use for display.
 */
export function getDisplayFieldForFk(columns: RLColumnMetadata[]): string {
    if (!columns || columns.length === 0) return 'id'; // Fallback

    const preferredFields = ['name', 'title', 'label', 'username', 'description', 'code'];
    for (const fieldName of preferredFields) {
        if (columns.some(col => col.name.toLowerCase() === fieldName.toLowerCase())) {
            // Find the actual case-sensitive name
            const found = columns.find(col => col.name.toLowerCase() === fieldName.toLowerCase());
            if (found) return found.name;
        }
    }

    // Fallback: first string column
    const firstStringColumn = columns.find(col => mapSqlTypeToInputType(col.type) === 'text' || mapSqlTypeToInputType(col.type) === 'textarea');
    if (firstStringColumn) return firstStringColumn.name;
    
    // Fallback: first non-PK column if available
    const firstNonPk = columns.find(col => !col.isPrimaryKey);
    if (firstNonPk) return firstNonPk.name;

    // Fallback: primary key (usually 'id')
    const pk = columns.find(col => col.isPrimaryKey);
    if (pk) return pk.name;
    
    return columns[0].name; // Absolute fallback
}