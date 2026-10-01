<script lang="ts">
  import { RuneProvider } from "rune-lab/ui";
  import { createInMemoryDriver } from "rune-lab/core";
  import { api } from "../plugin.ts";
  import type { ApiConfig } from "../types.ts";
  import type { ApiClient } from "../client.ts";
  import ApiProbe from "./ApiProbe.test.svelte";
  let {
    configuration,
    capture,
  }: { configuration: ApiConfig; capture: (store: ApiClient) => void } =
    $props();
</script>

<RuneProvider
  plugins={[api]}
  config={{
    persistence: createInMemoryDriver(),
    pluginConfig: { "rune-lab.api": { api: configuration } },
  }}
>
  <ApiProbe {capture} />
</RuneProvider>
