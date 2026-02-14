import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
// import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    // devtoolsJson(),
    paraglideVitePlugin({
      project: "./src/i18n/project.inlang",
      outdir: "./src/lib/paraglide",
    }),
  ],

  build: {
    lib: {
      entry: "src/lib/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    outDir: "dist/compiled",
    rollupOptions: {
      // Keep ALL these external — don't bundle them
      external: [
        "svelte",
        /^svelte\//,
        "@sveltejs/kit",
        /^lucide-svelte/,
        /^@inlang/,
      ],
    },
  },
});
