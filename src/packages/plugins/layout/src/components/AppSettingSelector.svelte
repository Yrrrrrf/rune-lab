<script lang="ts" module>
import type { Snippet } from "svelte";

export interface AppSettingSelectorProps<T> {
	options: T[];
	value: T;
	item: Snippet<[T]>;
	triggerLabel: Snippet<[T]>;
	tooltip?: string;
	direction?: "top" | "bottom" | "left" | "right" | "end" | "auto";
	responsive?: boolean;
}
</script>
<script lang="ts" generics="T">
import MobileModal from "./MobileModal.svelte";
import DesktopDropdown from "./DesktopDropdown.svelte";

let {
  options,
  value,
  item,
  triggerLabel,
  tooltip,
  direction = "bottom",
  responsive = true,
}: AppSettingSelectorProps<T> = $props();
</script>

{#if responsive}
  <MobileModal {options} {value} {item} {triggerLabel} />
{/if}

<div class={responsive ? "hidden md:inline-block" : "inline-block"}>
  <DesktopDropdown {options} {value} {item} {triggerLabel} {tooltip} {direction} />
</div>
