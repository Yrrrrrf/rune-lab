PROJECT := "rune-lab"
VERSION := `git describe --tags --always`

TSCONFIG := justfile_directory() / "src/tsconfig.json"
SVELTE_SHIM := justfile_directory() / "scripts/shims/svelte.config.js"
PKG_SHIM := justfile_directory() / "scripts/shims/package.json"

SVELTE_WORKSPACES := "src/packages/ui src/packages/plugins/palettes src/packages/plugins/layout src/packages/plugins/observer src/packages/plugins/i18n apps/lab"
VP_WORKSPACES := "src/packages/ui src/packages/plugins/palettes src/packages/plugins/layout"

[default]
[doc('List all available recipes')]
[group('meta')]
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

# closure-as-data: shim in, run, shim out — skips the copy when the
# workspace ships its own real config (e.g. ui's svelte.config.js)
[doc('Copy a shim file into dir, run cmd there, always remove the shim')]
[positional-arguments]
[private]
with-shim dir shim *cmd:
    #!/usr/bin/env nu
    def --wrapped main [dir: string, shim: string, ...cmd: string] {
      let dest = ($dir | path join ($shim | path basename))
      let run = { cd $dir; ^($cmd | first) ...($cmd | skip 1) }
      if ($dest | path exists) { do $run } else {
        cp $shim $dest
        try { do $run } finally { rm -f $dest }
      }
    }
