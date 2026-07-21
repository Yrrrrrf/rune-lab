# Plugins shipped in the published rune-lab package. Canonical registry and dependency facts live in scripts/plugins.ts
BUILD_PLUGINS := "layout palettes i18n observer"

[doc('Build the rune-lab package: deno.json -> build/{dist, package.json, README, LICENSE}')]
[group('Build')]
build:
    # * Clean previous build
    rm -rf build
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
    -biome format --write ./build
    -biome check --fix ./build
    @echo "✓ build done"

[working-directory('build')]
_with-brave +cmd:
    #!/usr/bin/env nu
    let d = (mktemp -d)
    "#!/usr/bin/env nu\ndef main [...args] { exec brave ...$args }" | save -f $"($d)/xdg-open"
    chmod +x $"($d)/xdg-open"
    with-env { PATH: ($env.PATH | prepend $d) } { {{ cmd }} }
    print "✓ {{ cmd }} done"

[doc('Publish build/ to npm')]
[group('Deploy')]
publish: build (_with-brave "bun publish")

[doc('npm login')]
[group('Deploy')]
login: (_with-brave "bunx npm login")

[doc('Inject the built pkg (build/) into lab for local testing')]
[group('Deploy')]
inject root=justfile_directory(): build prepare
    # * Replace lab's installed rune-lab with the freshly built build/ layout
    rm -rf "{{ root }}/node_modules/rune-lab"
    cp -r "{{ root }}/build" "{{ root }}/node_modules/rune-lab"
    # * Verify the injection
    diff -r "{{ root }}/build" "{{ root }}/node_modules/rune-lab"
    @echo "✓ injected into node_modules/rune-lab"
