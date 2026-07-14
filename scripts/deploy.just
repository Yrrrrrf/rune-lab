[doc('Package one workspace member: src/packages/<dir>/src → build/dist/<out>')]
[group('Build')]
svelte-package dir out=dir:
    cd src/packages/{{ dir }}; deno run -A npm:@sveltejs/package -i src -o "{{ justfile_directory() }}/build/dist/{{ out }}"

[doc('Build the rune-lab package (ui): deno.json -> build/{dist, package.json, README, LICENSE}')]
[group('Build')]
build:
    # * Clean previous build
    rm -rf build
    # * Generate build/package.json from root + ui deno.json, copy README & LICENSE
    deno run -A scripts/manifest.ts
    # * Compile i18n messages → paraglide runtime (returns when ui regains an inlang project)
    # just paraglide ./src/packages/ui/src/i18n/project.inlang ./src/packages/ui/src/i18n/paraglide
    # * Bundle workspace members
    just svelte-package ui ""
    just svelte-package core
    just svelte-package plugins/layout
    just svelte-package plugins/palettes
    just svelte-package plugins/observer
    just svelte-package plugins/i18n
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
