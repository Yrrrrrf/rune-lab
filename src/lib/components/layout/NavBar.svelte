<script lang="ts">
    import { 
        MagnifyingGlass, 
        Gear, 
        User, 
        // Pills, 
        // Activity,
        SignIn,
        SignOut,
        Bell,
        ShoppingCart
    } from 'phosphor-svelte';
    
    // Import stores
    import { appData } from '$lib/stores/app.svelte.js';
    import { authStore } from '$lib/stores/auth.svelte.js';
    import { themeStore } from '$lib/stores/theme.svelte.js';

    // Optional components you can import
    import ThemeSelector from './ThemeSelector.svelte';

    // State using Runes
    let isSearchActive = $state(false);
    let searchQuery = $state('');
    let notificationCount = $state(3);

    // Navigation items with proper typing
    type NavItem = {
        icon: any; // PhosphorIcon type
        label: string;
        path: string;
        requiresAuth: boolean;
    };

    function handleSearch(e: KeyboardEvent) {
        if (e.key === 'Enter' && searchQuery.trim()) {
            // Handle search - you might want to emit an event
            isSearchActive = false;
        } else if (e.key === 'Escape') {
            isSearchActive = false;
        }
    }

    function handleLogin() {
        // Example login
        authStore.login({
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'staff'
        });
    }
</script>

<nav class="navbar bg-base-100">
    <!-- Logo Section -->
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
        {#if isSearchActive}
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
        {/if}

        <!-- Authenticated Content -->
        {#if authStore.isAuthenticated}
            <!-- Notifications -->
            <div class="dropdown dropdown-end">
                <button class="btn btn-ghost btn-circle" aria-label="Notifications">
                    <div class="indicator">
                        <Bell size={20} weight="bold" />
                        {#if notificationCount > 0}
                            <span class="badge badge-sm indicator-item">{notificationCount}</span>
                        {/if}
                    </div>
                </button>
            </div>

            <!-- User Menu -->
            <div class="dropdown dropdown-end">
                <button class="btn btn-ghost btn-circle avatar" aria-label="User menu">
                    <div class="w-10 rounded-full">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed={authStore.user?.name}" alt="User avatar" />
                    </div>
                </button>
                <ul class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                    <li><a href="/profile"><User size={16} weight="bold" /> Profile</a></li>
                    <li><a href="/settings"><Gear size={16} weight="bold" /> Settings</a></li>
                    <li><button onclick={() => authStore.logout()}><SignOut size={16} weight="bold" /> Logout</button></li>
                </ul>
            </div>
        {:else}
            <!-- Login Button -->
            <button class="btn btn-primary btn-sm" onclick={handleLogin}>
                <SignIn size={16} weight="bold" />
                Sign In
            </button>
        {/if}

        <!-- Theme Selector -->
        <ThemeSelector />
    </div>
</nav>