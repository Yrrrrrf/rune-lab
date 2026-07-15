// deno-lint-ignore-file no-explicit-any

import type {
  LayoutCursor,
  LayoutLine,
  LayoutLineRange,
  LayoutLinesResult,
  LineStats,
  PreparedRichInline,
  PreparedText,
  PreparedTextWithSegments,
  PrepareOptions,
  RichInlineCursor,
  RichInlineItem,
  RichInlineLine,
  RichInlineLineRange,
  RichInlineStats,
  TextMeasurer,
} from "@rune-lab/core";
import * as pretext from "pretext";
import * as pretextRich from "pretext/rich-inline";

export class PretextTextMeasurer implements TextMeasurer {
  prepare(text: string, font: string, options?: PrepareOptions): PreparedText {
    return pretext.prepare(text, font, options as any) as any;
  }

  prepareWithSegments(
    text: string,
    font: string,
    options?: PrepareOptions,
  ): PreparedTextWithSegments {
    return pretext.prepareWithSegments(text, font, options as any) as any;
  }

  layout(
    prepared: PreparedText,
    maxWidth: number,
    lineHeight: number,
  ): { lineCount: number; height: number } {
    return pretext.layout(prepared as any, maxWidth, lineHeight) as any;
  }

  materializeLineRange(
    prepared: PreparedTextWithSegments,
    line: LayoutLineRange,
  ): LayoutLine {
    return pretext.materializeLineRange(prepared as any, line as any) as any;
  }

  walkLineRanges(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    onLine: (line: LayoutLineRange) => void,
  ): number {
    return pretext.walkLineRanges(prepared as any, maxWidth, onLine as any);
  }

  measureLineStats(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
  ): LineStats {
    return pretext.measureLineStats(prepared as any, maxWidth) as any;
  }

  measureNaturalWidth(prepared: PreparedTextWithSegments): number {
    return pretext.measureNaturalWidth(prepared as any);
  }

  layoutNextLine(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    _lineHeight: number,
    start: LayoutCursor,
  ): LayoutLine | null {
    // Library signature: layoutNextLine(prepared, cursor, maxWidth)
    return pretext.layoutNextLine(
      prepared as any,
      start as any,
      maxWidth,
    ) as any;
  }

  layoutNextLineRange(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    start?: LayoutCursor,
  ): LayoutLineRange | null {
    // Library signature: layoutNextLineRange(prepared, cursor, maxWidth)
    return pretext.layoutNextLineRange(
      prepared as any,
      start as any,
      maxWidth,
    ) as any;
  }

  layoutWithLines(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    lineHeight: number,
  ): LayoutLinesResult {
    return pretext.layoutWithLines(
      prepared as any,
      maxWidth,
      lineHeight,
    ) as any;
  }

  clearCache(): void {
    pretext.clearCache();
  }

  setLocale(locale?: string): void {
    pretext.setLocale(locale);
  }

  // Rich inline text layout
  prepareRichInline(items: RichInlineItem[]): PreparedRichInline {
    return pretextRich.prepareRichInline(items as any) as any;
  }

  layoutNextRichInlineLineRange(
    prepared: PreparedRichInline,
    maxWidth: number,
    start?: RichInlineCursor,
  ): RichInlineLineRange | null {
    return pretextRich.layoutNextRichInlineLineRange(
      prepared as any,
      maxWidth,
      start as any,
    ) as any;
  }

  materializeRichInlineLineRange(
    prepared: PreparedRichInline,
    line: RichInlineLineRange,
  ): RichInlineLine {
    return pretextRich.materializeRichInlineLineRange(
      prepared as any,
      line as any,
    ) as any;
  }

  walkRichInlineLineRanges(
    prepared: PreparedRichInline,
    maxWidth: number,
    onLine: (line: RichInlineLineRange) => void,
  ): number {
    return pretextRich.walkRichInlineLineRanges(
      prepared as any,
      maxWidth,
      onLine as any,
    );
  }

  measureRichInlineStats(
    prepared: PreparedRichInline,
    maxWidth: number,
  ): RichInlineStats {
    return pretextRich.measureRichInlineStats(prepared as any, maxWidth) as any;
  }
}
