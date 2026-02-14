<script lang="ts">
    import { Book, Copy, CircleCheckBig, RefreshCw } from "lucide-svelte";
    import { apiStore } from "./api.svelte";
    import { toastStore } from "./toast.svelte";

    let copied = $state(false);
    let isVisible = $state(true);

    function copyToClipboard() {
        navigator.clipboard.writeText(apiStore.URL);
        copied = true;
        toastStore.success("API URL copied to clipboard!");
        setTimeout(() => (copied = false), 2000);
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter" || event.key === " ") {
            copyToClipboard();
        }
    }

    const containerClass = $derived(`
        fixed bottom-4 left-4 z-50 
        flex items-center space-x-2 
        transition-all duration-300 transform
        ${isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}
    `);
</script>

<div class={containerClass}>
    <div
        class="flex items-center space-x-2 backdrop-blur-sm bg-base-300/80 rounded-xl p-1 shadow-lg border border-base-content/10"
    >
        <!-- API Status Indicator -->
        {#if apiStore.IS_CONNECTED}
            <div class="tooltip tooltip-right" data-tip="Connected">
                <div
                    aria-label="success"
                    class="status status-success status-md"
                ></div>
            </div>
        {:else if apiStore.IS_LOADING}
            <div class="tooltip tooltip-right" data-tip="Connecting...">
                <div class="inline-grid *:[grid-area:1/1]">
                    <div class="status status-warning animate-ping"></div>
                    <div class="status status-warning"></div>
                </div>
            </div>
        {:else}
            <div class="tooltip tooltip-right" data-tip="Disconnected">
                <div class="status status-error animate-bounce"></div>
            </div>
        {/if}

        <!-- API Docs / Reload -->
        {#if apiStore.connectionState === "connected"}
            <button
                class="btn btn-circle btn-xs btn-primary"
                onclick={() => window.open(`${apiStore.URL}/docs`, "_blank")}
                aria-label="Go to API Documentation"
            >
                <Book size={14} />
            </button>
        {:else}
            <button
                class="btn btn-circle btn-xs btn-error"
                onclick={() => apiStore.reconnect()}
                aria-label="Reconnect to API"
                disabled={apiStore.connectionState === "connecting"}
            >
                <RefreshCw
                    size={14}
                    class={apiStore.connectionState === "connecting"
                        ? "animate-spin"
                        : ""}
                />
            </button>
        {/if}

        <button
            class="group flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-base-200 transition-colors duration-200"
            onclick={copyToClipboard}
            onkeydown={handleKeyDown}
            aria-label="Copy API URL"
        >
            <span class="text-xs font-mono"
                >{apiStore.URL.replace(
                    /^https?:\/\//,
                    "",
                )}/{apiStore.VERSION}</span
            >
            {#if copied}
                <CircleCheckBig size={14} class="text-success" />
            {:else}
                <Copy
                    size={14}
                    class="opacity-50 group-hover:opacity-100 transition-all duration-200"
                />
            {/if}
        </button>
    </div>
</div>
