<script lang="ts">
import { setContext, untrack } from "svelte";
import { RUNE_LAB_CONTEXT } from "../provider/context.ts";
import SettingsFields from "./SettingsFields.svelte";

let { kernel, fields = [], disabled = false, onCommit }: any = $props();

untrack(() => {
  setContext(RUNE_LAB_CONTEXT.kernel, kernel);
});
</script>

<SettingsFields {fields} {disabled} {onCommit} />
