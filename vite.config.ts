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
  },
  build: {
    lib: {
      entry: "./src/mod.ts",
      formats: ["es"],
    },
    outDir: "dist",
    rollupOptions: {
      external: [
        "svelte",
        /^svelte\//,
        "esm-env",
        /^@sveltejs\//,
        /^@inlang\//,
        "hotkeys-js",
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].ts",
      },
    },
  },
});
