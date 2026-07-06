[doc('Run the lab')]
[group('Dev')]
run: inject
    cd src/lab; deno run -A npm:vite dev --host

[doc('Clean build/cache artifacts')]
[group('Dev')]
clean:
    rm -rf src/package/dist
    rm -rf src/lab/.svelte-kit
    rm -rf src/lab/.vite
    @echo "✓ cleaned build and cache artifacts"
