[doc('Format workspace')]
[group('check')]
fmt:
    deno fmt .

[doc('Lint workspace')]
[group('check')]
lint:
    -deno lint .

[doc('Type-check workspace')]
[group('check')]
types:
    -cd src; deno run -A npm:svelte-check --tsconfig ./tsconfig.json
    -cd apps/lab; deno run -A npm:svelte-check --tsconfig ./tsconfig.json

[doc('Audit all code namespaces')]
[group('check')]
audit:
    deno run -A npm:fallow -c src/.fallowrc.json

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

[doc('Run biome check. This one is even stricter than deno!')]
biome:
    just prune
    -biome format --write .
    -biome check --fix .
    just fmt
