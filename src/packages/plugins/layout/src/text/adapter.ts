import type {
  LayoutCursor,
  LayoutLine,
  LayoutLineRange,
  LayoutLinesResult,
  LayoutResult,
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
import * as pretext from "@chenglou/pretext";
import * as pretextRich from "@chenglou/pretext/rich-inline";

// Brand boundary. Core's opaque handles and pretext's are structurally identical
// except for the brand symbol: pretext's is required, core's is optional. So
// pretext -> core assigns freely; core -> pretext needs these three converters.
// Every other type in the port mirrors pretext 1:1 and crosses with no cast.
const toPt = (p: PreparedText): pretext.PreparedText =>
  p as unknown as pretext.PreparedText;
const toPtSeg = (
  p: PreparedTextWithSegments,
): pretext.PreparedTextWithSegments =>
  p as unknown as pretext.PreparedTextWithSegments;
const toPtRich = (p: PreparedRichInline): pretextRich.PreparedRichInline =>
  p as unknown as pretextRich.PreparedRichInline;

export class PretextTextMeasurer implements TextMeasurer {
  prepare(text: string, font: string, options?: PrepareOptions): PreparedText {
    return pretext.prepare(text, font, options) as unknown as PreparedText;
  }

  prepareWithSegments(
    text: string,
    font: string,
    options?: PrepareOptions,
  ): PreparedTextWithSegments {
    return pretext.prepareWithSegments(
      text,
      font,
      options,
    ) as unknown as PreparedTextWithSegments;
  }

  layout(
    prepared: PreparedText,
    maxWidth: number,
    lineHeight: number,
  ): LayoutResult {
    return pretext.layout(toPt(prepared), maxWidth, lineHeight);
  }

  materializeLineRange(
    prepared: PreparedTextWithSegments,
    line: LayoutLineRange,
  ): LayoutLine {
    return pretext.materializeLineRange(toPtSeg(prepared), line);
  }

  walkLineRanges(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    onLine: (line: LayoutLineRange) => void,
  ): number {
    return pretext.walkLineRanges(toPtSeg(prepared), maxWidth, onLine);
  }

  measureLineStats(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
  ): LineStats {
    return pretext.measureLineStats(toPtSeg(prepared), maxWidth);
  }

  measureNaturalWidth(prepared: PreparedTextWithSegments): number {
    return pretext.measureNaturalWidth(toPtSeg(prepared));
  }

  layoutNextLine(
    prepared: PreparedTextWithSegments,
    start: LayoutCursor,
    maxWidth: number,
  ): LayoutLine | null {
    return pretext.layoutNextLine(toPtSeg(prepared), start, maxWidth);
  }

  layoutNextLineRange(
    prepared: PreparedTextWithSegments,
    start: LayoutCursor,
    maxWidth: number,
  ): LayoutLineRange | null {
    return pretext.layoutNextLineRange(toPtSeg(prepared), start, maxWidth);
  }

  layoutWithLines(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    lineHeight: number,
  ): LayoutLinesResult {
    return pretext.layoutWithLines(toPtSeg(prepared), maxWidth, lineHeight);
  }

  clearCache(): void {
    pretext.clearCache();
  }

  setLocale(locale?: string): void {
    pretext.setLocale(locale);
  }

  // Rich inline text layout
  prepareRichInline(items: RichInlineItem[]): PreparedRichInline {
    return pretextRich.prepareRichInline(
      items,
    ) as unknown as PreparedRichInline;
  }

  layoutNextRichInlineLineRange(
    prepared: PreparedRichInline,
    maxWidth: number,
    start?: RichInlineCursor,
  ): RichInlineLineRange | null {
    return pretextRich.layoutNextRichInlineLineRange(
      toPtRich(prepared),
      maxWidth,
      start,
    );
  }

  materializeRichInlineLineRange(
    prepared: PreparedRichInline,
    line: RichInlineLineRange,
  ): RichInlineLine {
    return pretextRich.materializeRichInlineLineRange(toPtRich(prepared), line);
  }

  walkRichInlineLineRanges(
    prepared: PreparedRichInline,
    maxWidth: number,
    onLine: (line: RichInlineLineRange) => void,
  ): number {
    return pretextRich.walkRichInlineLineRanges(
      toPtRich(prepared),
      maxWidth,
      onLine,
    );
  }

  measureRichInlineStats(
    prepared: PreparedRichInline,
    maxWidth: number,
  ): RichInlineStats {
    return pretextRich.measureRichInlineStats(toPtRich(prepared), maxWidth);
  }
}
