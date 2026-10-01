<script lang="ts">
  import type { Snippet } from "svelte";
  import { getAppStore, getT } from "rune-lab/ui";
  import { getCorpoStore } from "../context.ts";
  import AppIdentity from "./AppIdentity.svelte";
  let {
    children,
    year = new Date().getFullYear(),
    class: className = "",
  }: { children?: Snippet; year?: number; class?: string } = $props();
  const corpo = getCorpoStore();
  const app = getAppStore();
  const t = getT();
</script>

<footer
  class="footer sm:footer-horizontal border-t border-base-300 bg-base-200 p-6 text-base-content {className}"
  data-corpo-footer
>
  <aside>
    <AppIdentity compact />
    {#if corpo.company.tagline}<p>{corpo.company.tagline}</p>{/if}
    <p>
      © {#if corpo.company.copyrightStartYear && corpo.company.copyrightStartYear < year}{corpo
          .company.copyrightStartYear}–{/if}{year}
      {corpo.company.legalName ?? corpo.company.name}
    </p>
    {#if corpo.showVersion && app.data.version}<p class="text-xs opacity-70">
        v{app.data.version}
      </p>{/if}
  </aside>
  {#if corpo.footerLinks.length}
    <nav aria-label={t("corpo.company_links", "Company links")}>
      <h2 class="footer-title">{t("corpo.company", "Company")}</h2>
      {#each corpo.footerLinks as link (link.id)}
        <a
          class="link link-hover"
          href={link.href}
          target={link.external ? "_blank" : undefined}
          rel={link.external ? "noopener noreferrer" : undefined}
          >{link.label}</a
        >
      {/each}
    </nav>
  {/if}
  {@render children?.()}
</footer>
