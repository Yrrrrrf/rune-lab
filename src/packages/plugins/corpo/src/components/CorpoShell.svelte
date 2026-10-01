<script lang="ts">
  import { hasContext, untrack } from "svelte";
  import { RuneProvider, RUNE_LAB_CONTEXT } from "rune-lab/ui";
  import { createCorpoIntegration } from "../integration.ts";
  import type { CorpoShellProps } from "../types.ts";
  import CorpoLayout from "./CorpoLayout.svelte";
  let {
    corpo,
    api,
    config,
    plugins,
    localeAdapter,
    ...layoutProps
  }: CorpoShellProps = $props();
  if (hasContext(RUNE_LAB_CONTEXT.kernel)) {
    throw new Error(
      "[rune-lab.corpo] CorpoShell includes RuneProvider. Use CorpoLayout inside an existing provider.",
    );
  }
  // Match RuneProvider's lifetime: configuration is captured once per mounted shell.
  const integration = untrack(() =>
    createCorpoIntegration({ corpo, api, config, plugins }),
  );
</script>

<RuneProvider {...integration} {localeAdapter}>
  <CorpoLayout {...layoutProps} />
</RuneProvider>
