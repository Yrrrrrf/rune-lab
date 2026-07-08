import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: "index.html",
      strict: false,
    }),
    alias: {
      "@rune_lab/core": "../core/src/mod.ts",
      // "@rune_lab/svelte": "../svelte/src/lib/mod.ts",
      // "@rune_lab/layout": "../plugins/layout/src/lib/mod.ts",
      // "@rune_lab/money": "../plugins/i18n/src/money/src/lib/mod.ts",
      // "@rune_lab/palettes": "../plugins/palettes/src/lib/mod.ts",
    },
  },
};

export default config;
