[doc('Build Client')]
[group('Build')]
[working-directory('src/package')]
build:
    rm -rf dist/
    deno run -A npm:@inlang/paraglide-js compile --project ./src/lib/i18n/project.inlang --outdir  ./src/lib/i18n/paraglide
    deno run -A npm:@sveltejs/package -- -i src -o dist
    deno run --allow-read --allow-write ../../scripts/build-pkg.ts
    rm -rf .svelte-kit/__package__
    deno fmt --no-config dist
    @echo "✓ build done"

[doc('Publish to jsr')]
[group('Deploy')]
[working-directory('src/package')]
deploy: build
    bun publish
    @echo "✓ deploy done"
