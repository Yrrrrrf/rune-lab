[doc('Run the lab')]
[group('Dev')]
[working-directory('src/lab')]
run:
    deno run -A vite dev --host

[doc('Test the package')]
[group('Dev')]
[working-directory('src/package')]
test *args:
    bunx vp test {{ args }}
