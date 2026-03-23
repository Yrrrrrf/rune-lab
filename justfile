# Rune Lab Justfile (automated tasks)
# CI

[doc('Format Client code')]
[group('CI')]
fmt:
    deno fmt
    @echo "✓ Client code formatted"

[doc('Lint Client code')]
[group('CI')]
lint:
    deno lint .
    @echo "✓ Client code linted"

[doc('Type-check Client workspace')]
[group('CI')]
typecheck:
    deno check .
    @echo "✓ Client type-checked"

[doc('Full client quality gate')]
[group('CI')]
quality: fmt lint typecheck
    @echo "✓ Client quality checks passed"

# Build

[doc('Sync SvelteKit and Build SDK')]
[group('Build')]
sync-ui:
    # Ensure SvelteKit syncs the generated tsconfig that the apps extend
    deno task --cwd sdk/ui prepare

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

[doc('Run the client in development mode')]
[group('Dev')]
run app=`ls apps/`:
    yog reborn --deep
    deno task --cwd sdk/ui prepare
    # todo: Add a way to run all apps at once
    # todo: Somehow orchestrate the apps to run in parallel
    deno task --cwd apps/{{ app }} dev

[doc('Test the client')]
[group('Dev')]
test:
    cd sdk/infrastructure && deno task test
    @echo "✓ Client tests passed"

[doc('Publish to npm & jsr')]
[group('Deploy')]
deploy:
    bun run publish
    @echo "✓ Client published to npm & jsr"
