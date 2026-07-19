[default]
[doc('List all available recipes')]
[group('meta')]
list:
    @just --list --unsorted

[doc('Compile an inlang project into a paraglide runtime')]
[group('Build')]
paraglide project outdir:
    deno run -A npm:@inlang/paraglide-js compile --project "{{ project }}" --outdir "{{ outdir }}"

[doc('Package one workspace member: src/packages/<dir>/src → build/dist/src/<dir>')]
[group('Build')]
svelte-package dir out=("src" / dir):
    just with-shim src "{{ justfile_directory() / "scripts/shims/package.json" }}" deno run -A npm:@sveltejs/package -i packages/{{ dir }}/src -o "{{ justfile_directory() }}/build/dist/{{ out }}"

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
