<script lang="ts">
  import { getT, Icon } from "rune-lab/ui";
  import { getCorpoStore } from "../context.ts";
  let {
    activeHref,
    class: className = "",
  }: { activeHref?: string; class?: string } = $props();
  const corpo = getCorpoStore();
  const t = getT();
</script>

<nav aria-label={t("corpo.navigation", "Main navigation")} class={className}>
  <ul class="menu w-full">
    {#each corpo.navigation as link (link.id)}
      <li>
        <a
          href={link.href}
          class:menu-active={activeHref === link.href}
          aria-current={activeHref === link.href ? "page" : undefined}
          target={link.external ? "_blank" : undefined}
          rel={link.external ? "noopener noreferrer" : undefined}
        >
          {#if link.icon}<span aria-hidden="true"
              ><Icon name={link.icon} /></span
            >{/if}
          {link.label}
        </a>
      </li>
    {/each}
  </ul>
</nav>
