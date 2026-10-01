<script lang="ts">
  import { getT, Icon } from "rune-lab/ui";
  import { onDestroy } from "svelte";
  import { getApiStore } from "../context.ts";
  import APIEnvironmentSelector from "./APIEnvironmentSelector.svelte";
  let {
    floating = false,
    showEnvironmentSelector = false,
    showDetails = false,
    class: className = "",
    onCopied,
  }: {
    floating?: boolean;
    showEnvironmentSelector?: boolean;
    showDetails?: boolean;
    class?: string;
    onCopied?: (url: string) => void;
  } = $props();
  const api = getApiStore();
  const t = getT();
  let copied = $state(false);
  let copyError = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;
  onDestroy(() => {
    destroyed = true;
    if (timer) clearTimeout(timer);
  });
  const health = $derived(api.state.health);
  const label = $derived(
    health.checking
      ? t("api.checking", "Checking")
      : {
          unknown: t("api.unknown", "Not checked"),
          healthy: t("api.healthy", "Healthy"),
          degraded: t("api.degraded", "Degraded"),
          unhealthy: t("api.unhealthy", "Unhealthy"),
          unreachable: t("api.unreachable", "Unreachable"),
          unauthorized: t("api.unauthorized", "Access denied"),
        }[health.status],
  );
  const color = $derived(
    health.checking
      ? "status-info"
      : {
          unknown: "status-neutral",
          healthy: "status-success",
          degraded: "status-warning",
          unhealthy: "status-error",
          unreachable: "status-error",
          unauthorized: "status-warning",
        }[health.status],
  );
  async function copy() {
    const url = api.environment?.baseUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      if (destroyed) return;
      copied = true;
      copyError = false;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        copied = false;
      }, 2_000);
    } catch {
      if (!destroyed) {
        copyError = true;
        copied = false;
      }
      return;
    }
    onCopied?.(url);
  }
  function check() {
    void api.checkHealth().catch(() => {});
  }
</script>

<div
  class="flex flex-wrap items-center gap-2 text-xs {floating
    ? 'fixed bottom-4 left-4 z-50 rounded-xl border border-base-300 bg-base-100 p-3 shadow-lg'
    : ''} {className}"
>
  <span class="status status-sm {color}" aria-hidden="true"></span>
  <span role="status" aria-live="polite"
    >{api.environment
      ? label
      : t("api.unconfigured", "API not configured")}</span
  >
  {#if showEnvironmentSelector}
    <APIEnvironmentSelector />
  {:else if api.environment}
    <span class="badge badge-ghost badge-sm">{api.environment.label}</span>
  {/if}
  {#if api.environment}
    <button
      type="button"
      class="btn btn-ghost btn-xs max-w-64"
      onclick={copy}
      title={api.environment.baseUrl}
      aria-label={t("api.copy_url", "Copy API URL")}
    >
      <span class="truncate font-mono">{api.environment.baseUrl}</span>
      <span aria-hidden="true"
        ><Icon name={copied ? "lucide:check" : "lucide:copy"} /></span
      >
    </button>
    {#if api.canCheckHealth}
      <button
        type="button"
        class="btn btn-ghost btn-xs"
        onclick={check}
        disabled={health.checking}
        aria-label={t("api.check_now", "Check API health now")}
      >
        <span aria-hidden="true"><Icon name="lucide:refresh-cw" /></span>
        {t("api.check", "Check")}
      </button>
    {/if}
    {#if api.environment.docsUrl}
      <a
        class="btn btn-ghost btn-xs"
        href={api.environment.docsUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("api.docs", "Docs")}
      </a>
    {/if}
  {/if}
  {#if copied}<span role="status">{t("api.copied", "Copied")}</span>{/if}
  {#if copyError}<span role="alert"
      >{t("api.copy_failed", "Could not copy URL")}</span
    >{/if}
  {#if showDetails && api.environment}
    {#if health.latencyMs !== null}<span>{health.latencyMs} ms</span>{/if}
    {#if health.version}<span>v{health.version}</span>{/if}
    {#if health.checkedAt !== null}<time
        datetime={new Date(health.checkedAt).toISOString()}
        >{new Date(health.checkedAt).toLocaleTimeString()}</time
      >{/if}
    {#if health.message}<span>{health.message}</span>{/if}
    {#if api.state.pending > 0}<span
        >{t("api.pending", "Pending")}: {api.state.pending}</span
      >{/if}
  {/if}
</div>
