<script lang="ts">
  import ShowcaseCard from "../ShowcaseCard.svelte";
</script>

{#snippet section(label: string)}
  <div class="divider text-xs font-bold opacity-40 mt-6 mb-2">
    {label.toUpperCase()}
  </div>
{/snippet}

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
  <!-- NAVBAR & MENU -->
  <ShowcaseCard title="Navbar & Menu" icon="🍔">
    {@render section("Navbar")}
    <div class="navbar bg-base-200 rounded-box shadow-sm">
      <div class="flex-1">
        <button class="btn btn-ghost text-xl">RuneLab</button>
      </div>
      <div class="flex-none">
        <ul class="menu menu-horizontal px-1">
          <li><button>Link</button></li>
          <li>
            <details>
              <summary>Parent</summary>
              <ul class="bg-base-100 rounded-t-none p-2 z-50">
                <li><button>Sub 1</button></li>
                <li><button>Sub 2</button></li>
              </ul>
            </details>
          </li>
        </ul>
      </div>
    </div>

    {@render section("Vertical Menu")}
    <ul class="menu bg-base-200 w-56 rounded-box">
      <li><button>Item 1</button></li>
      <li>
        <button class="menu-active">Active Item</button>
      </li>
      <li><button>Item 3</button></li>
    </ul>
  </ShowcaseCard>

  <!-- TABS & PAGINATION -->
  <ShowcaseCard title="Tabs & Pagination" icon="📑">
    {@render section("Tabs (Box style)")}
    <div role="tablist" class="tabs tabs-box">
      <button role="tab" class="tab">Tab 1</button>
      <button role="tab" class="tab tab-active">Tab 2</button>
      <button role="tab" class="tab">Tab 3</button>
    </div>

    {@render section("Tabs (Lifted)")}
    <div role="tablist" class="tabs tabs-lift">
      <button role="tab" class="tab">Lifted 1</button>
      <button role="tab" class="tab tab-active">Lifted 2</button>
      <button role="tab" class="tab">Lifted 3</button>
    </div>

    {@render section("Pagination (Join)")}
    <div class="join">
      <button class="join-item btn">«</button>
      <button class="join-item btn">Page 22</button>
      <button class="join-item btn btn-active">23</button>
      <button class="join-item btn">24</button>
      <button class="join-item btn">»</button>
    </div>
  </ShowcaseCard>

  <!-- STEPS & BREADCRUMBS -->
  <ShowcaseCard title="Steps & Breadcrumbs" icon="👣">
    {@render section("Steps")}
    <ul
      class="steps steps-vertical lg:steps-horizontal w-full bg-base-200 p-4 rounded-box"
    >
      <li class="step step-primary">Register</li>
      <li class="step step-primary">Plan</li>
      <li class="step">Purchase</li>
      <li class="step">Receive</li>
    </ul>

    {@render section("Breadcrumbs")}
    <div class="breadcrumbs text-sm bg-base-200 p-4 rounded-box mt-4">
      <ul>
        <li><button>Home</button></li>
        <li><button>Documents</button></li>
        <li>Add Document</li>
      </ul>
    </div>
  </ShowcaseCard>

  <!-- DOCK & DRAWER -->
  <ShowcaseCard title="Dock & Drawer" icon="⚓">
    {@render section("Dock (Bottom Nav)")}
    <div class="relative h-32 w-full bg-base-300 rounded-lg overflow-hidden">
      <div class="dock bg-base-200 absolute bottom-0">
        <button>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            /></svg
          >
          <span class="dock-label">Home</span>
        </button>
        <button class="dock-active">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            /></svg
          >
          <span class="dock-label">Info</span>
        </button>
        <button>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            /></svg
          >
          <span class="dock-label">Stats</span>
        </button>
      </div>
    </div>

    {@render section("Drawer")}
    <div class="drawer h-40 bg-base-300 rounded-lg overflow-hidden">
      <input id="drawer-demo" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content flex flex-col items-center justify-center">
        <label for="drawer-demo" class="btn btn-primary drawer-button"
          >Open Drawer</label
        >
      </div>
      <div class="drawer-side absolute!">
        <label
          for="drawer-demo"
          aria-label="close sidebar"
          class="drawer-overlay"
        ></label>
        <ul class="menu p-4 w-56 min-h-full bg-base-200 text-base-content">
          <li><button>Sidebar Item 1</button></li>
          <li><button>Sidebar Item 2</button></li>
        </ul>
      </div>
    </div>
  </ShowcaseCard>
</div>
