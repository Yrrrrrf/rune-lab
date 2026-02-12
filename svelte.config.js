import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // This allows the client-side router to take over
      fallback: "index.html",
      // Tells SvelteKit not to panic about the hooks
      strict: false,
    }),
  },
};

export default config;
