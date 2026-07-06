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
    cd src/package; bunx svelte-check --tsconfig tsconfig.json
    cd src/lab; deno run -A npm:svelte-check --tsconfig tsconfig.json

[doc('Audit all code namespaces')]
[group('check')]
audit:
    deno run -A npm:fallow

[doc('Run all check quality gates')]
[group('check')]
check: fmt lint types
