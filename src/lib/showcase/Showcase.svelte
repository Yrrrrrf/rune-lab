<script lang="ts">
  import Tab1Actions from "./tab1-Actions.svelte";
  import Tab2DataInput from "./tab2-DataInput.svelte";
  import Tab3Display from "./tab3-Display.svelte";
  import Tab4Navigation from "./tab4-Navigation.svelte";
  import Tab5Feedback from "./tab5-Feedback.svelte";
  import Tab6Visual from "./tab6-Visual.svelte";

  let activeTab = $state(0);

  const tabs = [
    { label: "Actions", icon: "⚡", component: Tab1Actions },
    { label: "Data Input", icon: "📥", component: Tab2DataInput },
    { label: "Display", icon: "📊", component: Tab3Display },
    { label: "Navigation", icon: "🧭", component: Tab4Navigation },
    { label: "Feedback", icon: "💬", component: Tab5Feedback },
    { label: "Visual", icon: "🎨", component: Tab6Visual },
  ];
</script>

<section
  class="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-1000"
>
  <div class="text-center space-y-2">
    <h2 class="text-4xl font-black tracking-tight">DaisyUI 5 Showcase</h2>
  </div>

  <div role="tablist" class="tabs tabs-box tabs-lg bg-base-200 p-2 rounded-2xl">
    {#each tabs as tab, i (tab.label)}
      <button
        role="tab"
        class="tab gap-2 transition-all duration-300 {activeTab === i
          ? 'tab-active shadow-lg'
          : ''}"
        onclick={() => (activeTab = i)}
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
      {#if activeTab === i}
        <div class="animate-in fade-in zoom-in-95 duration-500">
          <tab.component />
        </div>
      {/if}
    {/each}
  </div>
</section>
