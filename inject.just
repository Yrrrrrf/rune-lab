# inject.just — surgical local rune-lab injection
#
# ⚠  IMPORTANT: `just -f` changes cwd to the justfile's directory.
#    Never pass `.` as dest — pass $PWD or an absolute path instead.
#
# Usage:
#   just -f ~/rune-lab/inject.just inject $PWD
#   just -f ~/rune-lab/inject.just inject /absolute/path/to/project
#   just -f ~/rune-lab/inject.just inject-clean $PWD
#
# Recipes:
#   inject        — build rune-lab, then hot-swap node_modules/rune-lab
#   inject-clean  — full dep reset (yog reborn --deep), then inject
# ─────────────────────────────────────────────────────────────────────────────

# Hot-swap: rebuild rune-lab and inject into <dest>/node_modules/rune-lab
inject dest: _build-for-inject
    #!/usr/bin/env bash
    set -euo pipefail

    dest_abs="{{ dest }}"

    # Reject relative paths — they resolve to rune-lab's own dir, not the caller's
    if [[ "$dest_abs" != /* ]]; then
        echo "❌  dest must be an absolute path."
        echo "    Call with:  just -f ... inject \$PWD"
        echo "    Got:        $dest_abs"
        exit 1
    fi

    if [ ! -d "$dest_abs/node_modules" ]; then
        echo "❌  No node_modules/ found in $dest_abs"
        echo "    Run your package manager's install first, then retry."
        exit 1
    fi

    echo "🗑  Removing stale $dest_abs/node_modules/rune-lab..."
    rm -rf "$dest_abs/node_modules/rune-lab"

    echo "📦 Copying local dist into $dest_abs/node_modules/rune-lab..."
    mkdir -p "$dest_abs/node_modules/rune-lab"
    cp -r "{{ justfile_directory() }}/dist"         "$dest_abs/node_modules/rune-lab/dist"
    cp    "{{ justfile_directory() }}/package.json" "$dest_abs/node_modules/rune-lab/package.json"

    echo "✅  Done! node_modules/rune-lab → $(du -sh $dest_abs/node_modules/rune-lab | cut -f1)"
    echo "    Source:  {{ justfile_directory() }}/dist"
    echo "    Target:  $dest_abs/node_modules/rune-lab"

# Full reset: nuke deps in <dest>, reinstall, then hot-swap rune-lab
inject-clean dest: _build-for-inject
    #!/usr/bin/env bash
    set -euo pipefail

    dest_abs="{{ dest }}"

    if [[ "$dest_abs" != /* ]]; then
        echo "❌  dest must be an absolute path. Call with: just -f ... inject-clean \$PWD"
        exit 1
    fi

    echo "💀 Running yog reborn --deep in $dest_abs..."
    (cd "$dest_abs" && yog reborn --deep)

    just -f "{{ justfile_directory() }}/inject.just" inject "$dest_abs"

# ── Internal ──────────────────────────────────────────────────────────────────

[private]
_build-for-inject:
    @echo "🔨 Building rune-lab from {{ justfile_directory() }}..."
    just --justfile "{{ justfile_directory() }}/justfile" --working-directory "{{ justfile_directory() }}" build
    @echo "✅  rune-lab built."
