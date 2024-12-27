import chokidar from 'chokidar';
import { cyan, green, yellow, red } from './src/lib';

const log = {
  info: (msg: string) => console.log(cyan('ℹ ') + msg),
  success: (msg: string) => console.log(green('✓ ') + msg),
  warn: (msg: string) => console.log(yellow('⚠ ') + msg),
  error: (msg: string) => console.log(red('✗ ') + msg),
};

async function build() {
  const proc = Bun.spawn(["bun", "run", "build"], {
    stdout: "inherit",
  });
  const success = (await proc.exited) === 0;
  return success;
}

await build();
log.info('Watching for changes...\n');

chokidar.watch('src').on('change', async (path) => {
  log.warn(`File changed: ${path}`);
  const success = await build();
  success 
    ? log.success('Rebuild complete\n') 
    : log.error('Build failed\n');
});