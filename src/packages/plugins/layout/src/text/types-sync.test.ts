import type * as pt from "@chenglou/pretext";
import type * as ptr from "@chenglou/pretext/rich-inline";
import type * as core from "@rune-lab/core";

type Mutual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;

type _PrepareOptions = Assert<Mutual<core.PrepareOptions, pt.PrepareOptions>>;
type _LayoutCursor = Assert<Mutual<core.LayoutCursor, pt.LayoutCursor>>;
type _LayoutResult = Assert<Mutual<core.LayoutResult, pt.LayoutResult>>;
type _LineStats = Assert<Mutual<core.LineStats, pt.LineStats>>;
type _LayoutLine = Assert<Mutual<core.LayoutLine, pt.LayoutLine>>;
type _LayoutLineRange = Assert<
  Mutual<core.LayoutLineRange, pt.LayoutLineRange>
>;
type _LayoutLinesResult = Assert<
  Mutual<core.LayoutLinesResult, pt.LayoutLinesResult>
>;
type _RichInlineItem = Assert<Mutual<core.RichInlineItem, ptr.RichInlineItem>>;
type _RichInlineCursor = Assert<
  Mutual<core.RichInlineCursor, ptr.RichInlineCursor>
>;
type _RichInlineFragment = Assert<
  Mutual<core.RichInlineFragment, ptr.RichInlineFragment>
>;
type _RichInlineFragmentRange = Assert<
  Mutual<core.RichInlineFragmentRange, ptr.RichInlineFragmentRange>
>;
type _RichInlineLine = Assert<Mutual<core.RichInlineLine, ptr.RichInlineLine>>;
type _RichInlineLineRange = Assert<
  Mutual<core.RichInlineLineRange, ptr.RichInlineLineRange>
>;
type _RichInlineStats = Assert<
  Mutual<core.RichInlineStats, ptr.RichInlineStats>
>;

import {
  createInMemoryDriver,
  createKernel,
  FakeTextMeasurer,
} from "@rune-lab/core";
import { expect, it } from "vite-plus/test";
import { LayoutPlugin } from "../plugin.ts";
import type { TextStoreFacade } from "../stores/text.svelte.ts";

it("text port types mirror pretext (compile-time)", () => {
  // Assertions above fail `deno check`, not this runtime body.
});

it("kernel test injecting FakeTextMeasurer reaches TextStoreFacade", async () => {
  const driver = createInMemoryDriver();
  const fakeMeasurer = new FakeTextMeasurer();

  const kernel = createKernel([LayoutPlugin], {
    config: {
      "rune-lab.layout": "light",
    },
    persistence: driver,
    textMeasurer: fakeMeasurer,
  });

  const textStore = kernel.stores.get(
    "rl:rune-lab.layout:text",
  ) as TextStoreFacade;
  expect(textStore).toBeDefined();
  expect(textStore.ready).toBe(true);
  expect(textStore.engine).toBe(fakeMeasurer);

  await kernel.dispose();
});
