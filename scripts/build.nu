#!/usr/bin/env nu
# Post-svelte-package patch pass over build/dist for the rune-lab package (ui).
#
# manifest.ts owns package.json / README / LICENSE; this script only cleans and
# rewrites the compiled output:
#
#   - strip i18n artifacts svelte-package copied into dist
#   - rewrite .ts -> .js imports
#   - strip the dev-time manifest import, inline the version as a literal
#
# The version comes from the root deno.json (the canonical one).

# Reshuffle the build/dist folder from flat to nested
def reshuffle [dist: path]: nothing -> nothing {
  let src_dir = ($dist | path join "src")
  let plugins_dest = ($src_dir | path join "plugins")
  let ui_dest = ($src_dir | path join "ui")

  # Create parent directories
  mkdir $plugins_dest
  mkdir $ui_dest

  # 1. Move core
  let core_src = ($dist | path join "core")
  if ($core_src | path exists) {
    mv $core_src ($src_dir | path join "core")
  }

  # 2. Move plugins
  let plugins_src = ($dist | path join "plugins")
  if ($plugins_src | path exists) {
    let layout_src = ($plugins_src | path join "layout")
    if ($layout_src | path exists) {
      mv $layout_src ($plugins_dest | path join "layout")
    }

    let palettes_src = ($plugins_src | path join "palettes")
    if ($palettes_src | path exists) {
      mv $palettes_src ($plugins_dest | path join "palettes")
    }

    let observer_src = ($plugins_src | path join "observer")
    if ($observer_src | path exists) {
      mv $observer_src ($plugins_dest | path join "observer")
    }

    let i18n_src = ($plugins_src | path join "i18n")
    if ($i18n_src | path exists) {
      mv $i18n_src ($plugins_dest | path join "i18n")
    }

    rm -rf $plugins_src
  }

  # 3. Move flat UI files to src/ui
  ls $dist | each {|item|
    let name = ($item.name | path basename)
    if $name != "mod.js" and $name != "mod.d.ts" and $name != "src" and $name != "core" and $name != "plugins" {
      mv $item.name $ui_dest
    }
  } | ignore
}

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
def patch-file [file: path, dist: path, version: string]: nothing -> record {
  let ts_import_re = "(from\\s+[\"'])([^\"']*?)\\.ts([\"'])"
  # Dev-time manifest import: `import pkgConfig from "../../deno.json" with { type: "json" };`
  # (matches the old package.json form too, with or without the inline attribute)
  let manifest_import_re = "import\\s+pkgConfig\\s+from\\s+[\"'][^\"']*(?:deno|package)\\.json[\"']\\s*(?:with\\s*\\{[^}]*\\})?\\s*;?\\s*\\n?"
  let with_type_re = "(?m)^\\s*with\\s*\\{\\s*type:\\s*[\"']json[\"']\\s*\\}\\s*;?\\s*\\n?"
  let version_call_re = "pkgConfig\\.version"

  let original = (open --raw $file)
  let rewritten = ($original
    | str replace --all --regex $ts_import_re '$1$2.js$3'
    | str replace --all --regex "@rune-lab/core(\\b|/|$)" 'rune-lab/core$1'
    | str replace --all --regex "@rune-lab/layout(\\b|/|$)" 'rune-lab/layout$1'
    | str replace --all --regex "@rune-lab/palettes(\\b|/|$)" 'rune-lab/palettes$1'
    | str replace --all --regex "@rune-lab/observer(\\b|/|$)" 'rune-lab/observer$1'
    | str replace --all --regex "@rune-lab/i18n(\\b|/|$)" 'rune-lab/i18n$1'
    | str replace --all --regex "@rune-lab/svelte(\\b|/|$)" 'rune-lab$1'
    | str replace --all "@rune-lab" "rune-lab"
  )

  # If it is mod.js or mod.d.ts at the root of dist, rewrite relative imports to go into ./src/ui/
  let file_name = ($file | path basename)
  let file_dir = ($file | path dirname)
  let rewritten = (if (($file_name == "mod.js" or $file_name == "mod.d.ts") and ($file_dir == $dist)) {
    $rewritten
      | str replace --all --regex "(\\bfrom\\s+[\"'])\\./" '$1./src/ui/'
      | str replace --all --regex "(\\bimport\\s+[\"'])\\./" '$1./src/ui/'
  } else {
    $rewritten
  })

  # If it is inside src/ui/, rewrite imports of ./mod.js or ./mod.d.ts to ../../mod.js
  let rewritten = (if ($file_dir | path basename) == "ui" {
    $rewritten
      | str replace --all --regex "(\\bfrom\\s+[\"'])\\./mod\\.js([\"'])" '$1../../mod.js$2'
      | str replace --all --regex "(\\bfrom\\s+[\"'])\\./mod\\.d\\.ts([\"'])" '$1../../mod.d.ts$2'
  } else {
    $rewritten
  })

  let rewritten = ($rewritten
    | str replace --all --regex "type\\s+([A-Za-z0-9_]+)Props_\\s*=\\s*typeof\\s+__propDef\\.props\\s*;" 'type ${1}Props_ = ${1}Props;'
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

  print $"Reshuffling build/dist at: ($root)"
  reshuffle $dist

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
    | each {|p| patch-file $p $dist $version }
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
    let default_path = (if ($paths | describe) =~ "record" {
      $paths | get default? | default ($paths | get svelte?) | default ($paths | get types?)
    } else {
      $paths
    })
    
    if $default_path != null {
      let full_path = ($root | path join "build" ($default_path | str replace "./" ""))
      if not ($full_path | path exists) {
        error make {msg: $"Export gate failed: export '($entry)' target file '($full_path)' does not exist!"}
      }
      print $"  verified export '($entry)' -> ($default_path)"
    }
  }

  print "✓ build.nu done"
}
