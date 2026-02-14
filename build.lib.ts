/**
 * build.lib.ts
 *
 * Second build step: compiles .svelte files into plain .js
 * Output goes to dist/compiled/ and is used by the "default" export condition.
 *
 * This is what non-SvelteKit consumers (Deno, raw Vite, etc.) get —
 * no .svelte syntax, no SSR externalization issues, no noExternal config needed.
 *
 * Run after svelte-package:
 *   bunx svelte-package && bunx vite build --config build.lib.ts
 */

import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true,
      },
    }),
  ],

  resolve: {
    alias: {
      // Absolute path — required so Rollup resolves $lib/* correctly
      // regardless of where the config file sits relative to the project root
      $lib: new URL("./src/lib", import.meta.url).pathname,
    },
  },

  build: {
    lib: {
      entry: "./src/lib/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    outDir: "dist/compiled",
    emptyOutDir: true,
    rollupOptions: {
      external: [
        "svelte",
        /^svelte\//,
        "@sveltejs/kit",
        /^@sveltejs\//,
        "lucide-svelte",
        /^lucide-svelte\//,
        "@inlang/paraglide-js",
        /^@inlang\//,
        "esm-env",
      ],
    },
  },
});
