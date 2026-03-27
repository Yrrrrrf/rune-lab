[doc('Format Client code')]
[group('CI')]
fmt:
    deno fmt .
    @echo "✓ Client code formatted"

[doc('Lint Client code')]
[group('CI')]
lint:
    deno lint .
    @echo "✓ Client code linted"

[doc('Type-check Client workspace')]
[group('CI')]
typecheck:
    # check ts types with strict deno.ns
    deno check .
    # check svelte types
    deno run -A npm:svelte-check
    # todo: Maybe change this to a vp command
    @echo "✓ Client type-checked"

[doc('Full client quality gate')]
[group('CI')]
quality: fmt lint typecheck
    @echo "✓ Client quality checks passed"
