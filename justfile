build:
    bun run compile:i18n
    bun run package
    bun run publint
    rm -f dist/paraglide/.gitignore dist/paraglide/.prettierignore
