# check.just — fix · writes & type/quality gates

[doc('Format workspace')]
[group('check')]
[positional-arguments]
fmt *flags:
    ^{{ CLI }} exec {{ flags }} --title FMT -- biome format --config-path=config/biome.json --write .

[doc('Lint workspace')]
[group('check')]
[positional-arguments]
lint *flags:
    -^{{ CLI }} exec {{ flags }} --title LINT -- deno lint .

[doc('Audit all code namespaces')]
[group('check')]
[positional-arguments]
audit *flags:
    ^{{ CLI }} exec {{ flags }} --title AUDIT -- deno run -A npm:fallow -c config/fallowrc.json

[doc('Check code health')]
[group('check')]
[positional-arguments]
health *flags:
    ^{{ CLI }} exec {{ flags }} --title HEALTH -- deno run -A npm:fallow health --score -c config/fallowrc.json

TYPES_RULES := '''
[
  {
    "packages": "src",
    "pattern": "src/tsconfig.json",
    "engine": "svelte-check-native",
    "cwd": "src",
    "command": ["deno", "run", "-A", "npm:svelte-check-native", "--tsconfig", "./tsconfig.json"]
  },
  {
    "packages": "apps/lab",
    "pattern": "apps/lab/tsconfig.json",
    "engine": "svelte-check-native",
    "cwd": "apps/lab",
    "command": ["deno", "run", "-A", "npm:svelte-check-native", "--tsconfig", "./tsconfig.json"]
  }
]
'''

[doc('Type-check workspace using declarative rules')]
[group('check')]
[positional-arguments]
types *flags:
    ^{{ CLI }} matrix --title "TYPES" --rules '{{ TYPES_RULES }}' {{ flags }}

[doc('Run all check quality gates (pass -v for detailed logs, -b for timing, -p for parallel)')]
[group('check')]
[positional-arguments]
check *args: fmt lint (types args)

[doc('Run biome check with auto-fix')]
[group('check')]
[positional-arguments]
biome *flags:
    -^{{ CLI }} exec {{ flags }} --title BIOME -- biome check --config-path=config/biome.json --fix .
    just fmt
