[doc('Build the rune-lab package: deno.json -> build/{dist, package.json, README, LICENSE}')]
[group('Build')]
build:
    # * Clean previous build
    rm -rf build
    # * Generate build/package.json (exports & deps derived from BUILD_PLUGINS)
    deno run -A scripts/manifest.ts {{ BUILD_PLUGINS }}
    # * Compile i18n messages → paraglide runtime
    just paraglide src/packages/plugins/i18n/src/lang/project.inlang src/packages/plugins/i18n/src/lang/paraglide
    # * Bundle workspace members: core + ui always, plugins from BUILD_PLUGINS
    just svelte-package ui
    just svelte-package core
    "{{ BUILD_PLUGINS }}" | split row " " | each {|p| just svelte-package $"plugins/($p)" } | ignore
    # * Format build output
    deno fmt build
    # * Post-build: strip i18n artifacts, rewrite .ts→.js imports, inline the version
    nu scripts/build.nu
    -biome format --write ./build
    -biome check --fix ./build
    @echo "✓ build done"

[doc('Publish build/ to npm using brave as default browser')]
[group('Deploy')]
[script('nu')]
[working-directory('build')]
publish:
    let d = (mktemp -d | str trim)
    '#!/bin/sh
    exec brave "$@"' | save -f $"($d)/xdg-open"
    chmod +x $"($d)/xdg-open"
    with-env { PATH: ($env.PATH | prepend $d) } { bun publish }
    print "✓ deploy done"

[doc('Inject the built pkg (build/) into lab for local testing')]
[group('Deploy')]
inject root=justfile_directory(): build prepare
    # * Replace lab's installed rune-lab with the freshly built build/ layout
    rm -rf "{{ root }}/node_modules/rune-lab"
    cp -r "{{ root }}/build" "{{ root }}/node_modules/rune-lab"
    # * Verify the injection
    diff -r "{{ root }}/build" "{{ root }}/node_modules/rune-lab"
    @echo "✓ injected into node_modules/rune-lab"
