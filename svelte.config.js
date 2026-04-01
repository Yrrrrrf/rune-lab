import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    alias: {
      "rune-lab": "src/lib/mod.ts",
    },
  },
};

export default config;
