<script lang="ts">
  import { Icon } from "rune-lab/ui";
  import { getThemeStore } from "rune-lab/layout";
  import { getCorpoStore } from "../context.ts";
  let {
    decorative = false,
    class: className = "",
  }: { decorative?: boolean; class?: string } = $props();
  const corpo = getCorpoStore();
  const theme = getThemeStore();
  const mark = $derived(
    corpo.company.themeLogos?.[theme.current] ??
      corpo.company.logo ?? { icon: "lucide:building-2" },
  );
</script>

<span
  class="inline-flex shrink-0 items-center justify-center {className}"
  aria-hidden={decorative || undefined}
>
  {#if mark.src}
    <img
      src={mark.src}
      alt={decorative ? "" : corpo.company.name}
      class="h-8 max-w-32 object-contain"
    />
  {:else}
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : corpo.company.name}
    >
      <Icon name={mark.icon ?? "lucide:building-2"} />
    </span>
  {/if}
</span>
