import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import path from "path";

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST }), svelteTesting()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest-setup.ts"],
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/cypress/**", "**/.{idea,git,cache,output,temp,svelte-kit}/**"],
    alias: {
      "@internal/core": path.resolve(__dirname, "./src/sdk/core/src"),
      "@internal/state": path.resolve(__dirname, "./src/sdk/state/src"),
      "@internal/ui": path.resolve(__dirname, "./src/sdk/ui/src/lib"),
    },
  },
});
