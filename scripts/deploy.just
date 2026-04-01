[doc('Build Client')]
[group('Build')]
build:
    # * Clean up previous build
    rm -rf dist/
    deno run -A npm:@inlang/paraglide-js compile  --project ./src/lib/i18n/project.inlang --outdir ./src/lib/i18n/paraglide
    deno run -A npm:@sveltejs/package -- -i src -o dist
    # * Build ESM package
    fd -e js -e ts -e svelte . dist -x sed -i "s/from \"\(\.[^\"]*\)\.ts\"/from \"\1.js\"/g; s/from '\(\.[^']*\)\.ts'/from '\1.js'/g" {}
    deno fmt --no-config dist
    # deno run -A scripts/build_pkg.ts
    @echo "✓ build done"

[doc('Publish to jsr')]
[group('Deploy')]
deploy: build
    # * Format build output
    deno fmt --no-config dist
    # * Publish to npm
    bun publish
    # * Publish to jsr
    @echo "✓ deploy done"
