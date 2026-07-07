[doc('Run the lab')]
[group('Dev')]
run: inject
    cd apps/lab; deno run -A npm:vite dev --host
