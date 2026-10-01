<script lang="ts">
  import { onMount } from "svelte";
  import { getApiStore } from "../context.ts";
  const api = getApiStore();
  onMount(() => {
    let mounted = true;
    void api.ready.then(() => {
      if (mounted) void api.start();
    });
    return () => {
      mounted = false;
      api.stop();
    };
  });
</script>
