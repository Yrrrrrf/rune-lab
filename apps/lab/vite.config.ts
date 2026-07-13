// vite plus

// sveltekit
import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
// customization
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";
// import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
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
    //   project: "./src/lib/i18n/project.inlang",
    //   outdir: "./src/lib/i18n/paraglide",
    // }),
  ],
});
