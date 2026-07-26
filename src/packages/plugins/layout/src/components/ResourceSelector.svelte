<script lang="ts" generics="T">
import type { ConfigStore } from "rune-lab/core";
import type { Snippet } from "svelte";
import AppSettingSelector from "./AppSettingSelector.svelte";

interface Props {
	/** ConfigStore instance to bind to */
	store: ConfigStore<T, keyof T>;
	/** Key to use as identifier (e.g., "name", "code") */
	idKey: string;
	/** Optional subset of IDs to show */
	filterKeys?: string[];
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
	filterKeys = [],
	triggerLabel,
	item,
	direction = "bottom",
	responsive = true,
}: Props = $props();

let active = $derived(store.get(store.current) ?? store.available[0]);

let available = $derived(
	filterKeys.length > 0
		? store.available.filter((item: T) =>
				filterKeys.includes(String((item as Record<string, unknown>)[idKey])),
			)
		: store.available,
);
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
