import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, PluginOption } from "vite-plus";

const resolve = (p: string) => new URL(p, import.meta.url).pathname;
const PKGS = `./src/packages`;
const PLUGINS = `${PKGS}/plugins`;

const svelteProject = (
  name: string,
  root: string,
  extraPlugins: PluginOption[] = [],
) => ({
  root: `${root}/${name}`,
  plugins: [svelte() as PluginOption, ...extraPlugins],
  // server: {
  //   fs: {
  //     allow: [resolve(".")],
  //   },
  // },
  resolve: {
    alias: {
      "@rune-lab/core": resolve("./src/packages/core/src/mod.ts"),
      "@rune-lab/svelte": resolve("./src/packages/ui/src/mod.ts"),
      "@rune-lab/i18n": resolve("./src/packages/plugins/i18n/src/mod.ts"),
      "@rune-lab/layout": resolve("./src/packages/plugins/layout/src/mod.ts"),
      "@rune-lab/observer": resolve(
        "./src/packages/plugins/observer/src/mod.ts",
      ),
      "@rune-lab/palettes": resolve(
        "./src/packages/plugins/palettes/src/mod.ts",
      ),
      "pretext/rich-inline": resolve(
        "./node_modules/@chenglou/pretext/dist/rich-inline.js",
      ),
      "pretext": resolve("./node_modules/@chenglou/pretext/dist/layout.js"),
    },
  },
  test: {
    name,
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
    globals: true,
    exclude: [
      "**/node_modules/**",
      "**/.git/**",
      "**/.svelte-kit/**",
      "**/dist/**",
      "**/build/**",
    ],
  },
});

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true,
      },
    }),
  ] as PluginOption[],
  test: {
    projects: [
      svelteProject("ui", `${PKGS}`),
      svelteProject("palettes", `${PLUGINS}`),
      svelteProject("observer", `${PLUGINS}`),
      svelteProject("layout", `${PLUGINS}`),
      svelteProject("lab", "apps"),
      svelteProject("i18n", `${PLUGINS}`, [
        tailwindcss(),
        paraglideVitePlugin({
          project: `${PLUGINS}/i18n/src/lang/project.inlang`,
          outdir: `${PLUGINS}/i18n/src/lang/paraglide`,
          // localStorage first, then browser language, then base locale
          strategy: ["localStorage", "preferredLanguage", "baseLocale"],
        }),
      ]),
    ],
  },
});
