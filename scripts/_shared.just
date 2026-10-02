# _shared.just — vars, private helpers, and the front door. Shared into every
# layer via `import`; settings and variables live here once.

PROJECT := "rune-lab"
CLI := "deno run -A jsr:@yrrrrrf/dv@0.0.4"
export DV_JUSTFILE := justfile()

[default]
[doc('List all available recipes')]
[group('meta')]
list:
    ^{{ CLI }} list --justfile $env.DV_JUSTFILE

[doc('Choose a recipe and app target')]
[group('meta')]
menu:
    ^{{ CLI }} menu --justfile $env.DV_JUSTFILE --complete run 'apps/*' --complete preview 'apps/*'

[doc('Compile an inlang project into a paraglide runtime')]
[group('build')]
[private]
_paraglide project outdir:
    ^deno run -A npm:@inlang/paraglide-js compile --project "{{ project }}" --outdir "{{ outdir }}" --emit-ts-declarations

SVELTE_SHIM := justfile_directory() / "scripts/shims/package.json"

[doc('Package one workspace member: src/packages/<dir>/src → build/dist/src/<dir>')]
[group('build')]
[private]
svelte-package dir out=("src" / dir):
    just with-shim src "{{ SVELTE_SHIM }}" \
      deno run -A --node-modules-dir=auto npm:@sveltejs/package -i packages/{{ dir }}/src \
      -o "{{ justfile_directory() }}/build/dist/{{ out }}"

[doc('Copy a shim file into dir, run cmd there, always remove the shim')]
[positional-arguments]
[private]
[script]
with-shim dir shim *cmd:
    def --wrapped main [dir: string, shim: string, ...cmd: string] {
      let dest = ($dir | path join ($shim | path basename))
      let run = { cd $dir; ^($cmd | first) ...($cmd | skip 1) }
      if ($dest | path exists) { do $run } else {
        cp $shim $dest
        try { do $run } finally { rm -f $dest }
      }
    }
