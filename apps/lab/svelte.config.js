import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    alias: {
      "@rune-lab/core": "../../src/packages/core/src/mod.ts",
      "@rune-lab/svelte": "../../src/packages/ui/src/mod.ts",
      "@rune-lab/i18n": "../../src/packages/plugins/i18n/src/mod.ts",
      "@rune-lab/layout": "../../src/packages/plugins/layout/src/mod.ts",
      "@rune-lab/observer": "../../src/packages/plugins/observer/src/mod.ts",
      "@rune-lab/palettes": "../../src/packages/plugins/palettes/src/mod.ts",
    },
  },
};

export default config;
