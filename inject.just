# ─────────────────────────────────────────────────────────────────────────────
# Local injection — surgically replace node_modules/rune-lab in any project
#
# Usage (from any directory):
#   just -f <path-to-rune-lab>/justfile inject <dest>
#   just -f <path-to-rune-lab>/justfile inject-clean <dest>
#
# Arguments:
#   dest  — root of the consuming project (defaults to "." = current directory)
#           must contain a node_modules/ directory
#
# Examples:
#   just -f ~/rune-lab/justfile inject .
#   just -f ~/rune-lab/justfile inject ~/projects/chimera
#   just -f ~/rune-lab/justfile inject-clean .
#
# inject       → build rune-lab, then hot-swap node_modules/rune-lab
# inject-clean → full dependency reset first (yog reborn --deep), then inject
# ─────────────────────────────────────────────────────────────────────────────

# Hot-swap: rebuild rune-lab and inject into <dest>/node_modules/rune-lab
inject dest=".": _build-for-inject
    #!/usr/bin/env bash
    set -euo pipefail

    # Resolve dest to an absolute path so the script works from any cwd
    dest_abs="$(cd "{{ dest }}" && pwd)"

    if [ ! -d "$dest_abs/node_modules" ]; then
        echo "❌  No node_modules/ found in $dest_abs"
        echo "    Run your package manager's install first, then retry."
        exit 1
    fi

    echo "🗑  Removing stale $dest_abs/node_modules/rune-lab..."
    rm -rf "$dest_abs/node_modules/rune-lab"

    echo "📦 Injecting local build..."
    mkdir -p "$dest_abs/node_modules/rune-lab"
    cp -r "{{ justfile_directory() }}/dist"         "$dest_abs/node_modules/rune-lab/dist"
    cp    "{{ justfile_directory() }}/package.json" "$dest_abs/node_modules/rune-lab/package.json"

    echo "✅  node_modules/rune-lab in $dest_abs is now your local build."
    echo "    Source: {{ justfile_directory() }}"

# Full reset: nuke deps in <dest>, reinstall, then hot-swap rune-lab
inject-clean dest=".": _build-for-inject
    #!/usr/bin/env bash
    set -euo pipefail

    dest_abs="$(cd "{{ dest }}" && pwd)"

    echo "💀 Running yog reborn --deep in $dest_abs..."
    (cd "$dest_abs" && yog reborn --deep)

    just -f "{{ justfile_directory() }}/justfile" inject "$dest_abs"

# ── Internal ──────────────────────────────────────────────────────────────────

# Build rune-lab from its own root before any injection
[private]
_build-for-inject:
    @echo "🔨 Building rune-lab from {{ justfile_directory() }}..."
    just --justfile "{{ justfile_directory() }}/justfile" --working-directory "{{ justfile_directory() }}" build
    @echo "✅  rune-lab built."
