<script lang="ts">
let keys = $state<{ key: string; value: string | null }[]>([]);

function loadKeys() {
	if (typeof window === "undefined") return;
	const list: typeof keys = [];
	for (let i = 0; i < localStorage.length; i++) {
		const k = localStorage.key(i);
		if (k?.startsWith("rl:")) {
			list.push({ key: k, value: localStorage.getItem(k) });
		}
	}
	keys = list.sort((a, b) => a.key.localeCompare(b.key));
}

function deleteKey(key: string) {
	if (typeof window === "undefined") return;
	localStorage.removeItem(key);
	loadKeys();
}

function clearAll() {
	if (typeof window === "undefined") return;
	const toRemove: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const k = localStorage.key(i);
		if (k?.startsWith("rl:")) toRemove.push(k);
	}
	toRemove.forEach((k) => localStorage.removeItem(k));
	loadKeys();
}

loadKeys();
</script>

<div class="h-full w-full bg-accent/10 text-accent p-4 flex flex-col gap-2.5 overflow-hidden">
  <div class="flex items-center justify-between shrink-0">
    <h2 class="font-bold uppercase text-xs tracking-widest">Storage</h2>
    <div class="flex items-center gap-1.5">
      <button class="btn btn-xs btn-outline" onclick={loadKeys}>Refresh</button>
      <button class="btn btn-xs btn-error btn-outline" onclick={clearAll}>Clear</button>
    </div>
  </div>
  <p class="text-[10px] opacity-70 shrink-0">
    localStorage keys under the <code>rl:</code> namespace.
  </p>

  <div class="flex-1 overflow-y-auto rounded-lg bg-base-100/60">
    {#if keys.length === 0}
      <div class="text-center py-8 text-base-content/40 text-xs">
        No persisted keys found.
      </div>
    {:else}
      <table class="table table-xs w-full">
        <tbody class="divide-y divide-base-200">
          {#each keys as entry (entry.key)}
            <tr class="hover:bg-base-200/20 align-top">
              <td class="font-mono text-[10px] text-base-content">
                <div class="font-medium">{entry.key}</div>
                <div class="opacity-60 truncate max-w-[16rem]">{entry.value}</div>
              </td>
              <td class="text-right w-8">
                <button
                  class="btn btn-xs btn-ghost text-error"
                  onclick={() => deleteKey(entry.key)}
                >
                  ✕
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
