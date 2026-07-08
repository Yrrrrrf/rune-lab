import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
    paraglideVitePlugin({
      project: "./src/i18n/project.inlang",
      outdir: "./src/lib/paraglide",
      // first it checks localStorage, then the preferred language of the browser, and finally falls back to the base locale
      strategy: ["localStorage", "preferredLanguage", "baseLocale"],
    }),
  ],
  optimizeDeps: {
    // exclude: [
    //   "rune-lab",
    // ],
  },
  ssr: {
    // noExternal: [
    //   "rune-lab",
    // ],
  },
  // server: {
  //   fs: {
  //     allow: [
  //       // searchForWorkspaceRoot(process.cwd()),
  //       // path.resolve(__dirname, "../../node_modules"),
  //     ],
  //   },
  // },
  test: {
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
    globals: true,
  },
});
