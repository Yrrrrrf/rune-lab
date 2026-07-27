export interface TextMeasurer {
	prepare(text: string, font: string): unknown;
	layout(prepared: unknown, maxWidth: number, lineHeight: number): unknown;
}
