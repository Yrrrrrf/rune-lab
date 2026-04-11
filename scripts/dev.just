[doc('Run the lab')]
[group('Dev')]
run:
    just --justfile "{{ justfile_directory() }}/scripts/inject.just" --working-directory "{{ justfile_directory() }}" inject "{{ justfile_directory() }}"
    cd src/lab && deno run -A vite dev --host

[doc('Test the package')]
[group('Dev')]
[working-directory('src/package')]
test *args:
    bunx vp test {{ args }}
