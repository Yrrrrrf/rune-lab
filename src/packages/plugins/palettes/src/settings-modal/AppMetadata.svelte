<script lang="ts">
import { getAppStore } from "rune-lab";

const appStore = getAppStore();
</script>

<div class="p-4 flex items-center gap-4 bg-base-200 rounded-box">
  <div
    class="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-box text-2xl shrink-0">
    🧪
  </div>
  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2">
      <span class="font-medium text-sm">{appStore.name}</span>
      <span class="badge badge-primary badge-sm">v{appStore.version}</span>
    </div>
    <p
      class="text-base-content/60 text-xs truncate mt-0.5">{appStore.description}</p>
  </div>
  <div class="text-right shrink-0">
    <span class="text-base-content/50 text-xs">{appStore.author}</span>
  </div>
</div>
