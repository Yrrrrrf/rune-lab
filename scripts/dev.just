[doc('Run the lab')]
[group('Dev')]
run: inject
    cd src/lab; deno run -A npm:vite dev --host
