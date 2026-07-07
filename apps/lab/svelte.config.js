import adapter from "@sveltejs/adapter-static";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    alias: {
      "@rune-lab/core": resolve(
        __dirname,
        "../../src/packages/core/src/mod.ts",
      ),
      "@rune-lab/svelte": resolve(
        __dirname,
        "../../src/packages/ui/src/lib/mod.ts",
      ),
      "@rune-lab/layout": resolve(
        __dirname,
        "../../src/packages/plugins/layout/src/lib/mod.ts",
      ),
      "@rune-lab/money": resolve(
        __dirname,
        "../../src/packages/plugins/i18n/src/money/src/lib/mod.ts",
      ),
      "@rune-lab/palettes": resolve(
        __dirname,
        "../../src/packages/plugins/palettes/src/lib/mod.ts",
      ),
      "@rune-lab/i18n": resolve(
        __dirname,
        "../../src/packages/plugins/i18n/src/lang/mod.ts",
      ),
      "@rune-lab/observer": resolve(
        __dirname,
        "../../src/packages/plugins/observer/src/lib/mod.ts",
      ),
    },
  },
};

export default config;
