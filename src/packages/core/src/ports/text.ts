export type WhiteSpaceMode = "normal" | "pre-wrap";
export type WordBreakMode = "normal" | "keep-all";

export interface PrepareOptions {
  whiteSpace?: WhiteSpaceMode;
  wordBreak?: WordBreakMode;
  letterSpacing?: number;
}

export interface PreparedText {
  readonly __preparedTextBrand?: unique symbol;
}

export interface PreparedTextWithSegments extends PreparedText {
  segments: string[];
}

export interface LayoutCursor {
  segmentIndex: number;
  graphemeIndex: number;
}

export interface LayoutResult {
  lineCount: number;
  height: number;
}

export interface LineStats {
  lineCount: number;
  maxLineWidth: number;
}

export interface LayoutLine {
  text: string;
  width: number;
  start: LayoutCursor;
  end: LayoutCursor;
}

export interface LayoutLineRange {
  width: number;
  start: LayoutCursor;
  end: LayoutCursor;
}

export interface LayoutLinesResult extends LayoutResult {
  lines: LayoutLine[];
}

export interface RichInlineItem {
  text: string;
  font: string;
  letterSpacing?: number;
  break?: "normal" | "never";
  extraWidth?: number;
}

export interface PreparedRichInline {
  readonly __preparedRichInlineBrand?: unique symbol;
}

export interface RichInlineCursor {
  itemIndex: number;
  segmentIndex: number;
  graphemeIndex: number;
}

export interface RichInlineFragment {
  itemIndex: number;
  text: string;
  gapBefore: number;
  occupiedWidth: number;
  start: LayoutCursor;
  end: LayoutCursor;
}

export interface RichInlineFragmentRange {
  itemIndex: number;
  gapBefore: number;
  occupiedWidth: number;
  start: LayoutCursor;
  end: LayoutCursor;
}

export interface RichInlineLine {
  fragments: RichInlineFragment[];
  width: number;
  end: RichInlineCursor;
}

export interface RichInlineLineRange {
  fragments: RichInlineFragmentRange[];
  width: number;
  end: RichInlineCursor;
}

export interface RichInlineStats {
  lineCount: number;
  maxLineWidth: number;
}

export interface TextMeasurer {
  prepare(text: string, font: string, options?: PrepareOptions): PreparedText;
  prepareWithSegments(
    text: string,
    font: string,
    options?: PrepareOptions,
  ): PreparedTextWithSegments;
  layout(
    prepared: PreparedText,
    maxWidth: number,
    lineHeight: number,
  ): LayoutResult;
  materializeLineRange(
    prepared: PreparedTextWithSegments,
    line: LayoutLineRange,
  ): LayoutLine;
  walkLineRanges(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    onLine: (line: LayoutLineRange) => void,
  ): number;
  measureLineStats(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
  ): LineStats;
  measureNaturalWidth(prepared: PreparedTextWithSegments): number;
  layoutNextLine(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    lineHeight: number,
    start: LayoutCursor,
  ): LayoutLine | null;
  layoutNextLineRange(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    start?: LayoutCursor,
  ): LayoutLineRange | null;
  layoutWithLines(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    lineHeight: number,
  ): LayoutLinesResult;
  clearCache(): void;
  setLocale(locale?: string): void;

  // Rich inline text layout
  prepareRichInline(items: RichInlineItem[]): PreparedRichInline;
  layoutNextRichInlineLineRange(
    prepared: PreparedRichInline,
    maxWidth: number,
    start?: RichInlineCursor,
  ): RichInlineLineRange | null;
  materializeRichInlineLineRange(
    prepared: PreparedRichInline,
    line: RichInlineLineRange,
  ): RichInlineLine;
  walkRichInlineLineRanges(
    prepared: PreparedRichInline,
    maxWidth: number,
    onLine: (line: RichInlineLineRange) => void,
  ): number;
  measureRichInlineStats(
    prepared: PreparedRichInline,
    maxWidth: number,
  ): RichInlineStats;
}
