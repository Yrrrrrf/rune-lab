[doc('Test the client (runs once)')]
[group('Dev')]
test *args:
    bun vitest run {{ args }}
