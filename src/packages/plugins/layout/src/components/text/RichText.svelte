<script lang="ts">
import type { RichInlineItem } from "@rune-lab/core";
import { getTextStore } from "../../plugin.ts";
import { resizeWidth } from "../../text/resize.ts";

let {
  items,
  lineHeight = 20,
  clamping,
  lineCount = $bindable(0),
  naturalWidth = $bindable(0),
  overflow = $bindable(false),
}: {
  items: RichInlineItem[];
  lineHeight?: number;
  clamping?: number;
  lineCount?: number;
  naturalWidth?: number;
  overflow?: boolean;
} = $props();

const textStore = getTextStore();
let measuredWidth = $state(0);

let prepared = $derived.by(() => {
  const _ = textStore.epoch;
  return textStore.ready ? textStore.engine.prepareRichInline(items) : null;
});

$effect(() => {
  if (prepared && textStore.ready) {
    const stats = textStore.engine.measureRichInlineStats(
      prepared,
      Number.POSITIVE_INFINITY,
    );
    naturalWidth = stats.maxLineWidth;
  }
});

let lines = $derived.by(() => {
  if (!prepared || !textStore.ready || measuredWidth <= 0) return [];
  const tempLines: any[] = [];
  textStore.engine.walkRichInlineLineRanges(
    prepared,
    measuredWidth,
    (range: any) => {
      tempLines.push(
        textStore.engine.materializeRichInlineLineRange(prepared, range),
      );
    },
  );
  lineCount = tempLines.length;
  const clampLimit = clamping !== undefined && tempLines.length > clamping;
  overflow = clampLimit;
  return clampLimit ? tempLines.slice(0, clamping) : tempLines;
});
</script>

<div
  use:resizeWidth={(w) => (measuredWidth = w)}
  class="rl-rich-text w-full select-text"
  style="line-height: {lineHeight}px;"
>
  {#if !textStore.ready}
    <div class="rl-text-fallback whitespace-pre-wrap">
      {items.map(i => i.text).join(" ")}
    </div>
  {:else}
    {#each lines as line, i (i)}
      <div class="rl-rich-line flex items-center select-text h-[{lineHeight}px]">
        {#each line.fragments as fragment}
          {#if fragment.gapBefore > 0}
            <span style="width: {fragment.gapBefore}px;" class="shrink-0"></span>
          {/if}
          {@const itemConfig = items[fragment.itemIndex]}
          <span
            class="inline-block select-text shrink-0"
            class:badge={itemConfig.break === "never"}
            class:badge-primary={itemConfig.break === "never"}
            class:badge-sm={itemConfig.break === "never"}
            style="font: {itemConfig.font};"
          >
            {fragment.text}
          </span>
        {/each}
      </div>
    {/each}
  {/if}
</div>
