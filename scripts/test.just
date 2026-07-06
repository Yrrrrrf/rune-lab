[doc('Run the test suite via vite-plus')]
[group('test')]
[working-directory('src/package')]
test *args:
    deno run -A npm:vite-plus/vp test {{ args }}
