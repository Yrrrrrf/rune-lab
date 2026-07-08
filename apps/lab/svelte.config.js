import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      "@rune-lab/core": "../../src/packages/core/src/mod.ts",
      "@rune-lab/svelte": "../../src/packages/ui/src/lib/mod.ts",
      "@rune-lab/layout": "../../src/packages/plugins/layout/src/lib/mod.ts",
      "@rune-lab/money":
        "../../src/packages/plugins/i18n/src/money/src/lib/mod.ts",
      "@rune-lab/palettes":
        "../../src/packages/plugins/palettes/src/lib/mod.ts",
      "@rune-lab/i18n": "../../src/packages/plugins/i18n/src/lang/mod.ts",
      "@rune-lab/observer":
        "../../src/packages/plugins/observer/src/lib/mod.ts",
    },
  },
};

export default config;
