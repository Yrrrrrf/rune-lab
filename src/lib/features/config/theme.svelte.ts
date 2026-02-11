// client/packages/ui/src/state/theme-config.svelte.ts

import { createConfigStore } from "$lib/devtools/createConfigStore.svelte";

/**
 * Theme configuration
 * Represents a visual theme for the application
 */
export interface Theme {
  name: string;
  icon: string;
}

const THEMES = [
  { name: "light", icon: "🌞" },
  { name: "dark", icon: "🌙" },
  { name: "system", icon: "🖥️" },
  { name: "cupcake", icon: "🧁" },
  { name: "bumblebee", icon: "🐝" },
  { name: "emerald", icon: "💚" },
  { name: "corporate", icon: "🏢" },
  { name: "synthwave", icon: "🌆" },
  { name: "retro", icon: "📺" },
  { name: "cyberpunk", icon: "🤖" },
  { name: "valentine", icon: "💝" },
  { name: "halloween", icon: "🎃" },
  { name: "garden", icon: "🌷" },
  { name: "forest", icon: "🌲" },
  { name: "aqua", icon: "💧" },
  { name: "lofi", icon: "🎵" },
  { name: "pastel", icon: "🎨" },
  { name: "fantasy", icon: "🔮" },
  { name: "wireframe", icon: "📝" },
  { name: "black", icon: "⚫" },
  { name: "luxury", icon: "👑" },
  { name: "dracula", icon: "🧛" },
  { name: "cmyk", icon: "🖨️" },
  { name: "autumn", icon: "🍂" },
  { name: "business", icon: "💼" },
  { name: "acid", icon: "🧪" },
  { name: "lemonade", icon: "🍋" },
  { name: "night", icon: "🌃" },
  { name: "coffee", icon: "☕" },
  { name: "winter", icon: "❄️" },
  { name: "dim", icon: "🔅" },
  { name: "nord", icon: "🧊" },
  { name: "sunset", icon: "🌅" },
  { name: "caramellatte", icon: "🍮" },
  { name: "abyss", icon: "🌌" },
  { name: "silk", icon: "🎀" },
] as const;

export const themeStore = createConfigStore<Theme>({
  items: THEMES,
  storageKey: "theme",
  displayName: "Theme",
  idKey: "name",
  icon: "🎨",
});

// Usage:
// themeStore.set("dark")
// themeStore.get("dark")
// themeStore.getProp("icon") // gets icon of current theme
// themeStore.getProp("icon", "dark") // gets icon of specific theme
