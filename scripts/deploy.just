[doc('Build Client')]
[group('Build')]
build:
    # * Clean up previous build
    rm -rf build/dist

    # * Build library using vite-plus
    vp build
    @echo "✓ build done"

[doc('Publish to jsr')]
[group('Deploy')]
deploy: build
    # * Format build output
    deno fmt build/dist
    # # * Build npm package
    # deno task build:npm
    # # * Publish to jsr
    # deno publish
    @echo "✓ deploy done"
