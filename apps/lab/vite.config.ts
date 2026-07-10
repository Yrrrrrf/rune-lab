// vite plus
import { defineConfig } from "vite-plus";
// customization
import tailwindcss from "@tailwindcss/vite";
// import { paraglideVitePlugin } from "@inlang/paraglide-js";
// main framework
// sveltekit for local testing of the main components
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  plugins: [
    sveltekit(),
    tailwindcss(),
    // todo: Remove this stuff because the main plugin will handle this
    // todo: Remove this stuff because the main plugin will handle this
    // todo: Remove this stuff because the main plugin will handle this
    // paraglideVitePlugin({
    //   project: "./src/lib/i18n/project.inlang",
    //   outdir: "./src/lib/i18n/paraglide",
    // }),
  ],
});
