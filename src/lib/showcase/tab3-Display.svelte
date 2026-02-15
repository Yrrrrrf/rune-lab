<script lang="ts">
  import { COLORS, CARD_STYLES } from './shared';
  import ShowcaseCard from './ShowcaseCard.svelte';
</script>

{#snippet section(label: string)}
  <div class="divider text-xs font-bold opacity-40 mt-6 mb-2">{label.toUpperCase()}</div>
{/snippet}

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
  <!-- CARDS -->
  <ShowcaseCard title="Cards" icon="🃏">
    {@render section('Styles')}
    <div class="grid grid-cols-2 gap-4">
      {#each CARD_STYLES as style (style)}
        <div class="card bg-base-200 {style} w-full">
          <div class="card-body p-4">
            <h2 class="card-title text-sm">{style || 'default'}</h2>
            <p class="text-xs">Card content</p>
          </div>
        </div>
      {/each}
      <div class="card image-full w-full">
        <figure><img src="https://picsum.photos/400/200" alt="Shoes" /></figure>
        <div class="card-body p-4">
          <h2 class="card-title text-sm">Image Full</h2>
        </div>
      </div>
    </div>
  </ShowcaseCard>

  <!-- LISTS & TABLES -->
  <ShowcaseCard title="Lists & Tables" icon="📜">
    {@render section('Lists')}
    <ul class="list bg-base-200 rounded-box shadow-sm">
      <li class="list-row">
        <div><img class="size-10 rounded-box" src="https://picsum.photos/40" alt="Avatar" /></div>
        <div>
          <div>Svelte 5</div>
          <div class="text-xs uppercase font-semibold opacity-60">Runes are here</div>
        </div>
        <button class="btn btn-square btn-ghost" aria-label="Add item">
          <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </button>
      </li>
      <li class="list-row">
        <div><img class="size-10 rounded-box" src="https://picsum.photos/41" alt="Avatar" /></div>
        <div class="list-col-grow">
          <div>DaisyUI v5</div>
          <div class="text-xs opacity-60">Better than ever</div>
        </div>
        <div class="badge badge-soft badge-success">Active</div>
      </li>
    </ul>

    {@render section('Table')}
    <div class="overflow-x-auto bg-base-200 rounded-box mt-2">
      <table class="table table-zebra table-sm">
        <thead>
          <tr><th>Name</th><th>Role</th></tr>
        </thead>
        <tbody>
          <tr><td>Yusepe</td><td>Dev</td></tr>
          <tr><td>Gemini</td><td>AI</td></tr>
        </tbody>
      </table>
    </div>
  </ShowcaseCard>

  <!-- CHAT & STATS -->
  <ShowcaseCard title="Chat & Stats" icon="💬">
    {@render section('Chat bubbles')}
    <div class="space-y-2">
      <div class="chat chat-start">
        <div class="chat-bubble chat-bubble-primary">Hello Svelte 5!</div>
      </div>
      <div class="chat chat-end">
        <div class="chat-bubble chat-bubble-secondary">Hi there!</div>
      </div>
    </div>

    {@render section('Stats')}
    <div class="stats stats-vertical lg:stats-horizontal shadow-sm bg-base-200 w-full mt-2">
      <div class="stat p-4">
        <div class="stat-title text-xs">Downloads</div>
        <div class="stat-value text-2xl">31K</div>
      </div>
      <div class="stat p-4 border-l border-base-content/10">
        <div class="stat-title text-xs">Users</div>
        <div class="stat-value text-2xl">4.2K</div>
      </div>
    </div>
  </ShowcaseCard>

  <!-- MOCKUPS & VISUAL -->
  <ShowcaseCard title="Mockups & More" icon="💻">
    {@render section('Mockup Browser')}
    <div class="mockup-browser bg-base-300 border border-base-300">
      <div class="mockup-browser-toolbar">
        <div class="input">https://rune-lab.dev</div>
      </div>
      <div class="bg-base-200 flex justify-center px-4 py-8">Hello!</div>
    </div>

    {@render section('Text Rotate')}
    <div class="text-center font-bold text-2xl py-4">
      Modern UI is 
      <span class="text-rotate text-primary">
        <span>
          <span>FAST</span>
          <span>EASY</span>
          <span>ROBUST</span>
          <span>SMART</span>
        </span>
      </span>
    </div>

    {@render section('Diff')}
    <figure class="diff aspect-16/9 rounded-lg">
      <div class="diff-item-1">
        <img alt="Svelte" src="https://picsum.photos/400/225?grayscale" />
      </div>
      <div class="diff-item-2">
        <img alt="Svelte" src="https://picsum.photos/400/225" />
      </div>
      <div class="diff-resizer"></div>
    </figure>
  </ShowcaseCard>
</div>
