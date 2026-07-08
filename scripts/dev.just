[doc('Run the lab')]
[group('Dev')]
run: inject
    cd apps/lab; deno run -A npm:vite dev --host

[doc('Run the client in development mode')]
[group('Dev')]
[working-directory('apps/')]
preview app=`ls apps/`:
    @echo "{{ app }}"

# todo: Add this pipeline to the main preview recipe! :D
# rm -rf {{ app }}/build
# todo: Add a way to run all apps at once
# todo: Somehow orchestrate the apps to run in parallel
# # bun run --cwd apps/{{ app }} vite dev --host
# # * Clean the build directory
# # * Build & Preview the app
# cd {{ app }}; deno run -A npm: vite build
# cd {{ app }}; deno run -A npm: vite preview
