<script lang="ts" generics="T">
import { portal } from "@rune-lab/svelte";
import type { Snippet } from "svelte";

let {
	options,
	value,
	item,
	triggerLabel,
	tooltip,
	direction = "bottom",
}: {
	options: T[];
	value: T;
	item: Snippet<[T]>;
	triggerLabel: Snippet<[T]>;
	tooltip?: string;
	direction?: "top" | "bottom" | "left" | "right" | "end" | "auto";
} = $props();

let isOpen = $state(false),
	triggerEl = $state<HTMLElement>(),
	panelEl = $state<HTMLElement | null>(null);
let panelStyle = $state("position:fixed;visibility:hidden");

function open() {
	if (!triggerEl) return;
	const rect = triggerEl.getBoundingClientRect();
	const up =
		direction === "top" ||
		(direction === "auto" &&
			window.innerHeight - rect.bottom < 200 &&
			rect.top > window.innerHeight - rect.bottom);
	panelStyle = `position:fixed; left:${rect.left}px; min-width:${rect.width}px; z-index:9999; ${
		up
			? `bottom:${window.innerHeight - rect.top + 4}px`
			: `top:${rect.bottom + 4}px`
	}`;
	isOpen = true;
}
const close = () => {
	isOpen = false;
};
const onOutside = (e: MouseEvent) => {
	if (
		!triggerEl?.contains(e.target as Node) &&
		!panelEl?.contains(e.target as Node)
	)
		close();
};
const onKey = (e: KeyboardEvent) => {
	if (e.key === "Escape") close();
};

$effect(() => {
	if (isOpen) {
		document.addEventListener("click", onOutside);
		document.addEventListener("keydown", onKey);
	}
	return () => {
		document.removeEventListener("click", onOutside);
		document.removeEventListener("keydown", onKey);
	};
});
</script>

<div bind:this={triggerEl} class="relative inline-block">
  <button aria-haspopup="listbox" aria-expanded={isOpen} onclick={open} class="btn btn-ghost btn-sm m-1 {tooltip ? 'tooltip tooltip-bottom' : ''}" data-tip={tooltip}>
    <span class="flex items-center gap-2">{@render triggerLabel(value)}</span>
  </button>
</div>
{#if isOpen}
  <div bind:this={panelEl} use:portal style={panelStyle}>
    <ul role="listbox" class="menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-xl border border-base-200 max-h-96 overflow-y-auto">
      {#each options as option}
        <li role="option" aria-selected={value === option}>
          <div role="presentation" onclick={close} onkeydown={(e) => e.key === "Enter" && close()} tabindex="-1" class="w-full">
            {@render item(option)}
          </div>
        </li>
      {/each}
    </ul>
  </div>
{/if}
