[doc('Inject built dist into lab for local testing')]
[group('Dev')]
inject root=justfile_directory():
    # * Build the package first
    just --justfile "{{ root }}/scripts/deploy.just" --working-directory "{{ root }}" build
    # * Replace lab's installed rune-lab/dist with the freshly built one
    rm -rf "{{ root }}/src/lab/node_modules/rune-lab/dist"
    cp -r  "{{ root }}/src/package/dist" "{{ root }}/src/lab/node_modules/rune-lab/dist"
    # * Verify the injection
    diff <(ls "{{ root }}/src/package/dist") <(ls "{{ root }}/src/lab/node_modules/rune-lab/dist")
    @echo "✓ injected into src/lab/node_modules/rune-lab/dist"
