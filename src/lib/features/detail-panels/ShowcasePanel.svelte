<script lang="ts">
    import { getLayoutStore } from "$lib/state/layout.svelte";

    const layoutStore = getLayoutStore();

    import { getToastStore } from "$lib/state/toast.svelte";

    import {
        SHOWCASE_COMPONENTS,
        SHOWCASE_SNIPPETS,
    } from "./showcase-components";

    const toastStore = getToastStore();

    const tabs = [
        "actions",
        "data-input",
        "display",
        "navigation",
        "feedback",
        "visual",
    ];

    const currentTabId = $derived(tabs[layoutStore.activeShowcaseTab]);
    const components = $derived(SHOWCASE_COMPONENTS[currentTabId] || []);
    const snippet = $derived(SHOWCASE_SNIPPETS[currentTabId] || "");

    let copied = $state(false);

    function handleCopy() {
        navigator.clipboard.writeText(snippet);
        copied = true;
        toastStore.success("Snippet copied to clipboard");
        setTimeout(() => (copied = false), 2000);
    }
</script>

<div class="space-y-8 animate-in fade-in duration-500">
    <header>
        <h3 class="text-lg font-bold capitalize">
            {currentTabId.replace("-", " ")}
        </h3>
        <p class="text-xs opacity-50">Component reference</p>
    </header>

    <!-- Section 1: Quick Nav -->
    <section class="space-y-3">
        <h4 class="text-[10px] font-black uppercase tracking-widest opacity-40">
            Quick Nav
        </h4>
        <ul class="menu menu-xs bg-base-200/50 rounded-lg p-1">
            {#each tabs as tab, i}
                <li>
                    <button
                        class:active={layoutStore.activeShowcaseTab === i}
                        onclick={() => layoutStore.setShowcaseTab(i)}
                        class="capitalize"
                    >
                        {tab.replace("-", " ")}
                    </button>
                </li>
            {/each}
        </ul>
    </section>

    <!-- Section 2: Reference Table -->
    <section class="space-y-3">
        <h4 class="text-[10px] font-black uppercase tracking-widest opacity-40">
            Primitives
        </h4>
        <div class="overflow-x-auto border border-base-content/5 rounded-lg">
            <table class="table table-xs">
                <thead>
                    <tr>
                        <th>Class</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {#each components as comp}
                        <tr>
                            <td class="font-mono text-primary"
                                >.{comp.className}</td
                            >
                            <td class="text-[10px] opacity-70"
                                >{comp.description}</td
                            >
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </section>

    <!-- Section 3: Snippet Generator -->
    <section class="space-y-3">
        <div class="flex items-center justify-between">
            <h4
                class="text-[10px] font-black uppercase tracking-widest opacity-40"
            >
                Markup
            </h4>
            <button
                onclick={handleCopy}
                class="btn btn-xs {copied ? 'btn-success' : 'btn-ghost'}"
            >
                {copied ? "Copied" : "Copy"}
            </button>
        </div>
        <textarea
            readonly
            class="textarea textarea-xs textarea-bordered w-full font-mono bg-base-300/50 h-24"
            value={snippet}
        ></textarea>
    </section>
</div>
