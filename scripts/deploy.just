[doc('Build Client')]
[group('Build')]
build:
    # * Clean up previous build
    rm -rf dist/
    # * Clean up svelte-kit build artifacts
    deno run -A npm:@inlang/paraglide-js compile  --project ./src/lib/i18n/project.inlang --outdir ./src/lib/i18n/paraglide
    deno run -A npm:@sveltejs/package -- -i src -o dist
    # * Clean up i18n dist — keep only paraglide/ and message-resolver
    rm -rf dist/i18n/project.inlang dist/i18n/translations dist/i18n/paraglide/.gitignore
    fd -e test.js . dist/i18n -x rm {}
    # * Rewrite .ts → .js in dist
    fd -e js -e ts -e svelte . dist -x sed -i "s/from \"\(\.[^\"]*\)\.ts\"/from \"\1.js\"/g; s/from '\(\.[^']*\)\.ts'/from '\1.js'/g" {}
    # * Inject package.json version as a static string in dist
    PKG_VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/') && \
        fd -e js -e ts -e svelte . dist -x sed -i '/import pkgConfig from.*package\.json/d' {} && \
        fd -e js -e ts -e svelte . dist -x sed -i "s/pkgConfig\.version/\"$PKG_VERSION\"/g" {}
    rm -rf .svelte-kit/__package__
    deno fmt --no-config dist
    @echo "✓ build done"

[doc('Publish to jsr')]
[group('Deploy')]
deploy: build
    # * Publish to npm
    bun publish
    @echo "✓ deploy done"
