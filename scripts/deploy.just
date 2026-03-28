[doc('Build Client')]
[group('Build')]
build:
    # * Clean up previous build
    rm -rf dist/
    # * Build library using vite-plus
    vp build
    # * Build ESM package
    deno run -A scripts/build_pkg.ts
    @echo "✓ build done"

[doc('Publish to jsr')]
[group('Deploy')]
deploy: build
    # * Format build output
    deno fmt --no-config dist
    # # * Build npm package
    # deno task build:npm
    # # * Publish to jsr
    # deno publish
    @echo "✓ deploy done"
