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
        "dinero.js",
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].ts",
        paths(id) {
          if (id === "svelte" || id.startsWith("svelte/")) {
            return id.replace(/^svelte/, "npm:svelte@^5.55.0");
          }
          if (id.startsWith("@sveltejs/")) {
            return id.replace(/^@sveltejs\/kit/, "npm:@sveltejs/kit@^2.55.0");
          }
          if (id.startsWith("@inlang/")) {
            return id.replace(
              /^@inlang\/paraglide-js/,
              "npm:@inlang/paraglide-js@^2.15.1",
            );
          }
          if (id === "esm-env") return "npm:esm-env@^1.2.2";
          if (id === "hotkeys-js") return "npm:hotkeys-js@^4.0.2";
          if (id === "dinero.js") return "npm:dinero.js@^2.0.2";
          return id;
        },
      },
    },
  },
});
