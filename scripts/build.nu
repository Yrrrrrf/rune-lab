#!/usr/bin/env nu
# Build pipeline helpers for the rune-lab package (ui).
#
# deno.json is the single source of truth; package.json is a generated,
# throwaway npm manifest. Two entry points, meant to sandwich svelte-package:
#
#   --manifest   deno.json -> package.json (name, version, exports, deps)
#   --patch      post-build pass over dist: strip i18n artifacts, rewrite
#                .ts -> .js imports, strip the dev-time manifest import,
#                inline the version as a literal.

# npm identity of the package; the deno.json `name` (@rune-lab/svelte) is the
# JSR one. This constant is the single knob if the two ever unify.
const NPM_NAME = "rune-lab"

# deno.json `imports` mixes dev-time and runtime deps, so the runtime surface
# is declared here; versions are pulled from deno.json.
const PEER_IMPORTS = ["svelte"]
const RUNTIME_IMPORTS = ["esm-env"]

# "npm:@scope/pkg@^1.2" | "npm:pkg@^1" | "npm:pkg" -> {name, range}
def parse-npm-spec [spec: string]: nothing -> record {
  $spec
  | str replace --regex '^npm:' ''
  | parse -r '^(?P<name>(?:@[^/]+/)?[^@]+)(?:@(?P<range>.+))?$'
  | first
  | update range {|r| if ($r.range | is-empty) { "*" } else { $r.range } }
}

# Pick the listed import keys out of deno.json imports as {pkg: range}.
def pick-deps [imports: record, keys: list<string>]: nothing -> record {
  $keys
  | where {|k| $k in ($imports | columns) }
  | reduce -f {} {|k, acc|
    let spec = (parse-npm-spec ($imports | get $k))
    $acc | insert $spec.name $spec.range
  }
}

# Map deno.json exports (./src/lib/*.ts) onto the packaged dist/*.js layout.
def dist-exports [exports: record]: nothing -> record {
  $exports | transpose key src | reduce -f {} {|it, acc|
    let js = ($it.src
      | str replace --regex '^\./src/lib/' './dist/'
      | str replace --regex '\.ts$' '.js')
    $acc | insert $it.key {
      types: ($js | str replace --regex '\.js$' '.d.ts')
      svelte: $js
      default: $js
    }
  }
}

# deno.json -> a minimal package.json for svelte-package, injection & publish.
def gen-manifest [pkg_dir: path]: nothing -> nothing {
  let deno = (open ($pkg_dir | path join "deno.json"))
  let exports = (dist-exports $deno.exports)
  {
    name: $NPM_NAME
    version: $deno.version
    type: "module"
    files: ["dist"]
    svelte: ($exports | get "." | get svelte)
    exports: $exports
    peerDependencies: (pick-deps $deno.imports $PEER_IMPORTS)
    dependencies: (pick-deps $deno.imports $RUNTIME_IMPORTS)
  } | to json | save -f ($pkg_dir | path join "package.json")
  print $"  wrote    package.json \(($NPM_NAME)@($deno.version)\)"

  let jsr_only = ($deno.imports | transpose k v | where {|r| $r.v | str starts-with "jsr:" } | get k)
  if ($jsr_only | is-not-empty) {
    print $"  note     jsr-only imports skipped in package.json: ($jsr_only | str join ', ')"
  }
}

# Remove inlang project files and test output that svelte-package copied into dist.
def strip-i18n-artifacts [pkg_dir: path, dist: path]: nothing -> nothing {
  let removals = [
    ($dist | path join "i18n" "project.inlang")
    ($dist | path join "i18n" "translations")
    ($dist | path join "i18n" "paraglide" ".gitignore")
  ]
  $removals | where {|p| $p | path exists } | each {|p|
    rm -r -f $p
    print $"  removed  ($p | path relative-to $pkg_dir)"
  } | ignore

  let i18n_dir = ($dist | path join "i18n")
  if ($i18n_dir | path exists) {
    glob ($i18n_dir | path join "**" "*.test.js") | each {|p|
      rm -f $p
      print $"  removed  ($p | path relative-to $pkg_dir)"
    } | ignore
  }
}

# Patch one dist file; returns what changed so the caller can report totals.
def patch-file [file: path, version: string]: nothing -> record {
  let ts_import_re = "(from\\s+[\"'])([^\"']*?)\\.ts([\"'])"
  # Dev-time manifest import: `import pkgConfig from "../../deno.json" with { type: "json" };`
  # (matches the old package.json form too, with or without the inline attribute)
  let manifest_import_re = "import\\s+pkgConfig\\s+from\\s+[\"'][^\"']*(?:deno|package)\\.json[\"']\\s*(?:with\\s*\\{[^}]*\\})?\\s*;?\\s*\\n?"
  let with_type_re = "(?m)^\\s*with\\s*\\{\\s*type:\\s*[\"']json[\"']\\s*\\}\\s*;?\\s*\\n?"
  let version_call_re = "pkgConfig\\.version"

  let original = (open --raw $file)
  let rewritten = ($original | str replace --all --regex $ts_import_re '$1$2.js$3')
  let patched = ($rewritten
    | str replace --all --regex $manifest_import_re ''
    | str replace --all --regex $with_type_re ''
    | str replace --all --regex $version_call_re $"\"($version)\""
  )
  if $patched != $original { $patched | save -f $file }
  {rewrote: ($rewritten != $original), injected: ($patched != $rewritten)}
}

# Post-svelte-package pass over dist.
def run-patch [pkg_dir: path]: nothing -> nothing {
  let dist = ($pkg_dir | path join "dist")
  if not ($dist | path exists) {
    error make {msg: $"dist not found in ($pkg_dir) - run svelte-package first"}
  }
  let version = (open ($pkg_dir | path join "deno.json") | get version)

  strip-i18n-artifacts $pkg_dir $dist

  let results = (
    glob ($dist | path join "**" "*.{js,ts,svelte}")
    | where {|p| ($p | path type) == "file" }
    | each {|p| patch-file $p $version }
  )

  if ($results | any {|r| $r.rewrote }) {
    print "  rewrote  .ts -> .js imports"
  }
  let injected = ($results | where {|r| $r.injected } | length)
  if $injected > 0 {
    print $"  injected version \"($version)\" into ($injected) files"
  }
}

def main [
  pkg_dir?: path # The package directory (defaults to current working directory)
  --manifest     # Generate package.json from deno.json
  --patch        # Post-build pass over dist (run after svelte-package)
]: nothing -> nothing {
  let pkg_dir = ($pkg_dir | default $env.PWD | path expand)
  if not (($pkg_dir | path join "deno.json") | path exists) {
    error make {msg: $"deno.json not found in ($pkg_dir)"}
  }
  if not ($manifest or $patch) {
    error make {msg: "nothing to do - pass --manifest and/or --patch"}
  }

  print $"Running build.nu for package at: ($pkg_dir)"
  if $manifest { gen-manifest $pkg_dir }
  if $patch { run-patch $pkg_dir }
  print "✓ build.nu done"
}
