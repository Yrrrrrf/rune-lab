[doc('Build Client')]
[group('Build')]
build:
    # * Compile i18n first — UI depends on it
    bun run compile:i18n

    # * Build process (strict dependency order: core → state → ui):
    # CORE — pure tsc, no Svelte needed
    bun run --cwd src/sdk/core build
    # STATE — svelte-package handles .svelte.ts rune files (includes auth)
    bun run --cwd src/sdk/state build
    # UI — svelte-package, outputs to dist/ui/
    bun run --cwd src/sdk/ui build
    bun run build:index  # Generate root index.js + index.d.ts

    # Clean up paraglide artifacts that shouldn't be published
    rm -f dist/ui/paraglide/.gitignore dist/ui/paraglide/.prettierignore

    # Validate the published package shape
    bun run publint

[doc('Publish to npm & jsr')]
[group('Deploy')]
deploy:
    bun publish
    @echo "✓ Client published to npm & jsr"
