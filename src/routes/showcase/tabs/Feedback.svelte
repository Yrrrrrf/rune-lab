<script lang="ts">
    import ShowcaseCard from "../ShowcaseCard.svelte";
    import { getToastStore } from "rune-lab";

    const toastStore = getToastStore();

    function fireToast(type: "info" | "success" | "warning" | "error") {
        toastStore.send(`Svelte 5 Context Toast (${type})`, type, 3000);
    }
</script>

<div class="space-y-6">
    <!-- Toasts -->
    <ShowcaseCard title="Toasts & Feedback" icon="🍞">
        <div class="flex flex-wrap gap-2 mb-2">
            <button class="btn btn-info btn-sm" onclick={() => fireToast("info")}>Info Toast</button>
            <button class="btn btn-success btn-sm" onclick={() => fireToast("success")}>Success Toast</button>
            <button class="btn btn-warning btn-sm" onclick={() => fireToast("warning")}>Warning Toast</button>
            <button class="btn btn-error btn-sm" onclick={() => fireToast("error")}>Error Toast</button>
        </div>
        <p class="text-xs opacity-50">Fires directly to the layout `ToastRegion` via lib context store.</p>
    </ShowcaseCard>

    <!-- Modals -->
    <ShowcaseCard title="Modals" icon="🪟">
        <div class="flex gap-2">
            <!-- Normal dialog -->
            <button class="btn btn-primary" onclick={() => (document.getElementById('my_modal_1') as HTMLDialogElement).showModal()}>open modal</button>
            <dialog id="my_modal_1" class="modal">
                <div class="modal-box">
                    <h3 class="text-lg font-bold">Hello!</h3>
                    <p class="py-4">Press ESC key or click the button below to close</p>
                    <div class="modal-action">
                    <form method="dialog">
                        <button class="btn">Close</button>
                    </form>
                    </div>
                </div>
            </dialog>

            <!-- Dialog with backdrop click close -->
            <button class="btn" onclick={() => (document.getElementById('my_modal_2') as HTMLDialogElement).showModal()}>open modal (backdrop)</button>
            <dialog id="my_modal_2" class="modal">
                <div class="modal-box">
                    <h3 class="text-lg font-bold">Hello!</h3>
                    <p class="py-4">Press ESC key or click outside to close</p>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    </ShowcaseCard>

    <!-- Tooltips -->
    <ShowcaseCard title="Tooltips" icon="💬">
        <div class="flex flex-wrap gap-4 mt-4">
            <div class="tooltip tooltip-bottom" data-tip="Bottom tooltip">
                <button class="btn">Hover me (bottom)</button>
            </div>
            <div class="tooltip tooltip-top tooltip-primary" data-tip="Primary tooltip">
                <button class="btn btn-primary">Hover me (top)</button>
            </div>
            <div class="tooltip tooltip-right tooltip-secondary" data-tip="Secondary tooltip">
                <button class="btn btn-secondary">Hover me (right)</button>
            </div>
        </div>
    </ShowcaseCard>

    <!-- Skeleton -->
    <ShowcaseCard title="Skeletons" icon="🦴">
        <div class="flex flex-col gap-4 w-52">
            <div class="flex gap-4 items-center">
                <div class="skeleton w-16 h-16 rounded-full shrink-0"></div>
                <div class="flex flex-col gap-4">
                    <div class="skeleton h-4 w-20"></div>
                    <div class="skeleton h-4 w-28"></div>
                </div>
            </div>
            <div class="skeleton h-32 w-full"></div>
        </div>
    </ShowcaseCard>

    <!-- Diff & Collapse -->
    <ShowcaseCard title="Diff & Collapse" icon="🔍">
        <div class="flex flex-col gap-4">
            <div class="collapse collapse-arrow bg-base-200">
                <input type="radio" name="my-accordion-2" checked />
                <div class="collapse-title text-xl font-medium">Click to open this one and close others</div>
                <div class="collapse-content">
                    <p>hello</p>
                </div>
            </div>
            <div class="collapse collapse-arrow bg-base-200">
                <input type="radio" name="my-accordion-2" />
                <div class="collapse-title text-xl font-medium">Click to open this one and close others</div>
                <div class="collapse-content">
                    <p>hello</p>
                </div>
            </div>
            
            <div class="diff aspect-[16/9] mt-4 rounded-box">
                <div class="diff-item-1">
                    <div class="bg-primary text-primary-content grid place-content-center text-4xl font-black">
                        DAISYUI
                    </div>
                </div>
                <div class="diff-item-2">
                    <div class="bg-base-200 grid place-content-center text-4xl font-black">
                        DAISYUI
                    </div>
                </div>
                <div class="diff-resizer"></div>
            </div>
        </div>
    </ShowcaseCard>
</div>
