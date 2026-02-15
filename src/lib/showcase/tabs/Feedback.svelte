<script lang="ts">
  import { COLORS } from "../shared";
  import ShowcaseCard from "../ShowcaseCard.svelte";

  let progressVal = $state(70);
  let modalOpen = $state(false);
</script>

{#snippet section(label: string)}
  <div class="divider text-xs font-bold opacity-40 mt-6 mb-2">
    {label.toUpperCase()}
  </div>
{/snippet}

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
  <!-- ALERTS -->
  <ShowcaseCard title="Alerts" icon="🚨">
    {@render section("Colors")}
    <div class="space-y-2">
      <div role="alert" class="alert alert-info py-2 px-4 text-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="h-6 w-6 shrink-0 stroke-current"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path></svg
        >
        <span>New software update available.</span>
      </div>
      <div role="alert" class="alert alert-success py-2 px-4 text-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          /></svg
        >
        <span>Your purchase was successful!</span>
      </div>
      <div role="alert" class="alert alert-warning py-2 px-4 text-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          /></svg
        >
        <span>Warning: Invalid email address!</span>
      </div>
    </div>

    {@render section("Styles")}
    <div class="alert alert-dash alert-error mt-2 py-2 px-4 text-sm">
      <span>Dash style alert</span>
    </div>
  </ShowcaseCard>

  <!-- MODAL & TOOLTIP -->
  <ShowcaseCard title="Modal & Tooltip" icon="🪟">
    {@render section("Dialog Modal")}
    <button
      class="btn btn-primary"
      onclick={() =>
        (
          document.getElementById("demo_modal") as HTMLDialogElement
        ).showModal()}
    >
      Open Modal
    </button>
    <dialog id="demo_modal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Hello!</h3>
        <p class="py-4">Press ESC key or click the button below to close</p>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn">Close</button>
          </form>
        </div>
      </div>
    </dialog>

    {@render section("Tooltips")}
    <div class="flex flex-wrap gap-4 pt-4">
      <div class="tooltip" data-tip="hello">
        <button class="btn">Top</button>
      </div>
      <div class="tooltip tooltip-bottom" data-tip="world">
        <button class="btn">Bottom</button>
      </div>
    </div>
  </ShowcaseCard>

  <!-- LOADING & PROGRESS -->
  <ShowcaseCard title="Loading & Progress" icon="⏳">
    {@render section("Loading Spinners")}
    <div class="flex flex-wrap gap-4 items-center">
      <span class="loading loading-spinner loading-md"></span>
      <span class="loading loading-dots loading-md text-primary"></span>
      <span class="loading loading-ring loading-md text-secondary"></span>
      <span class="loading loading-ball loading-md text-accent"></span>
      <span class="loading loading-bars loading-md"></span>
      <span class="loading loading-infinity loading-lg"></span>
    </div>

    {@render section("Progress Bars")}
    <div class="space-y-4">
      <progress
        class="progress progress-primary w-full"
        value={progressVal}
        max="100"
      ></progress>
      <div class="flex flex-wrap gap-4 justify-center">
        <div
          class="radial-progress text-primary"
          style="--value:{progressVal};"
          role="progressbar"
        >
          {progressVal}%
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        bind:value={progressVal}
        class="range range-xs"
      />
    </div>
  </ShowcaseCard>

  <!-- SKELETON & COLLAPSE -->
  <ShowcaseCard title="Skeleton & Collapse" icon="🦴">
    {@render section("Skeleton")}
    <div class="flex flex-col gap-4 w-full">
      <div class="flex items-center gap-4">
        <div class="skeleton h-16 w-16 shrink-0 rounded-full"></div>
        <div class="flex flex-col gap-4">
          <div class="skeleton h-4 w-20"></div>
          <div class="skeleton h-4 w-28"></div>
        </div>
      </div>
      <div class="skeleton h-32 w-full"></div>
    </div>

    {@render section("Collapse / Accordion")}
    <div class="collapse collapse-arrow bg-base-200 mt-4">
      <input type="radio" name="my-accordion-1" checked />
      <div class="collapse-title text-xl font-medium">
        Click to open this one and close others
      </div>
      <div class="collapse-content">
        <p>hello</p>
      </div>
    </div>
    <div class="collapse collapse-arrow bg-base-200 mt-2">
      <input type="radio" name="my-accordion-1" />
      <div class="collapse-title text-xl font-medium">
        Click to open this one and close others
      </div>
      <div class="collapse-content">
        <p>hello</p>
      </div>
    </div>
  </ShowcaseCard>
</div>
