// vite plus

// sveltekit
import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
// customization
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// import { paraglideVitePlugin } from "@inlang/paraglide-js";

const resolve = (p: string) => new URL(p, import.meta.url).pathname;

export default defineConfig({
  resolve: {
    alias: {
      "@rune-lab/i18n/money": resolve(
        "../../src/packages/plugins/i18n/src/money/mod.ts",
      ),
      "@rune-lab/i18n/lang": resolve(
        "../../src/packages/plugins/i18n/src/lang/mod.ts",
      ),
      "@rune-lab/core": resolve("../../src/packages/core/src/mod.ts"),
      "@rune-lab/svelte": resolve("../../src/packages/ui/src/mod.ts"),
      "@rune-lab/i18n": resolve("../../src/packages/plugins/i18n/src/mod.ts"),
      "@rune-lab/layout": resolve(
        "../../src/packages/plugins/layout/src/mod.ts",
      ),
      "@rune-lab/observer": resolve(
        "../../src/packages/plugins/observer/src/mod.ts",
      ),
      "@rune-lab/palettes": resolve(
        "../../src/packages/plugins/palettes/src/mod.ts",
      ),
    },
  },
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },
      adapter: adapter({
        fallback: "index.html",
        strict: true,
      }),
    }),
    // todo: Remove this stuff because the main plugin will handle this
    // todo: Remove this stuff because the main plugin will handle this
    // todo: Remove this stuff because the main plugin will handle this
    // paraglideVitePlugin({
    //   project: "./src/i18n/project.inlang",
    //   outdir: "./src/i18n/paraglide",
    // }),
    // deno-lint-ignore no-explicit-any
  ] as any,
});
