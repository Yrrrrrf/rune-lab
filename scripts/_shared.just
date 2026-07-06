PROJECT := "rune-lab"
VERSION := `git describe --tags --always`

[default]
[group('meta')]
[doc('List all available recipes')]
list:
    @just --list --unsorted

[private]
_clean-tree:
    if (git status --porcelain | is-not-empty) { error make {msg: "working tree dirty"} }
