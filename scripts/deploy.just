# deploy.just — ship · build, preview, publish, and release

# Plugins shipped in the published rune-lab package. Canonical registry and dependency facts live in scripts/plugins.ts
BUILD_PLUGINS := "layout palettes i18n observer api"

[doc('Run quality gate (check + test) (pass -v for detailed logs, -p for parallel)')]
[group('ci')]
[positional-arguments]
ci *flags: (test flags) (check flags)

[doc('Build the rune-lab package: deno.json -> build/{dist, package.json, README, LICENSE}')]
[group('deploy')]
build:
    # * Clean previous build
    ^{{ CLI }} rm --paths '["build"]'
    # * Generate build/package.json (exports & deps derived from BUILD_PLUGINS)
    deno run -A scripts/manifest.ts {{ BUILD_PLUGINS }}
    # * Compile i18n messages → paraglide runtime
    just _paraglide src/packages/plugins/i18n/src/lang/project.inlang src/packages/plugins/i18n/src/lang/paraglide
    # * Bundle workspace members: core + ui always, plugins from BUILD_PLUGINS
    just svelte-package ui
    just svelte-package core
    "{{ BUILD_PLUGINS }}" | split row " " | each {|p| just svelte-package $"plugins/($p)" } | ignore
    # * Format build output
    deno fmt build
    # * Post-build: strip i18n artifacts, rewrite .ts→.js imports, inline the version
    nu scripts/build.nu
    -biome format --config-path=config/biome.json --write --vcs-use-ignore-file=false ./build
    -biome check --config-path=config/biome.json --fix --vcs-use-ignore-file=false ./build
    @echo "✓ build done"

[doc('Production-build and preview an app against the freshly injected pkg')]
[group('deploy')]
[positional-arguments]
preview *flags:
    ^{{ CLI }} exec {{ flags }} --title BUILD --select one --cwd 'apps/*' -- deno run -A npm:vite build
    ^{{ CLI }} exec {{ flags }} --title PREVIEW --select one --cwd 'apps/*' -- deno run -A npm:vite preview

[doc('Prepare a clean workspace, run CI quality gates, and build')]
[group('deploy')]
cycle: prepare (ci "-vp") build

[working-directory('build')]
[private]
[script]
_with-brave +cmd:
    let d = (mktemp -d)
    "#!/usr/bin/env nu\ndef main [...args] { exec brave ...$args }" | save -f $"($d)/xdg-open"
    chmod +x $"($d)/xdg-open"
    with-env { PATH: ($env.PATH | prepend $d) } { {{ cmd }} }
    print "✓ {{ cmd }} done"

[doc('Publish build/ to npm')]
[group('deploy')]
publish: build (_with-brave "bun publish")

[doc('npm login')]
[group('deploy')]
login: (_with-brave "bunx npm login")
