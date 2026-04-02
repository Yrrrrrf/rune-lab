<script lang="ts">
    import ShowcaseCard from "../ShowcaseCard.svelte";
    import { Icon } from "rune-lab";
</script>

<div class="space-y-6">
    <!-- Navbar & Drawer -->
    <ShowcaseCard title="Navbar & Drawer" icon="🧭">
        <div class="drawer">
            <input id="my-drawer-3" type="checkbox" class="drawer-toggle" /> 
            <div class="drawer-content flex flex-col">
                <!-- Navbar -->
                <div class="w-full navbar bg-base-300 rounded-box border border-base-content/10">
                    <div class="flex-none lg:hidden">
                        <label for="my-drawer-3" aria-label="open sidebar" class="btn btn-square btn-ghost">
                            <Icon name={"menu" as never} class="w-5 h-5" />
                        </label>
                    </div> 
                    <div class="flex-1 px-2 mx-2 font-black tracking-widest uppercase">Company</div>
                    <div class="flex-none hidden lg:block">
                        <ul class="menu menu-horizontal">
                            <!-- Navbar menu content here -->
                            <li><a href="#about">About</a></li>
                            <li><a href="#products">Products</a></li>
                        </ul>
                    </div>
                </div>
            </div> 
            <div class="drawer-side z-50">
                <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"></label> 
                <ul class="menu p-4 w-80 min-h-full bg-base-200">
                    <!-- Sidebar content here -->
                    <li><a href="#s1">Sidebar Item 1</a></li>
                    <li><a href="#s2">Sidebar Item 2</a></li>
                </ul>
            </div>
        </div>
    </ShowcaseCard>

    <!-- Menus -->
    <ShowcaseCard title="Menus" icon="📜">
        <div class="flex flex-wrap gap-8 items-start">
            <ul class="menu bg-base-200 w-56 rounded-box">
                <li class="menu-title">Category 1</li>
                <li><a href="#1">Item 1</a></li>
                <li><a href="#2">Item 2</a></li>
                <li class="menu-title">Category 2</li>
                <li>
                    <details open>
                        <summary>Parent</summary>
                        <ul>
                            <li><a href="#sub1">Submenu 1</a></li>
                            <li><a href="#sub2">Submenu 2</a></li>
                        </ul>
                    </details>
                </li>
            </ul>

            <ul class="menu menu-horizontal bg-base-200 rounded-box">
                <li><a href="#h1">Item 1</a></li>
                <li><a href="#h2">Item 2</a></li>
                <li><a href="#h3">Item 3</a></li>
            </ul>
        </div>
    </ShowcaseCard>

    <!-- Tabs & Breadcrumbs -->
    <ShowcaseCard title="Tabs & Breadcrumbs" icon="📑">
        <div class="flex flex-col gap-8">
            <div role="tablist" class="tabs tabs-lifted">
                <input type="radio" name="my_tabs_2" role="tab" class="tab" aria-label="Tab 1" />
                <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6">Tab content 1</div>
                
                <input type="radio" name="my_tabs_2" role="tab" class="tab" aria-label="Tab 2" checked />
                <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6">Tab content 2</div>
                
                <input type="radio" name="my_tabs_2" role="tab" class="tab" aria-label="Tab 3" />
                <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6">Tab content 3</div>
            </div>
            
            <div role="tablist" class="tabs tabs-boxed">
                <input type="radio" name="my_tabs_1" role="tab" class="tab" aria-label="Tab 1" />
                <input type="radio" name="my_tabs_1" role="tab" class="tab" aria-label="Tab 2" checked />
                <input type="radio" name="my_tabs_1" role="tab" class="tab" aria-label="Tab 3" />
            </div>

            <div class="breadcrumbs text-sm">
                <ul>
                    <li><a href="#home">Home</a></li>
                    <li><a href="#docs">Documents</a></li>
                    <li>Add Document</li>
                </ul>
            </div>
        </div>
    </ShowcaseCard>

    <!-- Steps & Pagination -->
    <ShowcaseCard title="Steps & Join" icon="🔢">
        <div class="flex flex-col gap-6">
            <ul class="steps w-full">
                <li class="step step-primary">Register</li>
                <li class="step step-primary">Choose plan</li>
                <li class="step">Purchase</li>
                <li class="step">Receive Product</li>
            </ul>

            <div class="join">
                <button class="join-item btn">1</button>
                <button class="join-item btn btn-active">2</button>
                <button class="join-item btn">3</button>
                <button class="join-item btn">4</button>
            </div>
        </div>
    </ShowcaseCard>

    <!-- Dock -->
    <ShowcaseCard title="Dock" icon="📱">
        <div class="h-32 relative bg-base-200 rounded-box overflow-hidden">
            <div class="dock absolute">
                <button>
                    <Icon name={"search" as never} class="w-6 h-6" />
                    <span class="dock-label">Search</span>
                </button>
                <button class="dock-active">
                    <Icon name={"user" as never} class="w-6 h-6" />
                    <span class="dock-label">Profile</span>
                </button>
                <button>
                    <Icon name={"settings" as never} class="w-6 h-6" />
                    <span class="dock-label">Settings</span>
                </button>
            </div>
        </div>
    </ShowcaseCard>
</div>
