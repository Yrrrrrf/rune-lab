# test.just — test runner and coverage

TEST_RULES := '''
[
  {
    "packages": "src/packages/core",
    "pattern": "src/packages/core/src/*.test.ts",
    "engine": "deno test",
    "cwd": "{root}",
    "command": ["deno", "test", "--allow-all", "src/packages/core/src/"]
  }
]
'''

[doc('Run one workspace member through vitest (shim in, test, shim out)')]
[group('test')]
[private]
test-project dir="src/":
    just with-shim . "{{ justfile_directory() / "scripts/shims/package.json" }}" deno run -A npm:vitest run --passWithNoTests {{ dir }}

[doc('Run unit and integration test matrix (pass -v for logs, -p for parallel)')]
[group('test')]
[positional-arguments]
test *flags:
    ^{{ CLI }} matrix --title "TEST" --rules '{{ TEST_RULES }}' {{ flags }}

[doc('Collect test coverage')]
[group('test')]
[positional-arguments]
coverage *flags:
    ^{{ CLI }} exec {{ flags }} --title COVERAGE -- deno test --coverage
