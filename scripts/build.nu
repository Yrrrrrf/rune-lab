#!/usr/bin/env nu
# Post-svelte-package patch pass over build/dist for the rune-lab package (ui).
#
# manifest.ts owns package.json / README / LICENSE; this script only cleans and
# rewrites the compiled output:
#
#   - strip i18n artifacts svelte-package copied into dist
#   - rewrite .ts -> .js imports and @rune-lab/* -> rune-lab/* specifiers
#   - strip the dev-time manifest import, inline the version as a literal
#
# svelte-package already writes every member to its final dist/src/<path>
# location, so no reshuffling happens here.
# The version comes from the root deno.json (the canonical one).

# Remove inlang project files and test output that svelte-package copied into dist.
def strip-i18n-artifacts [root: path, dist: path]: nothing -> nothing {
  let removals = [
    ($dist | path join "src" "plugins" "i18n" "lang" "project.inlang")
    ($dist | path join "src" "plugins" "i18n" "lang" "translations")
    ($dist | path join "src" "plugins" "i18n" "lang" "paraglide" ".gitignore")
  ]
  $removals | where {|p| $p | path exists } | each {|p|
    rm -r -f $p
    print $"  removed  ($p | path relative-to $root)"
  } | ignore

  let i18n_dir = ($dist | path join "src" "plugins" "i18n")
  if ($i18n_dir | path exists) {
    glob ($i18n_dir | path join "**" "*.test.js") | each {|p|
      rm -f $p
      print $"  removed  ($p | path relative-to $root)"
    } | ignore
    glob ($i18n_dir | path join "**" "*.test.d.ts") | each {|p|
      rm -f $p
      print $"  removed  ($p | path relative-to $root)"
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
  let rewritten = ($original
    | str replace --all --regex $ts_import_re '$1$2.js$3'
  )

  let patched = ($rewritten
    | str replace --all --regex $manifest_import_re ''
    | str replace --all --regex $with_type_re ''
    | str replace --all --regex $version_call_re $"\"($version)\""
  )
  if $patched != $original { $patched | save -f $file }
  {rewrote: ($rewritten != $original), injected: ($patched != $rewritten)}
}

def main [
  root?: path # The repo root (defaults to current working directory)
]: nothing -> nothing {
  let root = ($root | default $env.PWD | path expand)
  let dist = ($root | path join "build" "dist")
  if not ($dist | path exists) {
    error make {msg: $"($dist) not found - run svelte-package first"}
  }
  let version = (open ($root | path join "deno.json") | get version)

  print $"Patching build/dist at: ($root)"
  strip-i18n-artifacts $root $dist

  # Remove all test files in dist
  glob ($dist | path join "**" "*.test.*") | each {|p|
    rm -r -f $p
    print $"  removed  ($p | path relative-to $root)"
  } | ignore

  let results = (
    glob ($dist | path join "**" "*.{js,ts,svelte}")
    | where {|p| ($p | path type) == "file" }
    | each {|p| patch-file $p $version }
  )

  if ($results | any {|r| $r.rewrote }) {
    print "  rewrote  specifiers and .ts -> .js imports"
  }
  let injected = ($results | where {|r| $r.injected } | length)
  if $injected > 0 {
    print $"  injected version \"($version)\" into ($injected) files"
  }

  # Verification gates
  print "Running verification gates..."
  let pkg_json = (open ($root | path join "build" "package.json"))
  let exports = ($pkg_json | get exports)

  for entry in ($exports | columns) {
    let paths = ($exports | get $entry)
    let types_path = (if ($paths | describe) =~ "record" {
      $paths | get types? | default null
    } else {
      null
    })
    let default_path = (if ($paths | describe) =~ "record" {
      $paths | get default? | default ($paths | get svelte?) | default null
    } else {
      $paths
    })

    if $types_path != null {
      let full_types_path = ($root | path join "build" ($types_path | str replace "./" ""))
      if not ($full_types_path | path exists) {
        error make {msg: $"Export gate failed: export '($entry)' target types file '($full_types_path)' does not exist!"}
      }
      print $"  verified types for '($entry)' -> ($types_path)"
    } else {
      error make {msg: $"Export gate failed: export '($entry)' has no types (d.ts) entry!"}
    }

    if $default_path != null {
      let full_path = ($root | path join "build" ($default_path | str replace "./" ""))
      if not ($full_path | path exists) {
        error make {msg: $"Export gate failed: export '($entry)' target file '($full_path)' does not exist!"}
      }
      print $"  verified export '($entry)' -> ($default_path)"
    }
  }

  # Gate: no .ts specifiers may survive in dist
  let ts_leftovers = (
    glob ($dist | path join "**" "*.{js,svelte}")
    | where {|p| ($p | path type) == "file" }
    | where {|p| (open --raw $p) =~ "(from\\s+|import\\()\\s*[\"'][^\"']+\\.ts[\"']" }
  )
  if ($ts_leftovers | is-not-empty) {
    error make {msg: $"Export gate failed: .ts specifiers survive in: ($ts_leftovers | each {|p| $p | path relative-to $root } | str join ', ')"}
  }

  print "✓ build.nu done"
}
