<script lang="ts">
import type { Kernel, PluginDescriptor } from "rune-lab/core";
import { untrack } from "svelte";
import type { ObserverState } from "./stores/state.svelte.ts";

let { observer }: { observer: ObserverState } = $props();

type ConnectionStatus = "loading" | "connected" | "loaded-opaque" | "refused";

// Seeded from the current targetUrl once, then independently editable — the
// address bar shouldn't snap back mid-typing if targetUrl changes elsewhere.
// handleGo() is the only writer back to observer.targetUrl.
let draft = $state(untrack(() => observer.targetUrl));
let status = $state<ConnectionStatus>("loading");
let snapshot = $state<{ plugins: PluginDescriptor[]; storeCount: number } | null>(
	null,
);
let lastUpdatedAt = $state<number | null>(null);

let iframeEl: HTMLIFrameElement | undefined = $state();
let refusalTimer: ReturnType<typeof setTimeout> | undefined;
let probeTimer: ReturnType<typeof setTimeout> | undefined;
let pollInterval: ReturnType<typeof setInterval> | undefined;

// The iframe's `load` event fires once its HTML/resources are fetched, but a
// same-origin Rune Lab page still needs to boot its own Svelte runtime and
// mount <RuneProvider> before window.__rune_kernel__ exists — observed ~500-
// 800ms in practice. A single check right at `onload` would misreport a
// connectable page as "opaque", so this retries with a grace period first.
const CONNECTION_PROBE_ATTEMPTS = 10;
const CONNECTION_PROBE_INTERVAL_MS = 250;

function clearTimers() {
	if (refusalTimer) clearTimeout(refusalTimer);
	if (probeTimer) clearTimeout(probeTimer);
	if (pollInterval) clearInterval(pollInterval);
	refusalTimer = undefined;
	probeTimer = undefined;
	pollInterval = undefined;
}

function readKernelHandle(): Kernel | undefined {
	try {
		return (
			iframeEl?.contentWindow as
				| (Window & { __rune_kernel__?: Kernel })
				| undefined
		)?.__rune_kernel__;
	} catch {
		// Cross-origin access throws SecurityError — treat as opaque, not refused.
		return undefined;
	}
}

function pollSnapshot() {
	const kernel = readKernelHandle();
	if (!kernel) return;
	snapshot = {
		plugins: kernel.listPlugins(),
		storeCount: kernel.stores.size,
	};
	lastUpdatedAt = Date.now();
}

function probeConnection(attempt = 0) {
	const kernel = readKernelHandle();
	if (kernel) {
		status = "connected";
		pollSnapshot();
		pollInterval = setInterval(pollSnapshot, 2000);
		return;
	}
	if (attempt >= CONNECTION_PROBE_ATTEMPTS) {
		status = "loaded-opaque";
		return;
	}
	probeTimer = setTimeout(
		() => probeConnection(attempt + 1),
		CONNECTION_PROBE_INTERVAL_MS,
	);
}

function handleLoad() {
	if (refusalTimer) clearTimeout(refusalTimer);
	refusalTimer = undefined;
	probeConnection();
}

function handleGo() {
	observer.targetUrl = draft;
}

// Tracks observer.targetUrl for both the initial mount and later navigations
// — the iframe's `src` binding below reacts to the same value, so this
// effect only needs to (re)arm the refusal timeout and reset stale panel
// data.
$effect(() => {
	void observer.targetUrl;
	clearTimers();
	snapshot = null;
	lastUpdatedAt = null;
	status = "loading";
	refusalTimer = setTimeout(() => {
		if (status === "loading") status = "refused";
	}, 3000);
	return () => clearTimers();
});
</script>

<div class="h-full w-full flex flex-col bg-base-100">
  <div class="flex items-center gap-2 p-2 border-b border-base-200 shrink-0">
    <span
      class="badge badge-sm shrink-0 {status === 'connected' ? 'badge-success' : status === 'refused' ? 'badge-error' : status === 'loaded-opaque' ? 'badge-warning' : 'badge-ghost'}"
    >
      {status === "connected"
        ? "connected"
        : status === "refused"
        ? "refused"
        : status === "loaded-opaque"
        ? "opaque"
        : "loading…"}
    </span>
    <input
      type="text"
      class="input input-sm flex-1 font-mono"
      bind:value={draft}
      onkeydown={(e) => e.key === "Enter" && handleGo()}
    />
    <button class="btn btn-sm btn-primary" onclick={handleGo}>Go</button>
  </div>

  {#if status === "connected" && snapshot}
    <div class="px-3 py-1.5 text-[10px] font-mono opacity-60 border-b border-base-200 shrink-0">
      live snapshot · {snapshot.plugins.length} plugins · {snapshot.storeCount} stores
      {#if lastUpdatedAt}
        · as of {Math.max(0, Math.round((Date.now() - lastUpdatedAt) / 1000))}s ago
      {/if}
    </div>
  {:else if status === "refused"}
    <div class="flex-1 flex items-center justify-center text-center p-8">
      <p class="text-sm opacity-70 max-w-sm">
        This page refused to be embedded (X-Frame-Options / frame-ancestors).
        Open it in a new tab instead.
      </p>
    </div>
  {/if}

  <div class="flex-1 overflow-hidden {status === 'refused' ? 'hidden' : ''}">
    <iframe
      bind:this={iframeEl}
      src={observer.targetUrl}
      title="Observer content"
      class="w-full h-full border-0"
      onload={handleLoad}
    ></iframe>
  </div>
</div>
