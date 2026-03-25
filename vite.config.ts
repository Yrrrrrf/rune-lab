// vite plus
import { defineConfig } from "vite-plus";
// customization
import tailwindcss from "@tailwindcss/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
// main framework
import { svelte } from "@sveltejs/vite-plugin-svelte";
// testing
import { svelteTesting } from "@testing-library/svelte/vite";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  plugins: [
    svelte(),
    svelteTesting(),
    tailwindcss(),
    paraglideVitePlugin({
      // todo: Change the current i18n lib to another...
      project: "./src/ui/src/i18n/project.inlang",
      outdir: "./src/ui/src/lib/paraglide",
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
    globals: true,
    alias: {
      "@rune-lab/core": new URL("src/core/src", import.meta.url).pathname,
      "@rune-lab/state": new URL("src/state/src", import.meta.url).pathname,
      "@rune-lab/ui": new URL("src/ui/src", import.meta.url).pathname,
    },
  },
});
