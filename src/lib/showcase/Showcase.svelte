<script lang="ts">
  import { getLayoutStore } from "$lib/state/layout.svelte";

  const layoutStore = getLayoutStore();

  import Actions from "./tabs/Actions.svelte";
  import DataInput from "./tabs/DataInput.svelte";
  import Display from "./tabs/Display.svelte";
  import Navigation from "./tabs/Navigation.svelte";
  import Feedback from "./tabs/Feedback.svelte";
  import Visual from "./tabs/Visual.svelte";

  const tabs = [
    { label: "Actions", icon: "⚡", component: Actions },
    { label: "Data Input", icon: "📥", component: DataInput },
    { label: "Display", icon: "📊", component: Display },
    { label: "Navigation", icon: "🧭", component: Navigation },
    { label: "Feedback", icon: "💬", component: Feedback },
    { label: "Visual", icon: "🎨", component: Visual },
  ];
</script>

<section
  class="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-1000"
>
  <div role="tablist" class="tabs tabs-box tabs-lg bg-base-200 p-2 rounded-2xl">
    {#each tabs as tab, i (tab.label)}
      <button
        role="tab"
        class="tab gap-2 transition-all duration-300 {layoutStore.activeShowcaseTab ===
        i
          ? 'tab-active shadow-lg'
          : ''}"
        onclick={() => layoutStore.setShowcaseTab(i)}
      >
        <span class="text-xl">{tab.icon}</span>
        <span class="hidden md:inline font-bold">{tab.label}</span>
      </button>
    {/each}
  </div>

  <div
    class="min-h-[600px] bg-base-200/50 rounded-3xl border border-base-content/5 overflow-hidden"
  >
    {#each tabs as tab, i (tab.label)}
      {#if layoutStore.activeShowcaseTab === i}
        <div class="animate-in fade-in zoom-in-95 duration-500">
          <tab.component />
        </div>
      {/if}
    {/each}
  </div>
</section>

<style>
  /* @import "daisyui/components/alert.css"; */
  /* @import "daisyui/components/avatar.css"; */
  /* @import "daisyui/components/badge.css"; */
  /* @import "daisyui/components/breadcrumbs.css"; */
  /* @import "daisyui/components/button.css"; */
  /* @import "daisyui/components/calendar.css"; */
  /* @import "daisyui/components/card.css"; */
  /* @import "daisyui/components/carousel.css"; */
  /* @import "daisyui/components/chat.css"; */
  /* @import "daisyui/components/checkbox.css"; */
  /* @import "daisyui/components/collapse.css"; */
  /* @import "daisyui/components/countdown.css"; */
  /* @import "daisyui/components/diff.css"; */
  /* @import "daisyui/components/divider.css"; */
  /* @import "daisyui/components/dock.css"; */
  /* @import "daisyui/components/drawer.css"; */
  /* @import "daisyui/components/dropdown.css"; */
  /* @import "daisyui/components/fab.css"; */
  /* @import "daisyui/components/fieldset.css"; */
  /* @import "daisyui/components/fileinput.css"; */
  /* @import "daisyui/components/filter.css"; */
  /* @import "daisyui/components/footer.css"; */
  /* @import "daisyui/components/hero.css"; */
  /* @import "daisyui/components/hover3d.css"; */
  /* @import "daisyui/components/hovergallery.css"; */
  /* @import "daisyui/components/indicator.css"; */
  /* @import "daisyui/components/input.css"; */
  /* @import "daisyui/components/kbd.css"; */
  /* @import "daisyui/components/label.css"; */
  /* @import "daisyui/components/link.css"; */
  /* @import "daisyui/components/list.css"; */
  /* @import "daisyui/components/loading.css"; */
  /* @import "daisyui/components/mask.css"; */
  /* @import "daisyui/components/menu.css"; */
  /* @import "daisyui/components/mockup.css"; */
  /* @import "daisyui/components/modal.css"; */
  /* @import "daisyui/components/navbar.css"; */
  /* @import "daisyui/components/progress.css"; */
  /* @import "daisyui/components/radialprogress.css"; */
  /* @import "daisyui/components/radio.css"; */
  /* @import "daisyui/components/range.css"; */
  /* @import "daisyui/components/rating.css"; */
  /* @import "daisyui/components/select.css"; */
  /* @import "daisyui/components/skeleton.css"; */
  /* @import "daisyui/components/stack.css"; */
  /* @import "daisyui/components/stat.css"; */
  /* @import "daisyui/components/status.css"; */
  /* @import "daisyui/components/steps.css"; */
  /* @import "daisyui/components/swap.css"; */
  /* @import "daisyui/components/tab.css"; */
  /* @import "daisyui/components/table.css"; */
  /* @import "daisyui/components/textarea.css"; */
  /* @import "daisyui/components/textrotate.css"; */
  /* @import "daisyui/components/timeline.css"; */
  /* @import "daisyui/components/toast.css"; */
  /* @import "daisyui/components/toggle.css"; */
  /* @import "daisyui/components/tooltip.css"; */
  /* @import "daisyui/components/validator.css"; */
</style>
