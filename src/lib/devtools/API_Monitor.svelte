<script lang="ts">
    import { apiStore } from "$lib/state/api.svelte";
    import { toastStore } from "$lib/state/toast.svelte";

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
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><path
                        d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0-5H20"
                    /></svg
                >
            </button>
        {:else}
            <button
                class="btn btn-circle btn-xs btn-error"
                onclick={() => apiStore.reconnect()}
                aria-label="Reconnect to API"
                disabled={apiStore.connectionState === "connecting"}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class={apiStore.connectionState === "connecting"
                        ? "animate-spin"
                        : ""}
                    ><path
                        d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
                    /><path d="M21 3v5h-5" /><path
                        d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
                    /><path d="M3 21v-5h5" /></svg
                >
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
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-success"
                    ><circle cx="12" cy="12" r="10" /><path
                        d="m9 12 2 2 4-4"
                    /></svg
                >
            {:else}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="opacity-50 group-hover:opacity-100 transition-all duration-200"
                    ><rect
                        width="14"
                        height="14"
                        x="8"
                        y="8"
                        rx="2"
                        ry="2"
                    /><path
                        d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                    /></svg
                >
            {/if}
        </button>
    </div>
</div>
<!-- 
<style>
    @import "daisyui/components/status.css";
    @import "daisyui/components/badge.css";
    @import "daisyui/components/button.css";
</style> -->
