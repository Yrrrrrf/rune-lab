// File: src/lib/tools/form-helpers.ts

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
 * Determines the 'step' attribute for number inputs based on SQL type.
 * @param sqlType The SQL data type string.
 * @returns 'any' for floating point types, undefined otherwise.
 */
export function getStepForNumberInput(sqlType: string): string | undefined {
	const lowerSqlType = sqlType.toLowerCase();
	if (
		lowerSqlType.includes("decimal") || lowerSqlType.includes("numeric") ||
		lowerSqlType.includes("real") || lowerSqlType.includes("double")
	) {
		return "any";
	}
	return undefined; // Default step (usually 1 for integers)
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
