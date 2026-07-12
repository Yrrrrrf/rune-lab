import { defineConfig } from "vite-plus";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";

// const SRC = new URL(".", import.meta.url).pathname;
const PKGS = `./packages`;
const PLUGINS = `${PKGS}/plugins`;

// why `as any`: the svelte plugin types against upstream `vite`, while vite-plus
// resolves to @voidzero-dev/vite-plus-core — same runtime, different type identity.
const svelteProject = (
  name: string,
  root: string,
  extraPlugins: unknown[] = [],
) => ({
  root: `${root}/${name}`,
  plugins: [svelte() as any, ...extraPlugins],
  test: {
    name,
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
    globals: true,
  },
});

export default defineConfig({
  test: {
    projects: [
      svelteProject("ui", `${PKGS}`),
      svelteProject("palettes", `${PLUGINS}`),
      svelteProject("observer", `${PLUGINS}`),
      svelteProject("layout", `${PLUGINS}`),
      svelteProject("i18n", `${PLUGINS}`, [
        tailwindcss(),
        paraglideVitePlugin({
          project: `${PLUGINS}/i18n/src/lang/project.inlang`,
          outdir: `${PLUGINS}/i18n/src/lib/paraglide`,
          // localStorage first, then browser language, then base locale
          strategy: ["localStorage", "preferredLanguage", "baseLocale"],
        }),
      ]),
    ],
  },
});
