// watch.ts
import { createServer } from 'vite';

const server = await createServer({
  configFile: './vite.config.ts',
  server: {
    watch: {
      ignored: ['!**/src/**']
    }
  }
});

await server.listen();
console.log('Watching for changes...');

async function build() {
  // First run svelte-kit sync
  const syncProc = Bun.spawn(["bunx", "svelte-kit", "sync"], {
    stdout: "inherit",
  });
  await syncProc.exited;

  // Then run the package build
  const buildProc = Bun.spawn(["bunx", "svelte-package"], {
    stdout: "inherit",
  });
  const success = (await buildProc.exited) === 0;
  return success;
}

// Run the build process
await build();
