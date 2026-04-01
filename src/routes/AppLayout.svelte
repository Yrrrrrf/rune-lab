<script lang="ts">
    import {
        WorkspaceLayout,
        ConnectedNavigationPanel,
        DetailPanel,
        getCommandStore,
        getShortcutStore,
        getToastStore,
        getLayoutStore,
    } from "rune-lab";
    import { untrack, type Snippet } from "svelte";
    // import { page } from "$app/state";
    // import { locales, localizeHref } from "$lib/paraglide/runtime";

    let { children, sections } = $props<{
        children: Snippet;
        sections: any[];
    }>();

    const commands = getCommandStore();
    const shortcuts = getShortcutStore();
    const toasts = getToastStore();
    const layout = getLayoutStore();

    $effect(() => {
        untrack(() => {
            // Default Layout Commands
            commands.register({
                id: "view.toggleNav",
                label: "Toggle Navigation Panel",
                category: "View",
                action: () => layout.toggleNav(),
            });
            commands.register({
                id: "view.toggleDetail",
                label: "Toggle Detail Panel",
                category: "View",
                action: () => layout.toggleDetail(),
            });

            // Register Power-User Commands and Shortcuts
            commands.register({
                id: "inventory.create",
                label: "Create New Product",
                category: "Inventory",
                action: () => toasts.info("Navigating to product creation..."),
            });

            commands.register({
                id: "orders.pending",
                label: "Jump to Pending Orders",
                category: "Sales",
                action: () => toasts.info("Fetching pending orders..."),
            });

            commands.register({
                id: "inventory.export",
                label: "Export Inventory",
                category: "System",
                action: () =>
                    toasts.success("Inventory exported successfully!"),
            });
        });

        return () => {
            commands.unregister("inventory.create");
            commands.unregister("orders.pending");
            commands.unregister("inventory.export");
            shortcuts.unregister("shortcut.new");
        };
    });
</script>

<WorkspaceLayout>
    {#snippet navigationPanel()}
        <ConnectedNavigationPanel {sections} />
    {/snippet}

    {#snippet content()}
        <div style="display:none">
            {#each locales as locale}
                <a href={localizeHref(page.url.pathname, { locale })}
                    >{locale}</a
                >
            {/each}
        </div>
        <div class="h-full w-full overflow-y-auto bg-base-100 p-8">
            {@render children()}
        </div>
    {/snippet}

    {#snippet detailPanel()}
        <DetailPanel>
            <div
                class="flex flex-col items-center justify-center p-8 text-center text-base-content/50 h-[80vh]"
            >
                <p>Select an item to view details</p>
            </div>
        </DetailPanel>
    {/snippet}
</WorkspaceLayout>
