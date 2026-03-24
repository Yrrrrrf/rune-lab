[doc('Build Client')]
[group('Build')]
build:
    # * Clean up previous build
    rm -rf dist

    # * Build in strict dependency order: core → state → ui
    deno task build:core
    deno task build:state
    deno task build:ui

    # * Build main index.js and index.d.ts
    deno task build:index

    # Clean up paraglide artifacts that shouldn't be published
    rm -f dist/ui/paraglide/.gitignore dist/ui/paraglide/.prettierignore

    # Validate the published package shape
    vp exec publint

[doc('Publish to jsr')]
[group('Deploy')]
deploy:
    deno run -A scripts/build_npm.ts
    @echo "✓ npm package assembled — run: cd npm && npx npm publish"
