<script lang="ts">
    import { 
        // MagnifyingGlass, 
        Gear, 
        User, 
        SignIn,
        SignOut,
        Bell,
    } from 'phosphor-svelte';
    
    import { appData } from '$lib/stores/app.svelte.js';
    import { authStore } from '$lib/stores/auth.svelte.js';
    import SignInCard from '$lib/components/layout/SignInCard.svelte';

    // State using Runes
    // let isSearchActive = $state(false);
    let searchQuery = $state('');
    let notificationCount = $state(3);
    let showLoginModal = $state(false);

    // function handleSearch(e: KeyboardEvent) {
    //     if (e.key === 'Enter' && searchQuery.trim()) {
    //         isSearchActive = false;
    //     } else if (e.key === 'Escape') {
    //         isSearchActive = false;
    //     }
    // }
</script>

<nav class="navbar bg-base-100">
    <div class="flex-1">
        <a href="/" class="btn btn-ghost normal-case text-xl gap-2">
            <div class="w-10 h-10">
                <img 
                    src="/favicon.png" 
                    alt="{appData.name} Logo"
                    class="w-full h-full object-contain rounded-full hover:animate-spin"
                />
            </div>
            <span>{appData.name}</span>
        </a>
    </div>

    <div class="flex-none gap-2">
        <!-- Search -->
         <!-- TODO: ADD SOME SEARCH BAR COMPONENT! -->
        <!-- {#if isSearchActive}
            <div class="form-control">
                <input
                    type="text"
                    placeholder="Search..."
                    bind:value={searchQuery}
                    onkeydown={handleSearch}
                    class="input input-bordered"
                />
            </div>
        {:else}
            <button 
                class="btn btn-ghost btn-circle"
                onclick={() => isSearchActive = true}
                aria-label="Search"
            >
                <MagnifyingGlass size={20} weight="bold" />
            </button>
        {/if} -->

        <!-- Authenticated Content -->
        {#if authStore.isAuthenticated}
            <!-- Notifications -->
            <!-- <div class="dropdown dropdown-end">
                <button class="btn btn-ghost btn-circle" aria-label="Notifications">
                    <div class="indicator">
                        <Bell size={20} weight="bold" />
                        {#if notificationCount > 0}
                            <span class="badge badge-sm indicator-item">{notificationCount}</span>
                        {/if}
                    </div>
                </button>
            </div> -->

            <!-- User Menu -->
            <div class="dropdown dropdown-end">
                <button class="btn btn-ghost btn-circle avatar" aria-label="User menu">
                    <div class="w-10 rounded-full">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed={authStore.profile?.fullName}" alt="User avatar" />
                    </div>
                </button>
                <ul class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                    <li><a href="/profile"><User size={16} weight="bold" /> Profile</a></li>
                    <li><a href="/profile/settings"><Gear size={16} weight="bold" /> Settings</a></li>
                    <li><button onclick={() => authStore.clearAuth()}><SignOut size={16} weight="bold" /> Logout</button></li>
                </ul>
            </div>
        {:else}
            <!-- Login Button -->
            <button class="btn btn-primary btn-sm" onclick={() => showLoginModal = true}>
                <SignIn size={16} weight="bold" />
                Sign In
            </button>
        {/if}
    </div>
</nav>

<!-- Login Modal -->
{#if showLoginModal}
    <div class="modal modal-open">
        <div class="modal-box p-0 bg-transparent shadow-none">
            <SignInCard />
        </div>
        <button class="modal-backdrop" onclick={() => showLoginModal = false}>
            <span class="sr-only">Close</span>
        </button>
    </div>
{/if}