#!/usr/bin/env nu
# Post-build pipeline for the rune-lab package (ui).
#
# deno.json is the version source of truth: step 0 mirrors it into
# package.json, then dist gets cleaned (i18n build artifacts), import
# specifiers rewritten (.ts -> .js), the dev-time manifest import
# stripped, and the version inlined as a literal.

# Mirror the deno.json version into package.json; returns the version.
def sync-version [pkg_dir: path]: nothing -> string {
  let version = (open ($pkg_dir | path join "deno.json") | get version)
  let pkg_json = ($pkg_dir | path join "package.json")
  open $pkg_json | upsert version $version | save -f $pkg_json
  print $"  synced   version ($version) -> package.json"
  $version
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

def main [
  pkg_dir?: path # The package directory (defaults to current working directory)
]: nothing -> nothing {
  let pkg_dir = ($pkg_dir | default $env.PWD | path expand)
  let dist = ($pkg_dir | path join "dist")

  for required in ["deno.json" "package.json"] {
    if not (($pkg_dir | path join $required) | path exists) {
      error make {msg: $"($required) not found in ($pkg_dir)"}
    }
  }
  if not ($dist | path exists) {
    error make {msg: $"dist not found in ($pkg_dir) - run svelte-package first"}
  }

  print $"Running post-build for package at: ($pkg_dir)"

  let version = (sync-version $pkg_dir)
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

  print "✓ build.nu done"
}
