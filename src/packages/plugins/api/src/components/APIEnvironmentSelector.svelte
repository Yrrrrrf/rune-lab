<script lang="ts">
  import { getT } from "rune-lab/ui";
  import { getApiStore } from "../context.ts";
  let {
    disabled = false,
    commit,
    class: className = "",
  }: {
    disabled?: boolean;
    /** Used by Rune-Lab SettingsFields; standalone usage writes directly to the store. */
    commit?: (value: unknown) => void;
    class?: string;
  } = $props();
  const api = getApiStore();
  const t = getT();
  function select(event: Event) {
    const id = (event.currentTarget as HTMLSelectElement).value;
    if (commit) commit(id);
    else api.setEnvironment(id);
  }
</script>

<select
  class="select select-sm {className}"
  aria-label={t("api.environment", "API environment")}
  value={api.current ?? ""}
  disabled={disabled || api.environments.length < 2}
  onchange={select}
>
  {#if api.environments.length === 0}
    <option value="">{t("api.unconfigured", "API not configured")}</option>
  {/if}
  {#each api.environments as environment (environment.id)}
    <option value={environment.id}>{environment.label}</option>
  {/each}
</select>
