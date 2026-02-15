<script lang="ts">
  import { COLORS, SIZES, BTN_STYLES, BADGE_STYLES } from './shared';
  import ShowcaseCard from './ShowcaseCard.svelte';
</script>

{#snippet section(label: string)}
  <div class="divider text-xs font-bold opacity-40 mt-6 mb-2">{label.toUpperCase()}</div>
{/snippet}

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
  <!-- BUTTONS -->
  <ShowcaseCard title="Buttons" icon="🖱️">
    {@render section('Colors')}
    <div class="flex flex-wrap gap-2">
      {#each COLORS as c (c)}
        <button class="btn btn-{c}">{c}</button>
      {/each}
    </div>

    {@render section('Styles')}
    <div class="space-y-4">
      {#each BTN_STYLES as style (style)}
        {#if style}
          <div class="flex flex-wrap gap-2">
            {#each COLORS as c (c)}
              <button class="btn {style} btn-{c}">{c}</button>
            {/each}
          </div>
        {/if}
      {/each}
    </div>

    {@render section('Sizes')}
    <div class="flex flex-wrap gap-2 items-end">
      {#each SIZES as s (s)}
        <button class="btn btn-primary btn-{s}">{s}</button>
      {/each}
    </div>
  </ShowcaseCard>

  <!-- BADGES -->
  <ShowcaseCard title="Badges" icon="🏷️">
    {@render section('Colors')}
    <div class="flex flex-wrap gap-2">
      {#each COLORS as c (c)}
        <div class="badge badge-{c}">{c}</div>
      {/each}
    </div>

    {@render section('Styles')}
    <div class="space-y-4">
      {#each BADGE_STYLES as style (style)}
        {#if style}
          <div class="flex flex-wrap gap-2">
            {#each COLORS as c (c)}
              <div class="badge {style} badge-{c}">{c}</div>
            {/each}
          </div>
        {/if}
      {/each}
    </div>

    {@render section('In Elements')}
    <div class="flex flex-wrap gap-4">
      <button class="btn">
        Inbox
        <div class="badge badge-secondary">+99</div>
      </button>
      <div class="flex items-center gap-2 text-xl font-bold">
        Notifications
        <div class="badge badge-primary badge-outline">NEW</div>
      </div>
    </div>
  </ShowcaseCard>

  <!-- AVATAR & STATUS -->
  <ShowcaseCard title="Avatar & Status" icon="👤">
    {@render section('Shapes & Status')}
    <div class="flex flex-wrap gap-6 items-center">
      <div class="avatar online">
        <div class="w-16 rounded-full">
          <img src="https://picsum.photos/160" alt="Avatar" />
        </div>
      </div>
      <div class="avatar offline">
        <div class="w-16 rounded-xl">
          <img src="https://picsum.photos/161" alt="Avatar" />
        </div>
      </div>
      <div class="avatar online">
        <div class="w-16 mask mask-squircle">
          <img src="https://picsum.photos/162" alt="Avatar" />
        </div>
      </div>
    </div>

    {@render section('Status Indicators')}
    <div class="flex flex-wrap gap-4 items-center">
      {#each COLORS as c (c)}
        <span class="status status-{c}"></span>
      {/each}
      <span class="status status-success animate-ping"></span>
    </div>
  </ShowcaseCard>

  <!-- INDICATORS & FAB -->
  <ShowcaseCard title="Indicators & FAB" icon="📍">
    {@render section('Indicators')}
    <div class="flex flex-wrap gap-8">
      <div class="indicator">
        <span class="indicator-item badge badge-secondary">99+</span>
        <div class="grid w-20 h-20 bg-base-300 place-items-center rounded-lg">Inbox</div>
      </div>
      
      <div class="indicator">
        <span class="indicator-item indicator-bottom indicator-center badge badge-primary">new</span>
        <div class="grid w-20 h-20 bg-base-300 place-items-center rounded-lg">Items</div>
      </div>
    </div>

    {@render section('FAB / Speed Dial')}
    <div class="relative h-40 w-full bg-base-200 rounded-lg overflow-hidden p-4">
       <div class="absolute bottom-4 right-4">
          <div class="fab">
            <div tabindex="0" role="button" class="btn btn-primary btn-circle btn-lg">＋</div>
            <button class="btn btn-circle btn-secondary">A</button>
            <button class="btn btn-circle btn-secondary">B</button>
            <button class="btn btn-circle btn-secondary">C</button>
          </div>
       </div>
    </div>
  </ShowcaseCard>
</div>
