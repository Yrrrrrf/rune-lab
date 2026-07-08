[doc('Run the test suite via vite-plus')]
[group('test')]
test *args:
    deno test --allow-all src/packages/core/src/
    do { cd src/packages/ui; deno run -A npm:vite-plus/vp test {{ args }} }
    do { cd src/packages/plugins/i18n/src/money; deno run -A npm:vite-plus/vp test {{ args }} }
    do { cd src/packages/plugins/palettes; deno run -A npm:vite-plus/vp test {{ args }} }
    do { cd src/packages/plugins/layout; deno run -A npm:vite-plus/vp test {{ args }} }
