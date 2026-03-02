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
  },
  alias: {
    "@internal/state": "../../sdk/state/src/index.ts",
    "@internal/core": "../../sdk/core/src/index.ts",
    "@internal/ui": "../../sdk/ui/src/lib/index.ts",
  },
};
export default config;
