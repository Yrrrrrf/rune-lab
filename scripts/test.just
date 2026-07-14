[doc('Run the test suite')]
[group('test')]
[positional-arguments]
test *args:
    #!/usr/bin/env nu
    def --wrapped main [...raw_args: string] {
      let is_core = ($raw_args | any { $in in ["core" "src/packages/core"] })
      let has_other = ($raw_args | any { $in not-in ["core" "src/packages/core"] })
      let run_all = ($raw_args | is-empty)

      if ($run_all or $is_core) {
        print "Running core tests..."
        deno test --allow-all src/packages/core/src/
        if $env.LAST_EXIT_CODE != 0 {
          error make {msg: "Deno core tests failed"}
        }
      }

      if ($run_all or $has_other) {
        let vp_args = ($raw_args | where { $in not-in ["core" "src/packages/core"] })
        cp "{{ PKG_SHIM }}" "package.json"
        try {
          print "Running workspace tests..."
          deno run -A npm:vite-plus/vp test ...$vp_args
          let code = $env.LAST_EXIT_CODE
          if $code != 0 {
            error make {msg: $"Workspace tests failed with exit code ($code)"}
          }
        } catch {
          rm -f package.json
          error make {msg: "Workspace tests failed"}
        }
        rm -f package.json
      }
    }
