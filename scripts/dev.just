# dev.just — run, live preview, and prepare workspace

[doc('Run an app on the dev server')]
[group('dev')]
[positional-arguments]
run *flags:
    ^{{ CLI }} exec {{ flags }} --title DEV --select one --cwd 'apps/*' -- deno run -A npm:vite dev --host

[doc('Prune all node_modules, .svelte-kit, .vite, deno.lock, build/, dist/, coverage')]
[group('dev')]
[positional-arguments]
prune *flags:
    ^{{ CLI }} rm --glob '**/node_modules' '**/.svelte-kit' '**/.vite' 'build' 'dist' 'coverage' '.justcache' 'deno.lock' {{ flags }}

[doc('Purge caches & lockfiles, reinstall deps, resync generated code')]
[group('dev')]
[positional-arguments]
prepare *flags: (prune flags)
    ^deno install
    just _paraglide src/packages/plugins/i18n/src/lang/project.inlang src/packages/plugins/i18n/src/lang/paraglide
    cd apps/lab; ^deno install
    cd apps/lab; ^deno run -A npm:@sveltejs/kit/svelte-kit sync

[doc('Inject the built pkg (build/) into lab for local testing')]
[group('dev')]
[script]
inject root=justfile_directory():
    let lab_modules = $"{{ root }}/apps/lab/node_modules"
    rm -rf $"($lab_modules)/rune-lab"
    cp -r $"{{ root }}/build" $"($lab_modules)/rune-lab"
    diff -r $"{{ root }}/build" $"($lab_modules)/rune-lab"
    print "✓ injected into node_modules/rune-lab"
