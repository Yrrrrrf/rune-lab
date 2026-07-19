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
    # * Specifier-leak gate
    do { rg "@rune-lab" build/ } | complete | if $in.exit_code == 0 { error make { msg: "Specifier-leak gate violation: '@rune-lab' references found in build/" } }
    # * Augmentation-survival gate
    do { rg "@rune-lab/core" build/dist/ } | complete | if $in.exit_code == 0 { error make { msg: "Augmentation-survival gate violation: '@rune-lab/core' references found in build/dist/" } }
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
inject root=justfile_directory(): build
    # * Replace lab's installed rune-lab with the freshly built build/ layout
    rm -rf "{{ root }}/node_modules/rune-lab"
    cp -r "{{ root }}/build" "{{ root }}/node_modules/rune-lab"
    # * Verify the injection
    diff -r "{{ root }}/build" "{{ root }}/node_modules/rune-lab"
    @echo "✓ injected into node_modules/rune-lab"
