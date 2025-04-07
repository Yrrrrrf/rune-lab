<script lang="ts">
import { Book, Copy, CheckCircle, RefreshCw } from "lucide-svelte";
import { apiStore, ConnectionState } from "./../stores/api.svelte.js";

let copied = $state(false);
let isVisible = $state(true);

function copyToClipboard() {
	navigator.clipboard.writeText(apiStore.URL);
	copied = true;
	setTimeout(() => copied = false, 2000);
}

function handleKeyDown(event: KeyboardEvent) {
	if (event.key === 'Enter' || event.key === ' ') {
		copyToClipboard();
	}
}

const containerClass = $derived(`
	fixed bottom-4 left-4 z-50 
	flex items-center space-x-2 
	transition-all duration-300 transform
	${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}
`);
</script>

<div class={containerClass}>
	<div class="flex items-center space-x-2 backdrop-blur-sm bg-base-300/80 rounded-xl p-1 shadow-lg">
		<!-- API Status Indicator with new DaisyUI 5 status component -->
		{#if apiStore.IS_CONNECTED}
			<!-- Success status when connected -->
			<div class="tooltip tooltip-right" data-tip="Connected">
				<div aria-label="success" class="status status-success status-md"></div>
			</div>
		{:else if apiStore.IS_LOADING}
			<!-- Ping animation with warning color when connecting -->
			<div class="tooltip tooltip-right" data-tip="Connecting...">
				<div class="inline-grid *:[grid-area:1/1]">
					<div class="status status-warning animate-ping"></div>
					<div class="status status-warning"></div>
				</div>
			</div>
		{:else}
			<!-- Bounce animation with error when disconnected -->
			<div class="tooltip tooltip-right" data-tip="Disconnected">
				<div class="status status-error animate-bounce"></div>
			</div>
		{/if}

		<!-- API Docs Button when connected, Reload Button when disconnected -->
		{#if apiStore.connectionState === ConnectionState.CONNECTED}
			<button
				class="btn btn-circle btn-xs btn-primary"
				onclick={() => window.open(`${apiStore.URL}/docs`, '_blank')}
				aria-label="Go to API Documentation"
			>
				<Book size={14} />
			</button>
		{:else}
			<button
				class="btn btn-circle btn-xs btn-error"
				onclick={() => apiStore.reconnect()}
				aria-label="Reconnect to API"
				disabled={apiStore.connectionState === ConnectionState.CONNECTING}
			>
				<RefreshCw size={14} class={apiStore.connectionState === ConnectionState.CONNECTING ? "animate-spin" : ""} />
			</button>
		{/if}

		<button
			class="group flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-base-200 transition-colors duration-200"
			onclick={copyToClipboard}
			onkeydown={handleKeyDown}
			aria-label="Copy API URL"
		>
			<span class="text-xs font-mono">{apiStore.URL}/{apiStore.VERSION}</span>
			{#if copied}
				<CheckCircle size={14} class="text-success" />
			{:else}
				<Copy size={14} class="opacity-50 group-hover:opacity-100 transition-all duration-200" />
			{/if}
		</button>
	</div>
</div>
