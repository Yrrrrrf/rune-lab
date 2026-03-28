[doc('Build Client')]
[group('Build')]
build:
    # * Clean up previous build
    rm -rf dist

    # * Build library using vite-plus
    vp build

    # Clean up paraglide artifacts that shouldn't be published
    rm -f dist/paraglide/.gitignore dist/paraglide/.prettierignore

    # Validate the published package shape
    vp exec publint

[doc('Publish to jsr')]
[group('Deploy')]
deploy:
    deno task build:npm
    @echo "✓ npm package assembled"
