<!-- src/lib/components/api/OpButton.svelte -->
<script lang="ts">
    import type { APIOperation } from '$lib/components/dt/types.js';

    let { op, onClick } = $props<{
        op: APIOperation;
        onClick: () => void;
    }>();
</script>

<button
    class="px-4 py-2 text-white rounded-md {op.color}"
    onclick={onClick}
>
    <div class="flex items-center gap-2">
        {op}
    </div>
</button>
