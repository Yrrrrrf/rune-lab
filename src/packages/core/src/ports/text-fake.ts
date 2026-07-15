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
  RichInlineFragment,
  RichInlineFragmentRange,
  RichInlineItem,
  RichInlineLine,
  RichInlineLineRange,
  RichInlineStats,
  TextMeasurer,
} from "./text.ts";

interface FakePreparedText {
  text: string;
  font: string;
  options?: PrepareOptions;
  segments: string[];
}

export class FakeTextMeasurer implements TextMeasurer {
  prepare(text: string, font: string, options?: PrepareOptions): PreparedText {
    return {
      text,
      font,
      options,
      segments: text.split(/(\s+)/).filter(Boolean),
    } as any;
  }

  prepareWithSegments(
    text: string,
    font: string,
    options?: PrepareOptions,
  ): PreparedTextWithSegments {
    return {
      text,
      font,
      options,
      segments: text.split(/(\s+)/).filter(Boolean),
    } as any;
  }

  layout(
    prepared: PreparedText,
    maxWidth: number,
    lineHeight: number,
  ): { lineCount: number; height: number } {
    const stats = this.measureLineStats(prepared as any, maxWidth);
    return { lineCount: stats.lineCount, height: stats.lineCount * lineHeight };
  }

  materializeLineRange(
    prepared: PreparedTextWithSegments,
    line: LayoutLineRange,
  ): LayoutLine {
    const fake = prepared as unknown as FakePreparedText;
    const slice = fake.segments
      .slice(line.start.segmentIndex, line.end.segmentIndex)
      .join("");
    return {
      text: slice,
      width: line.width,
      start: line.start,
      end: line.end,
    };
  }

  walkLineRanges(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    onLine: (line: LayoutLineRange) => void,
  ): number {
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
    let count = 0;
    while (true) {
      const range = this.layoutNextLineRange(prepared, maxWidth, cursor);
      if (!range) break;
      onLine(range);
      count++;
      cursor = range.end;
    }
    return count;
  }

  measureLineStats(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
  ): LineStats {
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
    let lineCount = 0;
    let maxLineWidth = 0;
    while (true) {
      const range = this.layoutNextLineRange(prepared, maxWidth, cursor);
      if (!range) break;
      lineCount++;
      if (range.width > maxLineWidth) maxLineWidth = range.width;
      cursor = range.end;
    }
    return { lineCount, maxLineWidth };
  }

  measureNaturalWidth(prepared: PreparedTextWithSegments): number {
    const fake = prepared as unknown as FakePreparedText;
    const letterSpacing = fake.options?.letterSpacing ?? 0;
    return (
      fake.text.length * 10 +
      (fake.text.length > 0 ? (fake.text.length - 1) * letterSpacing : 0)
    );
  }

  layoutNextLine(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    lineHeight: number,
    start: LayoutCursor,
  ): LayoutLine | null {
    const range = this.layoutNextLineRange(prepared, maxWidth, start);
    if (!range) return null;
    return this.materializeLineRange(prepared, range);
  }

  layoutNextLineRange(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    start?: LayoutCursor,
  ): LayoutLineRange | null {
    const fake = prepared as unknown as FakePreparedText;
    const startIndex = start ? start.segmentIndex : 0;
    if (startIndex >= fake.segments.length) return null;

    let width = 0;
    let currentIndex = startIndex;
    const letterSpacing = fake.options?.letterSpacing ?? 0;

    while (currentIndex < fake.segments.length) {
      const segText = fake.segments[currentIndex];
      const segWidth = segText.length * 10 +
        (segText.length > 0 ? (segText.length - 1) * letterSpacing : 0);

      if (width > 0 && width + segWidth > maxWidth) {
        break; // Wrap!
      }
      width += segWidth;
      currentIndex++;
    }

    if (currentIndex === startIndex) {
      // If even a single segment doesn't fit, consume it anyway to make progress
      const segText = fake.segments[currentIndex];
      width = segText.length * 10 +
        (segText.length > 0 ? (segText.length - 1) * letterSpacing : 0);
      currentIndex++;
    }

    return {
      width,
      start: { segmentIndex: startIndex, graphemeIndex: 0 },
      end: { segmentIndex: currentIndex, graphemeIndex: 0 },
    };
  }

