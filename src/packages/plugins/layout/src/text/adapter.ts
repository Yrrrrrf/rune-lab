import * as pretext from "@chenglou/pretext";
import * as pretextRich from "@chenglou/pretext/rich-inline";
import type { TextMeasurer } from "rune-lab/core";

export class PretextTextMeasurer implements TextMeasurer {
	prepare(
		text: string,
		font: string,
		options?: pretext.PrepareOptions,
	): pretext.PreparedText {
		return pretext.prepare(text, font, options);
	}

	prepareWithSegments(
		text: string,
		font: string,
		options?: pretext.PrepareOptions,
	): pretext.PreparedTextWithSegments {
		return pretext.prepareWithSegments(text, font, options);
	}

	layout(
		prepared: unknown,
		maxWidth: number,
		lineHeight: number,
	): pretext.LayoutResult {
		return pretext.layout(
			prepared as pretext.PreparedText,
			maxWidth,
			lineHeight,
		);
	}

	materializeLineRange(
		prepared: pretext.PreparedTextWithSegments,
		line: pretext.LayoutLineRange,
	): pretext.LayoutLine {
		return pretext.materializeLineRange(prepared, line);
	}

	walkLineRanges(
		prepared: pretext.PreparedTextWithSegments,
		maxWidth: number,
		onLine: (line: pretext.LayoutLineRange) => void,
	): number {
		return pretext.walkLineRanges(prepared, maxWidth, onLine);
	}

	measureLineStats(
		prepared: pretext.PreparedTextWithSegments,
		maxWidth: number,
	): pretext.LineStats {
		return pretext.measureLineStats(prepared, maxWidth);
	}

	measureNaturalWidth(prepared: pretext.PreparedTextWithSegments): number {
		return pretext.measureNaturalWidth(prepared);
	}

	layoutNextLine(
		prepared: pretext.PreparedTextWithSegments,
		start: pretext.LayoutCursor,
		maxWidth: number,
	): pretext.LayoutLine | null {
		return pretext.layoutNextLine(prepared, start, maxWidth);
	}

	layoutNextLineRange(
		prepared: pretext.PreparedTextWithSegments,
		start: pretext.LayoutCursor,
		maxWidth: number,
	): pretext.LayoutLineRange | null {
		return pretext.layoutNextLineRange(prepared, start, maxWidth);
	}

	layoutWithLines(
		prepared: pretext.PreparedTextWithSegments,
		maxWidth: number,
		lineHeight: number,
	): pretext.LayoutLinesResult {
		return pretext.layoutWithLines(prepared, maxWidth, lineHeight);
	}

	clearCache(): void {
		pretext.clearCache();
	}

	setLocale(locale?: string): void {
		pretext.setLocale(locale);
	}

	// Rich inline text layout
	prepareRichInline(
		items: pretextRich.RichInlineItem[],
	): pretextRich.PreparedRichInline {
		return pretextRich.prepareRichInline(items);
	}

	layoutNextRichInlineLineRange(
		prepared: pretextRich.PreparedRichInline,
		maxWidth: number,
		start?: pretextRich.RichInlineCursor,
	): pretextRich.RichInlineLineRange | null {
		return pretextRich.layoutNextRichInlineLineRange(prepared, maxWidth, start);
	}

	materializeRichInlineLineRange(
		prepared: pretextRich.PreparedRichInline,
		line: pretextRich.RichInlineLineRange,
	): pretextRich.RichInlineLine {
		return pretextRich.materializeRichInlineLineRange(prepared, line);
	}

	walkRichInlineLineRanges(
		prepared: pretextRich.PreparedRichInline,
		maxWidth: number,
		onLine: (line: pretextRich.RichInlineLineRange) => void,
	): number {
		return pretextRich.walkRichInlineLineRanges(prepared, maxWidth, onLine);
	}

	measureRichInlineStats(
		prepared: pretextRich.PreparedRichInline,
		maxWidth: number,
	): pretextRich.RichInlineStats {
		return pretextRich.measureRichInlineStats(prepared, maxWidth);
	}
}
