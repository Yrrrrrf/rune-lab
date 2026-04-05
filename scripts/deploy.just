[doc('Build Client')]
[group('Build')]
[working-directory('src/package')]
build:
    # * Clean previous build
    rm -rf dist/
    # * Compile i18n messages → paraglide runtime
    deno run -A npm:@inlang/paraglide-js compile --project ./src/lib/i18n/project.inlang --outdir ./src/lib/i18n/paraglide
    # * Bundle the svelte package (src → dist)
    deno run -A npm:@sveltejs/package -- -i src -o dist
    # * Post-build cleanup: strip i18n artifacts, rewrite .ts→.js imports, inject version
    deno run --allow-read --allow-write ../../scripts/build-pkg.ts
    # * Remove svelte-kit intermediate cache
    rm -rf .svelte-kit/__package__
    # * Format dist output
    deno fmt dist
    @echo "✓ build done"

[doc('Publish package to npm')]
[group('Deploy')]
[working-directory('src/package')]
deploy: build
    bun publish
    @echo "✓ deploy done"
