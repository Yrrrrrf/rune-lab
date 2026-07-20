<script lang="ts">
import type { LayoutCursor, LayoutLine, PrepareOptions } from "rune-lab/core";
import { getTextStore } from "../../plugin.ts";
import { resizeWidth } from "../../text/resize.ts";
import TextLine from "./TextLine.svelte";

let {
  content,
  font,
  options,
  lineHeight = 20,
  clamping,
  lineCount = $bindable(0),
  naturalWidth = $bindable(0),
  overflow = $bindable(false),
}: {
  content: string;
  font?: string;
  options?: PrepareOptions;
  lineHeight?: number;
  clamping?: number;
  lineCount?: number;
  naturalWidth?: number;
  overflow?: boolean;
} = $props();

const textStore = getTextStore();
let measuredWidth = $state(0);
const effectiveFont = $derived(font ?? textStore.font);

let prepared = $derived.by(() => {
  const _ = textStore.epoch;
  return textStore.ready
    ? textStore.engine.prepareWithSegments(content, effectiveFont, options)
    : null;
});

$effect(() => {
  if (prepared && textStore.ready) {
    naturalWidth = textStore.engine.measureNaturalWidth(prepared);
  }
});

// Pure: no prop writes in here. The record carries everything the effect
// below needs to sync the bindables.
let layoutResult = $derived.by(() => {
  if (!prepared || !textStore.ready || measuredWidth <= 0) {
    return { lines: [] as LayoutLine[], lineCount: 0, overflow: false };
  }
  const engine = textStore.engine;
  const stats = engine.measureLineStats(prepared, measuredWidth);
  const clamped = clamping !== undefined && stats.lineCount > clamping;
  const limit = clamped ? clamping! : stats.lineCount;

  const lines: LayoutLine[] = [];
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  while (lines.length < limit) {
    const range = engine.layoutNextLineRange(prepared, cursor, measuredWidth);
    if (!range) break;
    lines.push(engine.materializeLineRange(prepared, range));
    cursor = range.end;
  }
  return { lines, lineCount: stats.lineCount, overflow: clamped };
});

// Bindable sync — prop writes belong in effects, not deriveds.
$effect(() => {
  lineCount = layoutResult.lineCount;
  overflow = layoutResult.overflow;
});
</script>

<div
  use:resizeWidth={(w) => (measuredWidth = w)}
  class="rl-text-container w-full select-text"
  style="line-height: {lineHeight}px;"
>
  {#if !textStore.ready}
    <div class="rl-text-fallback whitespace-pre-wrap">{content}</div>
  {:else}
    {#each layoutResult.lines as line, i (i)}
      <TextLine text={line.text} width={line.width} />
    {/each}
  {/if}
</div>
