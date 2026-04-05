<script lang="ts">
    import ShowcaseCard from "../ShowcaseCard.svelte";
    import { COLORS, SIZES } from "../shared";
    import { Icon } from "rune-lab";
</script>

<div class="space-y-6">
    <!-- Buttons -->
    <ShowcaseCard title="Buttons" icon="🔘">
        <div class="flex flex-wrap gap-2 mb-4">
            <button class="btn">Default</button>
            {#each COLORS as color}
                <button class="btn btn-{color} capitalize">{color}</button>
            {/each}
        </div>
        
        <h4 class="text-xs font-bold opacity-50 mb-2">Sizes</h4>
        <div class="flex flex-wrap items-center gap-2 mb-4">
            {#each SIZES as size}
                <button class="btn btn-{size} capitalize">Size {size}</button>
            {/each}
        </div>

        <h4 class="text-xs font-bold opacity-50 mb-2">Styles</h4>
        <div class="flex flex-wrap gap-2 mb-4">
            <button class="btn btn-primary btn-outline">Outline</button>
            <button class="btn btn-secondary btn-ghost">Ghost</button>
            <button class="btn btn-accent btn-link">Link</button>
            <button class="btn btn-active">Active</button>
            <button class="btn btn-disabled" disabled>Disabled</button>
        </div>

        <h4 class="text-xs font-bold opacity-50 mb-2">Shapes</h4>
        <div class="flex gap-2">
            <button class="btn btn-square">
                <Icon name={"close" as never} class="w-4 h-4" />
            </button>
            <button class="btn btn-circle btn-primary">
                <Icon name={"plus" as never} class="w-4 h-4" />
            </button>
            <button class="btn btn-wide">Wide</button>
        </div>
    </ShowcaseCard>

    <!-- Badges -->
    <ShowcaseCard title="Badges" icon="🏷️">
        <div class="flex flex-wrap gap-2 mb-4">
            <div class="badge">Default</div>
            {#each COLORS as color}
                <div class="badge badge-{color} capitalize">{color}</div>
            {/each}
        </div>

        <h4 class="text-xs font-bold opacity-50 mb-2">Sizes</h4>
        <div class="flex flex-wrap items-center gap-2 mb-4">
            {#each SIZES as size}
                <div class="badge badge-primary badge-{size} capitalize">Size {size}</div>
            {/each}
        </div>

        <h4 class="text-xs font-bold opacity-50 mb-2">Styles</h4>
        <div class="flex flex-wrap gap-2">
            <div class="badge badge-primary badge-outline">Outline</div>
            <div class="badge badge-secondary badge-ghost">Ghost</div>
        </div>
    </ShowcaseCard>

    <!-- Avatars -->
    <ShowcaseCard title="Avatars" icon="👤">
        <div class="flex flex-wrap items-end gap-4 mb-4">
            {#each [1, 2, 3, 4] as i}
                <div class="avatar">
                    <div class="w-{i * 4 + 4} rounded-full">
                        <img src="https://picsum.photos/200?random={i}" alt="Avatar {i}" />
                    </div>
                </div>
            {/each}
            
            <div class="avatar online">
                <div class="w-16 rounded-full">
                    <img src="https://picsum.photos/200?random=5" alt="Online" />
                </div>
            </div>
            
            <div class="avatar offline">
                <div class="w-16 rounded-full">
                    <img src="https://picsum.photos/200?random=6" alt="Offline" />
                </div>
            </div>

            <div class="avatar placeholder">
                <div class="w-16 rounded-full bg-neutral text-neutral-content">
                    <span>SY</span>
                </div>
            </div>
        </div>
        
        <h4 class="text-xs font-bold opacity-50 mb-2">Avatar Group</h4>
        <div class="avatar-group -space-x-6 rtl:space-x-reverse">
            {#each [7, 8, 9] as i}
                <div class="avatar">
                    <div class="w-12">
                        <img src="https://picsum.photos/200?random={i}" alt="Group {i}" />
                    </div>
                </div>
            {/each}
            <div class="avatar placeholder">
                <div class="w-12 bg-neutral text-neutral-content">
                    <span>+99</span>
                </div>
            </div>
        </div>
    </ShowcaseCard>

    <!-- Indicators -->
    <ShowcaseCard title="Indicators & FABs" icon="🔴">
        <div class="flex gap-8 mt-4 mb-4">
            <div class="indicator">
                <span class="indicator-item badge badge-secondary">99+</span> 
                <button class="btn">Inbox</button>
            </div>
            
            <div class="indicator">
                <span class="indicator-item badge badge-primary">new</span> 
                <div class="grid w-24 h-24 bg-base-300 place-items-center rounded-box">content</div>
            </div>
            
            <div class="indicator">
                <span class="indicator-item indicator-bottom indicator-center badge badge-primary">uploading</span> 
                <div class="grid w-24 h-24 bg-base-300 place-items-center rounded-box">File</div>
            </div>
        </div>
    </ShowcaseCard>
</div>
