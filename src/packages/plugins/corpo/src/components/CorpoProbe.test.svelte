<script lang="ts">
  import { untrack } from "svelte";
  import { getKernel } from "rune-lab/ui";
  import { getLayoutStore } from "rune-lab/layout";
  import { getCorpoStore } from "../context.ts";
  import type { Kernel } from "rune-lab/core";
  import type { CorpoStore } from "../store.svelte.ts";
  let {
    onReady,
  }: {
    onReady: (value: {
      kernel: Kernel;
      corpo: CorpoStore;
      layout: ReturnType<typeof getLayoutStore>;
    }) => void;
  } = $props();
  untrack(() =>
    onReady({
      kernel: getKernel(),
      corpo: getCorpoStore(),
      layout: getLayoutStore(),
    }),
  );
</script>

<p>App content</p>
