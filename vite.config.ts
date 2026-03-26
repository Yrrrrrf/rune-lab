// vite plus
import { defineConfig } from "vite-plus";
// customization
import tailwindcss from "@tailwindcss/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
// main framework
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
    paraglideVitePlugin({
      project: "./src/i18n/project.inlang",
      outdir: "./src/i18n/paraglide",
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
    // alias: {
    //   "@rune-lab/core": new URL("src/kernel", import.meta.url).pathname,
    //   "@rune-lab/state": new URL("src/state", import.meta.url).pathname,
    //   "@rune-lab/ui": new URL("src/ui", import.meta.url).pathname,
    // },
  },
});
