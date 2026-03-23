<script lang="ts">
    import { DEV } from "esm-env";
    import { portal } from "../actions/portal";

    /**
     * Kyntharil — Reactive Value Inspector
     * A dev-mode-only component that displays a floating panel of reactive values.
     */
    let { observe = {} } = $props<{
        observe?: Record<string, unknown>;
    }>();
</script>

{#if DEV}
    <div
        use:portal
        class="rl-kyntharil fixed bottom-4 right-4 z-[9999] max-w-sm max-h-[80vh] overflow-y-auto bg-base-300 border border-base-content/10 rounded-lg shadow-2xl p-4 font-mono text-xs select-none pointer-events-auto"
    >
        <div class="flex items-center justify-between mb-2 border-b border-base-content/10 pb-2">
            <span class="font-bold text-primary flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Kyntharil DevTools
            </span>
            <span class="opacity-50 text-[10px] uppercase tracking-wider">Reactive Observer</span>
        </div>
        
        <div class="space-y-2">
            {#each Object.entries(observe) as [label, value]}
                <div class="flex flex-col gap-0.5">
                    <span class="text-base-content/50 text-[10px]">{label}</span>
                    <pre class="bg-base-100 p-1.5 rounded overflow-x-auto text-success whitespace-pre-wrap break-all">{JSON.stringify(value, null, 2)}</pre>
                </div>
            {:else}
                <div class="text-base-content/30 italic text-center py-4">No values observed</div>
            {/each}
        </div>
    </div>
{/if}

<style>
    .rl-kyntharil::-webkit-scrollbar {
        width: 4px;
    }
    .rl-kyntharil::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 10px;
    }
</style>
