<script lang="ts" generics="T">
import type { ConfigStore } from "@rune-lab/core";
import { m } from "@rune-lab/i18n";
import { getContext, type Snippet } from "svelte";
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
	/** Callback when selection changes */
	onchange?: (value: string) => void;
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

const userDictionary =
	getContext<Record<string, (...args: unknown[]) => string>>("rl:dictionary") ??
	{};

/**
 * Resolve a label for an item through the message chain:
 * 1. User-provided dictionary
 * 2. Paraglide messages
 * 3. Raw key fallback
 */
function resolveLabel(item: T): string {
	const key = String((item as Record<string, unknown>)[idKey]);
	if (typeof userDictionary[key] === "function") {
		return userDictionary[key]();
	}
	if (
		typeof (m as Record<string, (...args: unknown[]) => string>)[key] ===
		"function"
	) {
		return (m as Record<string, (...args: unknown[]) => string>)[key]();
	}
	return key;
}

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
  tooltip={resolveLabel(active)}
  {direction}
  {responsive}
  triggerLabel={_triggerLabel}
  item={_item}
/>
