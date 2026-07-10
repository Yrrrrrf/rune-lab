[doc('Build the rune-lab package (ui): deno.json -> package.json -> dist')]
[group('Build')]
[working-directory('src/packages/ui')]
build:
    # * Generate the throwaway package.json from deno.json (the source of truth)
    nu ../../../scripts/build.nu --manifest
    # * Clean previous build
    rm -rf dist
    # * Compile i18n messages → paraglide runtime (returns when ui regains an inlang project)
    # just paraglide ./src/lib/i18n/project.inlang ./src/lib/i18n/paraglide
    # * Bundle the svelte package (src/lib → dist)
    deno run -A npm:@sveltejs/package -- -i . -o dist
    # * Post-build: strip i18n artifacts, rewrite .ts→.js imports, inline the version
    nu ../../../scripts/build.nu --patch
    # * Remove svelte-kit intermediate cache
    rm -rf .svelte-kit
    # * Format dist output
    deno fmt dist
    @echo "✓ build done"

[doc('Publish package to npm using brave as default browser')]
[group('Deploy')]
[script('nu')]
[working-directory('src/packages/ui')]
publish:
    let d = (mktemp -d | str trim)
    '#!/bin/sh
    exec brave "$@"' | save -f $"($d)/xdg-open"
    chmod +x $"($d)/xdg-open"
    with-env { PATH: ($env.PATH | prepend $d) } { bun publish }
    print "✓ deploy done"

[doc('Inject the built pkg (dist + generated manifest) into lab for local testing')]
[group('Deploy')]
inject root=justfile_directory():
    # * Build the package first
    just build
    # * Replace lab's installed rune-lab with the freshly built dist + package.json
    rm -rf "{{ root }}/node_modules/rune-lab/dist"
    mkdir "{{ root }}/node_modules/rune-lab"
    cp -r "{{ root }}/src/packages/ui/dist" "{{ root }}/node_modules/rune-lab/dist"
    cp "{{ root }}/src/packages/ui/package.json" "{{ root }}/node_modules/rune-lab/package.json"
    # * Verify the injection
    diff -r "{{ root }}/src/packages/ui/dist" "{{ root }}/node_modules/rune-lab/dist"
    @echo "✓ injected into node_modules/rune-lab"
