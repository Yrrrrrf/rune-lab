import { defineConfig } from "vite-plus";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";

const PKGS = "./src/packages";
const I18N = `${PKGS}/plugins/i18n`;

// why `as any`: the svelte plugin types against upstream `vite`, while vite-plus
// resolves to @voidzero-dev/vite-plus-core — same runtime, different type identity.
const svelteProject = (
  name: string,
  root: string,
  extraPlugins: unknown[] = [],
) => ({
  root,
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
      svelteProject("ui", `${PKGS}/ui`),
      svelteProject("palettes", `${PKGS}/plugins/palettes`),
      svelteProject("observer", `${PKGS}/plugins/observer`),
      svelteProject("layout", `${PKGS}/plugins/layout`),
      svelteProject("i18n", I18N, [
        tailwindcss(),
        paraglideVitePlugin({
          project: `${I18N}/src/i18n/project.inlang`,
          outdir: `${I18N}/src/lib/paraglide`,
          // localStorage first, then browser language, then base locale
          strategy: ["localStorage", "preferredLanguage", "baseLocale"],
        }),
      ]),
    ],
  },
});
