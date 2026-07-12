[doc('Format workspace')]
[group('check')]
fmt:
    deno fmt .

[doc('Lint workspace')]
[group('check')]
lint:
    deno lint .

[doc('Type-check workspace')]
[group('check')]
types:
    do { cd src/packages/ui; deno run -A npm:svelte-check --tsconfig tsconfig.json }
    # do { cd src/packages/plugins/palettes; deno run -A npm:svelte-check --tsconfig ../../../tsconfig.json }
    # do { cd src/packages/plugins/layout; deno run -A npm:svelte-check --tsconfig ../../../tsconfig.json }
    # do { cd src/packages/plugins/observer; deno run -A npm:svelte-check --tsconfig ../../../tsconfig.json }
    # do { cd src/packages/plugins/i18n; deno run -A npm:svelte-check --tsconfig ../../../../tsconfig.json }
    do { cd apps/lab; deno run -A npm:svelte-check --tsconfig tsconfig.json }

[doc('Audit all code namespaces')]
[group('check')]
[working-directory('src')]
audit:
    deno run -A npm:fallow -c .fallowrc.json

[doc('Test coverage')]
[group('check')]
coverage:
    deno test --coverage

# todo: Put all of this inside an auxiliar nu script!
# todo: Enhance this to make it more powerful, since it is not checking all what it should
[doc('Run boundary gate check (no domain vocabulary in UI)')]
[group('check')]
check-boundary:
    do { rg -w -q "Theme|Shortcut|Command|Toast|Currency|hotkeys" src/packages/ui/ } | complete | if $in.exit_code == 0 { error make { msg: "Boundary gate violation: domain vocabulary found in src/packages/ui/" } }

[doc('Run all check quality gates')]
[group('check')]
check: fmt lint types
