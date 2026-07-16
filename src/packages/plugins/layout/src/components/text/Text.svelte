<script lang="ts">
import { getTextStore } from "../../plugin.ts";
import { resizeWidth } from "../../text/resize.ts";
import TextLine from "./TextLine.svelte";

let {
  content,
  font = "14px sans-serif",
  options,
  lineHeight = 20,
  clamping,
  lineCount = $bindable(0),
  naturalWidth = $bindable(0),
  overflow = $bindable(false),
}: {
  content: string;
  font?: string;
  options?: any;
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
  return textStore.ready
    ? textStore.engine.prepareWithSegments(content, font, options)
    : null;
});

$effect(() => {
  if (prepared && textStore.ready) {
    naturalWidth = textStore.engine.measureNaturalWidth(prepared);
  }
});

let lines = $derived.by(() => {
  if (!prepared || !textStore.ready || measuredWidth <= 0) return [];
  const tempLines: any[] = [];
  textStore.engine.walkLineRanges(prepared, measuredWidth, (range: any) => {
    tempLines.push(textStore.engine.materializeLineRange(prepared, range));
  });
  lineCount = tempLines.length;
  const clampLimit = clamping !== undefined && tempLines.length > clamping;
  overflow = clampLimit;
  return clampLimit ? tempLines.slice(0, clamping) : tempLines;
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
    {#each lines as line, i (i)}
      <TextLine text={line.text} width={line.width} />
    {/each}
  {/if}
</div>