  layoutWithLines(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    lineHeight: number,
  ): LayoutLinesResult {
    const lines: LayoutLine[] = [];
    this.walkLineRanges(prepared, maxWidth, (range) => {
      lines.push(this.materializeLineRange(prepared, range));
    });
    return {
      lineCount: lines.length,
      height: lines.length * lineHeight,
      lines,
    };
  }

  clearCache(): void {}
  setLocale(_locale?: string): void {}

  // Rich inline text layout
  prepareRichInline(items: RichInlineItem[]): PreparedRichInline {
    return { items } as any;
  }

  layoutNextRichInlineLineRange(
    prepared: PreparedRichInline,
    maxWidth: number,
    start?: RichInlineCursor,
  ): RichInlineLineRange | null {
    const fake = prepared as any;
    const items = fake.items as RichInlineItem[];
    const startIndex = start ? start.itemIndex : 0;
    if (startIndex >= items.length) return null;

    let width = 0;
    let currentIndex = startIndex;
    const fragments: RichInlineFragmentRange[] = [];

    while (currentIndex < items.length) {
      const item = items[currentIndex];
      const letterSpacing = item.letterSpacing ?? 0;
      const extraWidth = item.extraWidth ?? 0;
      const itemWidth = item.text.length * 10 +
        (item.text.length > 0 ? (item.text.length - 1) * letterSpacing : 0) +
        extraWidth;

      if (width > 0 && width + itemWidth > maxWidth && item.break !== "never") {
        break;
      }
      fragments.push({
        itemIndex: currentIndex,
        gapBefore: width === 0 ? 0 : 5, // constant gap
        occupiedWidth: itemWidth,
        start: { segmentIndex: 0, graphemeIndex: 0 },
        end: { segmentIndex: 1, graphemeIndex: 0 },
      });
      width += itemWidth;
      currentIndex++;
    }

    return {
      fragments,
      width,
      end: { itemIndex: currentIndex, segmentIndex: 0, graphemeIndex: 0 },
    };
  }

  materializeRichInlineLineRange(
    prepared: PreparedRichInline,
    line: RichInlineLineRange,
  ): RichInlineLine {
    const fake = prepared as any;
    const items = fake.items as RichInlineItem[];
    const fragments: RichInlineFragment[] = line.fragments.map((frag) => {
      const item = items[frag.itemIndex];
      return {
        itemIndex: frag.itemIndex,
        text: item.text,
        gapBefore: frag.gapBefore,
        occupiedWidth: frag.occupiedWidth,
        start: frag.start,
        end: frag.end,
      };
    });
    return { fragments, width: line.width, end: line.end };
  }

  walkRichInlineLineRanges(
    prepared: PreparedRichInline,
    maxWidth: number,
    onLine: (line: RichInlineLineRange) => void,
  ): number {
    let cursor: RichInlineCursor = {
      itemIndex: 0,
      segmentIndex: 0,
      graphemeIndex: 0,
    };
    let count = 0;
    while (true) {
      const range = this.layoutNextRichInlineLineRange(
        prepared,
        maxWidth,
        cursor,
      );
      if (!range) break;
      onLine(range);
      count++;
      cursor = range.end;
    }
    return count;
  }

  measureRichInlineStats(
    prepared: PreparedRichInline,
    maxWidth: number,
  ): RichInlineStats {
    let cursor: RichInlineCursor = {
      itemIndex: 0,
      segmentIndex: 0,
      graphemeIndex: 0,
    };
    let lineCount = 0;
    let maxLineWidth = 0;
    while (true) {
      const range = this.layoutNextRichInlineLineRange(
        prepared,
        maxWidth,
        cursor,
      );
      if (!range) break;
      lineCount++;
      if (range.width > maxLineWidth) maxLineWidth = range.width;
      cursor = range.end;
    }
    return { lineCount, maxLineWidth };
  }
}
