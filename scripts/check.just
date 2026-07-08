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
    do { cd src/packages/ui; bunx svelte-check --tsconfig tsconfig.json }
    do { cd apps/lab; deno run -A npm:svelte-check --tsconfig tsconfig.json }

[doc('Audit all code namespaces')]
[group('check')]
[working-directory('src')]
audit:
    deno run -A npm:@inlang/paraglide-js compile --project ./packages/ui/src/lib/i18n/project.inlang --outdir ./packages/ui/src/lib/i18n/paraglide
    # deno run -A npm:@inlang/paraglide-js compile --project ./apps/lab/src/lib/i18n/project.inlang --outdir ./apps/lab/src/lib/i18n/paraglide
    deno run -A npm:fallow -c .fallowrc.json

[doc('Test coverage')]
[group('check')]
coverage:
    deno test --coverage

[doc('Run all check quality gates')]
[group('check')]
check: fmt lint types audit
