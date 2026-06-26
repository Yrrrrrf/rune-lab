import { defineConfig } from "vite-plus";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
    globals: true,
  },
});
