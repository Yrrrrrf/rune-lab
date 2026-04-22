[doc('Format code')]
[group('CI')]
fmt:
    deno fmt .
    @echo "✓ Code formatted"

[doc('Lint code')]
[group('CI')]
lint:
    deno lint .
    @echo "✓ Code linted"

[doc('Type-check workspace')]
[group('CI')]
typecheck:
    # Test package
    # -cd src/package && deno check -c tsconfig.json
    -cd src/package && deno run -A npm:svelte-check --tsconfig tsconfig.json
    # Test lab
    # -cd src/lab && deno check -c tsconfig.json
    -cd src/lab && deno run -A npm:svelte-check --tsconfig tsconfig.json
    @echo "✓ Type-checked"

[doc('Full quality gate')]
[group('CI')]
quality: fmt lint typecheck
    @echo "✓ Quality checks passed"
