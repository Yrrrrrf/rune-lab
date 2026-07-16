[doc('Run quality gate (check + test)')]
[group('ci')]
ci: check test

[doc('Prune all node_modules, .svelte-kit, .vite, deno.lock')]
prune:
    fd -u --prune '^(node_modules|\.svelte-kit|\.vite|deno\.lock)$' | lines | each {|p| rm -r -f $p }

[doc('Purge caches & lockfiles, reinstall deps, resync generated code')]
[group('ci')]
prepare: prune
    # Install on workspace
    deno install
    # Compile paraglide
    just paraglide src/packages/plugins/i18n/src/lang/project.inlang src/packages/plugins/i18n/src/lang/paraglide
    # Install on main lab for testing...
    cd apps/lab; deno install
    cd apps/lab; deno run -A npm:@sveltejs/kit/svelte-kit sync

# todo: Add just commit to my own personal scripts on main path... It absolutly rocks...
[doc('Commit with AI-generated message via azathoth (pass y to auto-accept)')]
[group('ci')]
commit answer='': fmt
    #!/usr/bin/env nu
    open --raw ("~/Documents/lab/ai/.env" | path expand)
        | lines
        | parse "{key}={value}"
        | reduce -f {} {|it, acc| $acc | insert $it.key $it.value }
        | load-env
    git add -A
    {{ if answer == '' { '' } else { "'" + answer + "' | " } }}uvx azathoth workflow commit
