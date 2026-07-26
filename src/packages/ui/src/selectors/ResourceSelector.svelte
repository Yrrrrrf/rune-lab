<script lang="ts" generics="T">
import type { ConfigStore } from "rune-lab/core";
import type { Snippet } from "svelte";
import AppSettingSelector from "./AppSettingSelector.svelte";

interface Props {
	/** ConfigStore instance to bind to */
	store: ConfigStore<T, keyof T>;
	/** Key to use as identifier (e.g., "name", "code") */
	idKey: string;
	/**
	 * Optional pre-filtered item list, replacing `store.available`. Per-domain
	 * narrowing (e.g. LanguageSelector's `languages` prop) is the caller's own
	 * concern — this component stays ignorant of how items were chosen.
	 */
	items?: T[];
	/** Snippet to render the trigger button content */
	triggerLabel: Snippet<[T]>;
	/** Snippet to render each option in the dropdown */
	item: Snippet<[T]>;
	/** Dropdown direction */
	direction?: "top" | "bottom" | "left" | "right" | "end" | "auto";
	/** Whether to show responsive mobile modal */
	responsive?: boolean;
}

let {
	store,
	idKey,
	items,
	triggerLabel,
	item,
	direction = "bottom",
	responsive = true,
}: Props = $props();

let active = $derived(store.get(store.current) ?? store.available[0]);

let available = $derived(items ?? store.available);
</script>

{#snippet _triggerLabel(v: T)}
  {@render triggerLabel(v)}
{/snippet}

{#snippet _item(option: T)}
  {@render item(option)}
{/snippet}

<AppSettingSelector
  value={active}
  options={available}
  tooltip={String((active as Record<string, unknown>)[idKey])}
  {direction}
  {responsive}
  triggerLabel={_triggerLabel}
  item={_item}
/>
