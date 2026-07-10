PROJECT := "rune-lab"
VERSION := `git describe --tags --always`

[default]
[group('meta')]
[doc('List all available recipes')]
list:
    @just --list --unsorted

[private]
_clean-tree:
    if (git status --porcelain | is-not-empty) { error make {msg: "working tree dirty"} }

[doc('Compile an inlang project into a paraglide runtime')]
[group('Build')]
[no-cd]
paraglide project outdir:
    deno run -A npm:@inlang/paraglide-js compile --project "{{ project }}" --outdir "{{ outdir }}"
