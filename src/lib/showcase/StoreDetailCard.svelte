<script lang="ts">
    import * as m from "$lib/paraglide/messages.js";

    interface StoreValue {
        key: string;
        value: string | number;
        labelKey?: keyof typeof m;
    }

    interface StoreDetail {
        label: string;
        labelKey?: keyof typeof m;
        icon: string;
        color: string;
        values: StoreValue[];
    }

    let { store } = $props<{ store: StoreDetail }>();

    function getLabel(item: { label?: string; labelKey?: keyof typeof m }) {
        if (item.labelKey && typeof m[item.labelKey] === "function") {
            return (m[item.labelKey] as any)();
        }
        return item.label;
    }

    function getKeyLabel(item: StoreValue) {
        if (item.labelKey && typeof m[item.labelKey] === "function") {
            return (m[item.labelKey] as any)();
        }
        return item.key;
    }
</script>

<div
    class="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-300"
>
    <div class="card-body p-6">
        <div class="flex items-center gap-3 mb-4">
            <div
                class="w-10 h-10 rounded-xl bg-{store.color}/10 flex items-center justify-center text-xl"
            >
                {store.icon}
            </div>
            <h3
                class="card-title text-sm uppercase tracking-widest opacity-60 font-black"
            >
                {getLabel(store)}
            </h3>
        </div>

        <div class="space-y-4">
            {#each store.values as item}
                <div class="flex flex-col gap-1">
                    <span
                        class="text-[10px] font-bold uppercase opacity-40 tracking-wider"
                        >{getKeyLabel(item)}</span
                    >
                    <div
                        class="bg-base-200/50 px-3 py-2 rounded-lg font-mono text-sm border border-base-content/5 truncate"
                    >
                        {item.value}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
<!-- 
<style>
    @import "daisyui/components/card.css";
</style> -->
