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
    # * Publish to npm
    # (cd dist && bun publish)
    # * Publish to jsr
    rm -rf /tmp/rune-lab
    cp -r dist/ /tmp/rune-lab
    (cd /tmp/rune-lab && deno publish --no-check)
    @echo "✓ deploy done"
