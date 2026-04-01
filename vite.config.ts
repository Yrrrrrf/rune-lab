// vite plus
import { defineConfig } from "vite-plus";
// customization
import tailwindcss from "@tailwindcss/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
// main framework
// sveltekit for local testing of the main components
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  resolve: {
    alias: {
      "rune-lab": new URL("src/lib/mod.ts", import.meta.url).pathname,
    },
  },
  plugins: [
    sveltekit(),
    tailwindcss(),
    paraglideVitePlugin({
      project: "./src/lib/i18n/project.inlang",
      outdir: "./src/lib/i18n/paraglide",
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
  },
});
