<script lang="ts">
  /**
   * Simple Icon component for Rune Lab
   * Centralizes SVG paths to reduce boilerplate
   */
  let { name, size = "w-5 h-5", class: className = "" } = $props<{
    name: "search" | "chevron-down" | "info" | "shortcut" | "close" | "external";
    size?: string;
    class?: string;
  }>();

  const paths: Record<string, string> = {
    search: '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
    "chevron-down": '<path d="m6 9 6 6 6-6" />',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    shortcut: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    unknown: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'
  };

  const path = $derived.by(() => {
    if (!paths[name]) {
      if (import.meta.env?.DEV) {
        console.warn(`[Icon] Unknown icon name: "${name}"`);
      }
      return paths.unknown;
    }
    return paths[name];
  });
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="{size} {className}"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html path}
</svg>
