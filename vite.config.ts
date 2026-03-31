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
      project: "./src/lib/i18n/project.inlang",
      outdir: "./src/lib/i18n/paraglide",
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
  }
});
