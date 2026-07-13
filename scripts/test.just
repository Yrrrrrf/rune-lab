[doc('Run the test suite')]
[group('test')]
[positional-arguments]
test *args:
    #!/usr/bin/env nu
    def --wrapped main [...raw_args: string] {
      let targets = $raw_args | where { not ($in | str starts-with "-") }
      let flags = $raw_args | where { $in | str starts-with "-" }
      let run_all = ($targets | is-empty)

      if ($run_all or ($targets | any { $in in ["core" "src/packages/core"] })) {
        print "Running core tests..."
        deno test --allow-all src/packages/core/src/
      }

      cp "{{ PKG_SHIM }}" "package.json"
      try {
        print "Running workspace tests..."
        deno run -A npm:vite-plus/vp test ...$flags
      } finally {
        rm -f package.json
      }
    }
