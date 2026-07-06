[doc('Build Client')]
[group('Build')]
[working-directory('src/package')]
build:
    # * Clean previous build
    rm -rf dist
    # * Compile i18n messages → paraglide runtime
    deno run -A npm:@inlang/paraglide-js compile --project ./src/lib/i18n/project.inlang --outdir ./src/lib/i18n/paraglide
    # * Bundle the svelte package (src → dist)
    deno run -A npm:@sveltejs/package -- -i src -o dist
    # * Post-build cleanup: strip i18n artifacts, rewrite .ts→.js imports, inject version
    nu ../../scripts/build.nu
    # * Remove svelte-kit intermediate cache
    rm -rf .svelte-kit
    # * Format dist output
    deno fmt dist
    @echo "✓ build done"

[doc('Publish package to npm using brave as default browser')]
[group('Deploy')]
[script('nu')]
[working-directory('src/package')]
publish:
    let d = (mktemp -d | str trim)
    '#!/bin/sh
    exec brave "$@"' | save -f $"($d)/xdg-open"
    chmod +x $"($d)/xdg-open"
    with-env { PATH: ($env.PATH | prepend $d) } { bun publish }
    print "✓ deploy done"

[doc('Inject built dist into lab for local testing')]
[group('Deploy')]
inject root=justfile_directory():
    # * Build the package first
    just build
    # * Replace lab's installed rune-lab/dist with the freshly built one
    rm -rf "{{ root }}/src/lab/node_modules/rune-lab/dist"
    cp -r "{{ root }}/src/package/dist" "{{ root }}/src/lab/node_modules/rune-lab/dist"
    # * Verify the injection
    diff -r "{{ root }}/src/package/dist" "{{ root }}/src/lab/node_modules/rune-lab/dist"
    @echo "✓ injected into src/lab/node_modules/rune-lab/dist"
