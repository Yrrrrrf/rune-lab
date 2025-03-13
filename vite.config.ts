import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
  
  // This helps with the precompilation of Svelte files
  optimizeDeps: {
    include: ['lucide-svelte'],
    extensions: ['.svelte']
  },
  
  // Add special handling for .svelte files
  resolve: {
    dedupe: ['svelte']
  },
  
  ssr: {
    // External packages that should be processed differently in SSR
    noExternal: ['lucide-svelte']
  }
});
