import chokidar from 'chokidar';

const log = {
  info: (msg: string) => console.log('ℹ ' + msg),
  success: (msg: string) => console.log('✓ ' + msg),
  warn: (msg: string) => console.log('⚠ ' + msg),
  error: (msg: string) => console.log('✗ ' + msg),
};

async function build() {
  const proc = Bun.spawn(["bun", "run", "build"], {
    stdout: "inherit",
  });
  return (await proc.exited) === 0;
}

await build();
log.info('Watching for changes...\n');

chokidar.watch('src').on('change', async (path) => {
  log.warn(`File changed: ${path}`);
  const success = await build();
  success ? log.success('Rebuild complete\n') : log.error('Build failed\n');
});
