<script lang="ts">
  import ShowcaseCard from "../ShowcaseCard.svelte";
</script>

{#snippet section(label: string)}
  <div class="divider text-xs font-bold opacity-40 mt-6 mb-2">
    {label.toUpperCase()}
  </div>
{/snippet}

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
  <!-- DIVIDER & JOIN -->
  <ShowcaseCard title="Divider & Join" icon="🔗">
    {@render section("Dividers")}
    <div class="flex flex-col w-full">
      <div class="grid h-20 card bg-base-300 rounded-box place-items-center">
        content
      </div>
      <div class="divider">OR</div>
      <div class="grid h-20 card bg-base-300 rounded-box place-items-center">
        content
      </div>
    </div>

    {@render section("Join")}
    <div class="join">
      <input class="input input-bordered join-item" placeholder="Email" />
      <button class="btn join-item rounded-r-full">Subscribe</button>
    </div>
  </ShowcaseCard>

  <!-- MASK & STACK -->
  <ShowcaseCard title="Mask & Stack" icon="🎭">
    {@render section("Masks")}
    <div class="flex flex-wrap gap-4">
      <img
        class="mask mask-squircle size-16"
        src="https://picsum.photos/64"
        alt="Squircle"
      />
      <img
        class="mask mask-heart size-16"
        src="https://picsum.photos/65"
        alt="Heart"
      />
      <img
        class="mask mask-hexagon size-16"
        src="https://picsum.photos/66"
        alt="Hexagon"
      />
      <img
        class="mask mask-star size-16"
        src="https://picsum.photos/67"
        alt="Star"
      />
    </div>

    {@render section("Stack")}
    <div class="stack mt-4">
      <div
        class="grid w-32 h-20 rounded bg-primary text-primary-content place-items-center"
      >
        1
      </div>
      <div
        class="grid w-32 h-20 rounded bg-accent text-accent-content place-items-center"
      >
        2
      </div>
      <div
        class="grid w-32 h-20 rounded bg-secondary text-secondary-content place-items-center"
      >
        3
      </div>
    </div>
  </ShowcaseCard>

  <!-- SWAP & HERO -->
  <ShowcaseCard title="Swap & Hero" icon="🔄">
    {@render section("Swap")}
    <div class="flex gap-8 items-center justify-center">
      <label class="swap swap-rotate text-6xl">
        <input type="checkbox" />
        <div class="swap-on">🌞</div>
        <div class="swap-off">🌚</div>
      </label>

      <label class="swap swap-flip text-6xl">
        <input type="checkbox" />
        <div class="swap-on">🥳</div>
        <div class="swap-off">😭</div>
      </label>
    </div>

    {@render section("Hero")}
    <div class="hero bg-base-200 rounded-box py-4">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-3xl font-bold">Hello there</h1>
          <button class="btn btn-primary btn-sm mt-2">Get Started</button>
        </div>
      </div>
    </div>
  </ShowcaseCard>

  <!-- HOVER EFFECTS -->
  <ShowcaseCard title="v5 Hover Effects" icon="✨">
    {@render section("Hover 3D")}
    <div class="hover-3d h-48 w-full">
      <div
        class="grid h-full w-full bg-gradient-to-br from-primary to-secondary rounded-2xl place-items-center text-white font-bold text-2xl shadow-xl"
      >
        Hover Me!
      </div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>

    {@render section("Hover Gallery")}
    <figure class="hover-gallery w-full h-48 rounded-2xl overflow-hidden mt-4">
      <img src="https://picsum.photos/400/200?v=1" alt="1" />
      <img src="https://picsum.photos/400/200?v=2" alt="2" />
      <img src="https://picsum.photos/400/200?v=3" alt="3" />
      <img src="https://picsum.photos/400/200?v=4" alt="4" />
    </figure>
  </ShowcaseCard>
</div>
