<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { createInMemoryDriver } from "rune-lab/core";
  import type { CorpoConfig } from "../types.ts";
  import CorpoShell from "./CorpoShell.svelte";
  import CorpoProbe from "./CorpoProbe.test.svelte";
  let {
    config,
    onReady,
    custom = false,
  }: {
    config: CorpoConfig;
    onReady: ComponentProps<typeof CorpoProbe>["onReady"];
    custom?: boolean;
  } = $props();
</script>

{#snippet customFooter()}<footer data-custom-footer>
    Custom footer
  </footer>{/snippet}
{#snippet customHeader()}<header data-custom-header>
    Custom header
  </header>{/snippet}
<CorpoShell
  corpo={config}
  localeAdapter={{
    locales: ["en"],
    getLocale: () => "en",
    setLocale() {},
    onChange: () => () => {},
  }}
  config={{
    persistence: createInMemoryDriver(),
    app: { name: "CRM", version: "1.2.3" },
  }}
  api={{
    environments: [
      {
        id: "dev",
        label: "Development",
        baseUrl: "https://dev.example.test/api/",
      },
      { id: "prod", label: "Production", baseUrl: "https://example.test/api/" },
    ],
    autoCheck: false,
    persist: false,
  }}
  header={custom ? customHeader : undefined}
  footer={custom ? customFooter : undefined}
>
  <CorpoProbe {onReady} />
</CorpoShell>
