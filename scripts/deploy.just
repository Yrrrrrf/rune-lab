[doc('Build Client')]
[group('Build')]
build:
    # * Clean up previous build
    rm -rf dist/
    deno run -A npm:@inlang/paraglide-js compile  --project ./src/lib/i18n/project.inlang --outdir ./src/lib/i18n/paraglide
    deno run -A npm:@sveltejs/package -- -i src -o dist
    # * Clean up i18n dist — keep only paraglide/ and message-resolver
    rm -rf dist/i18n/project.inlang dist/i18n/translations dist/i18n/paraglide/.gitignore
    fd -e test.js . dist/i18n -x rm {}
    # * Build ESM package
    fd -e js -e ts -e svelte . dist -x sed -i "s/from \"\(\.[^\"]*\)\.ts\"/from \"\1.js\"/g; s/from '\(\.[^']*\)\.ts'/from '\1.js'/g" {}
    # * Clean up svelte-kit build artifacts
    rm -rf .svelte-kit
    # * Format build output
    deno fmt --no-config dist
    @echo "✓ build done"

[doc('Publish to jsr')]
[group('Deploy')]
deploy: build
    # * Publish to npm
    bun publish
    @echo "✓ deploy done"
