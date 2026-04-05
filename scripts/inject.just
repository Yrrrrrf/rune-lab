[doc('Inject built dist into lab for local testing')]
[group('Dev')]
inject:
    # * Build the package first
    just --justfile "{{ justfile_directory() }}/scripts/deploy.just" --working-directory "{{ justfile_directory() }}" build
    # * Replace lab's installed rune-lab/dist with the freshly built one
    rm -rf "{{ justfile_directory() }}/src/lab/node_modules/rune-lab/dist"
    cp -r  "{{ justfile_directory() }}/src/package/dist" "{{ justfile_directory() }}/src/lab/node_modules/rune-lab/dist"
    # * Verify the injection
    diff <(ls src/package/dist) <(ls src/lab/node_modules/rune-lab/dist)
    # If there is some output, it means the injection is not successful
    @echo "✓ injected into src/lab/node_modules/rune-lab/dist"
