build:
    # * Compile i18n first — UI depends on it
    bun run compile:i18n

    # * Build process:
    # CORE — pure tsc, no Svelte needed
    bun run --cwd src/sdk/core build
    # STATE — svelte-package handles .svelte.ts rune files
    bun run --cwd src/sdk/state build
    # UI — svelte-package, now outputs to dist/ui/
    bun run --cwd src/sdk/ui package

    # * Write root index directly — nothing to compile, just re-exports
    printf 'export * from "./ui/index.js";\nexport { cookieDriver, localStorageDriver, sessionStorageDriver } from "./state/index.js";\n' > dist/index.js
    printf 'export * from "./ui/index.js";\nexport { cookieDriver, localStorageDriver, sessionStorageDriver } from "./state/index.js";\n' > dist/index.d.ts

    # Clean up paraglide artifacts that shouldn't be published
    rm -f dist/ui/paraglide/.gitignore dist/ui/paraglide/.prettierignore

    # Validate the whole thing
    bun run publint
