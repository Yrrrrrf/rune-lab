<script lang="ts">
  import { COLORS, SIZES } from './shared';
  import ShowcaseCard from './ShowcaseCard.svelte';

  let rangeVal = $state(40);
  let toggleChecked = $state(true);
  let checkboxChecked = $state(false);
  let ratingVal = $state(3);
</script>

{#snippet section(label: string)}
  <div class="divider text-xs font-bold opacity-40 mt-6 mb-2">{label.toUpperCase()}</div>
{/snippet}

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
  <!-- TEXT INPUTS -->
  <ShowcaseCard title="Text Inputs" icon="⌨️">
    {@render section('Colors')}
    <div class="grid grid-cols-2 gap-2">
      {#each COLORS as c (c)}
        <input type="text" placeholder="{c}" class="input input-{c} w-full" />
      {/each}
    </div>

    {@render section('Sizes')}
    <div class="flex flex-col gap-2">
      {#each SIZES as s (s)}
        <input type="text" placeholder="Size {s}" class="input input-{s} w-full" />
      {/each}
    </div>

    {@render section('Floating Labels')}
    <label class="floating-label">
      <input type="text" placeholder="Floating label" class="input w-full" />
      <span>Username</span>
    </label>
  </ShowcaseCard>

  <!-- SELECTION -->
  <ShowcaseCard title="Selection" icon="📋">
    {@render section('Select & File')}
    <div class="flex flex-col gap-4">
      <select class="select select-primary w-full">
        <option disabled selected>Pick your favorite Svelte version</option>
        <option>Svelte 3</option>
        <option>Svelte 4</option>
        <option>Svelte 5 (Runes!)</option>
      </select>
      
      <input type="file" class="file-input file-input-bordered w-full" />
    </div>

    {@render section('Textarea')}
    <textarea class="textarea textarea-bordered w-full h-24" placeholder="Tell us more..."></textarea>
  </ShowcaseCard>

  <!-- CHECK & TOGGLE -->
  <ShowcaseCard title="Check, Radio & Toggle" icon="🔘">
    {@render section('Checkboxes')}
    <div class="flex flex-wrap gap-4">
      {#each COLORS as c (c)}
        <input type="checkbox" checked class="checkbox checkbox-{c}" />
      {/each}
    </div>

    {@render section('Toggles')}
    <div class="flex flex-wrap gap-4 mt-4">
       {#each COLORS as c (c)}
        <input type="checkbox" bind:checked={toggleChecked} class="toggle toggle-{c}" />
      {/each}
    </div>

    {@render section('Radios')}
    <div class="flex flex-wrap gap-4 mt-4">
       {#each COLORS as c (c)}
        <input type="radio" name="radio-demo" class="radio radio-{c}" />
      {/each}
    </div>
  </ShowcaseCard>

  <!-- RANGE & RATING -->
  <ShowcaseCard title="Range & Rating" icon="📊">
    {@render section('Range')}
    <div class="space-y-4">
      <input type="range" min="0" max="100" bind:value={rangeVal} class="range range-primary" />
      <div class="flex justify-between text-xs px-2">
        <span>|</span><span>|</span><span>|</span><span>|</span><span>|</span>
      </div>
      <p class="text-center font-bold">Value: {rangeVal}</p>
    </div>

    {@render section('Rating')}
    <div class="rating rating-lg gap-1">
      <input type="radio" name="rating-demo" class="mask mask-star-2 bg-orange-400" />
      <input type="radio" name="rating-demo" class="mask mask-star-2 bg-orange-400" checked />
      <input type="radio" name="rating-demo" class="mask mask-star-2 bg-orange-400" />
      <input type="radio" name="rating-demo" class="mask mask-star-2 bg-orange-400" />
      <input type="radio" name="rating-demo" class="mask mask-star-2 bg-orange-400" />
    </div>

    {@render section('Fieldset & Validator')}
    <fieldset class="fieldset w-full bg-base-200 p-4 rounded-box">
      <legend class="fieldset-legend">Shipping Address</legend>
      <input type="text" class="input validator w-full" required placeholder="Street" />
      <p class="validator-hint">This field is required</p>
      
      <div class="flex gap-2 mt-2">
        <input type="text" class="input validator w-1/2" required pattern="[0-9]*" placeholder="Zip" />
        <input type="text" class="input w-1/2" placeholder="City" />
      </div>
    </fieldset>
  </ShowcaseCard>
</div>
