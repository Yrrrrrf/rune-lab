import { defineConfig } from "vite-plus";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@rune-lab/core": resolve(__dirname, "../../../../core/src/mod.ts"),
      "@rune-lab/svelte": resolve(__dirname, "../../../../ui/src/lib/mod.ts"),
      "@rune-lab/layout": resolve(
        __dirname,
        "../../../layout/src/lib/mod.ts",
      ),
      "@rune-lab/money": resolve(__dirname, "./src/lib/mod.ts"),
      "@rune-lab/palettes": resolve(
        __dirname,
        "../../../palettes/src/lib/mod.ts",
      ),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
    globals: true,
  },
});
