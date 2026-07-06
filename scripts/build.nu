#!/usr/bin/env nu
# Post-build cleanup for the rune-lab package.
#
# Expected to be run from the package directory or given a path to it.

def main [
  pkg_dir?: path # The package directory (defaults to current working directory)
]: nothing -> nothing {
  let pkg_dir = ($pkg_dir | default $env.PWD | path expand)
  let dist = ($pkg_dir | path join "dist")
  let pkg_json = ($pkg_dir | path join "package.json")

  if not ($pkg_json | path exists) {
    error make {msg: $"package.json not found in ($pkg_dir)"}
  }

  print $"Running post-build cleanup for package at: ($pkg_dir)"

  # ── 1. Remove unwanted i18n directories / files ────────────────────────
  let remove_paths = [
    ($dist | path join "i18n" "project.inlang")
    ($dist | path join "i18n" "translations")
    ($dist | path join "i18n" "paraglide" ".gitignore")
  ]

  for p in $remove_paths {
    if ($p | path exists) {
      rm -rf $p
      print $"  removed  ($p | path relative-to $pkg_dir)"
    }
  }

  # ── 2. Delete *.test.js inside dist/i18n/ ──────────────────────────────
  let i18n_dir = ($dist | path join "i18n")
  if ($i18n_dir | path exists) {
    glob ($i18n_dir | path join "**" "*.test.js") | each {|p|
      rm -f $p
      print $"  removed  ($p | path relative-to $pkg_dir)"
    }
  }

  # ── 3. & 4. Process files: Rewrite imports & Inject package.json version ──
  let version = (open $pkg_json | get version)
  let files = (glob ($dist | path join "**" "*.{js,ts,svelte}") | where {|p| ($p | path type) == "file"})

  let ts_import_re = "(from\\s+[\"'])([^\"']*?)\\.ts([\"'])"
  let pkg_import_re = "import\\s+pkgConfig\\s+from\\s+[\"'].*package\\.json[\"'];?\\s*\\n?\\s*(?:with\\s*\\{[^}]*\\}\\s*;?\\s*\\n?)?"
  let with_type_re = "(?m)^\\s*with\\s*\\{\\s*type:\\s*[\"']json[\"']\\s*\\}\\s*;?\\s*\\n?"
  let pkg_version_re = "pkgConfig\\.version"

  mut rewrote_imports = false
  mut injected_versions = 0

  for p in $files {
    let original = (open --raw $p)
    
    # Rewrite .ts → .js in imports
    let step1 = ($original | str replace --all --regex $ts_import_re '$1$2.js$3')
    if $step1 != $original {
      $rewrote_imports = true
    }

    # Inject version & strip package.json import
    let step2 = ($step1
      | str replace --all --regex $pkg_import_re ''
      | str replace --all --regex $with_type_re ''
      | str replace --all --regex $pkg_version_re $"\"($version)\""
    )

    if $step2 != $step1 {
      $injected_versions += 1
    }

    if $step2 != $original {
      $step2 | save -f $p
    }
  }

  if $rewrote_imports {
    print "  rewrote  .ts → .js imports"
  }
  if $injected_versions > 0 {
    print $"  injected version \"($version)\" into ($injected_versions) files"
  }

  print "✓ build.nu cleanup done"
}
