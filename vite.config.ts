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
      project: "./src/sdk/ui/src/i18n/project.inlang",
      outdir: "./src/sdk/ui/src/lib/paraglide",
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
    globals: true,
    alias: {
      "@internal/core": new URL("src/sdk/core/src", import.meta.url).pathname,
      "@internal/state": new URL("src/sdk/state/src", import.meta.url).pathname,
      "@internal/ui": new URL("src/sdk/ui/src/lib", import.meta.url).pathname,
    },
  },
});
