<script lang="ts">
  import { untrack } from "svelte";
  import { getApiStore } from "../context.ts";
  import type { ApiClient } from "../client.ts";
  import APIMonitor from "./APIMonitor.svelte";
  let { capture }: { capture: (store: ApiClient) => void } = $props();
  const store = getApiStore();
  untrack(() => capture(store));
</script>

<APIMonitor showEnvironmentSelector showDetails />
