[private]
test-workspace *args:
    #!/usr/bin/env nu
    let raw_args = [{{ args }}]
    let targets = ($raw_args | where { |a| not ($a | str starts-with "-") })
    let flags = ($raw_args | where { |a| $a | str starts-with "-" })

    let all_vp = [
      "src/packages/ui"
      "src/packages/plugins/palettes"
      "src/packages/plugins/layout"
    ]

    let run_all = ($targets | is-empty)
    let vp_targets = if $run_all {
      $all_vp
    } else {
      $all_vp | where { |pkg|
        $targets | any { |t| $pkg == $t or ($pkg | str ends-with $t) }
      }
    }

    if ($vp_targets | is-not-empty) {
      let root = ($env.PWD | path expand)
      let pkg_json = ($root | path join "src" "package.json")

      # Write the temporary package.json
      {
        name: "@rune-lab/vp-workspace",
        private: true,
        version: "0.0.0",
        workspaces: ["packages/*", "packages/plugins/*"],
      } | to json | save -f $pkg_json

      try {
        for pkg in $vp_targets {
          print $"Running vp test in ($pkg)..."
          cd ($root | path join $pkg)
          deno run -A npm:vite-plus/vp test ...$flags
          cd $root
        }
      } finally {
        rm -f $pkg_json
      }
    }

[doc('Run the test suite')]
[group('test')]
test *args:
    #!/usr/bin/env nu
    let raw_args = [{{ args }}]
    let targets = ($raw_args | where { |a| not ($a | str starts-with "-") })

    let run_all = ($targets | is-empty)
    let run_core = ($run_all or ($targets | any { |t| $t == "core" or $t == "src/packages/core" }))

    if $run_core {
      print "Running core tests..."
      deno test --allow-all src/packages/core/src/
    }

    # Pass the arguments along to test-workspace
    just test-workspace {{ args }}

