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
    deno check .
    @echo "✓ Client type-checked"

[doc('Full client quality gate')]
[group('CI')]
quality: fmt lint typecheck
    @echo "✓ Client quality checks passed"
