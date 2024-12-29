<!-- src/lib/components/stores/StoreManager.svelte -->
<script lang="ts">
    import { Gear, Database, User, Key, X, Check } from 'phosphor-svelte';
    import { appData } from '$lib/stores/app.svelte.js';
    import { apiStore } from '$lib/stores/api.svelte.js';
    import { authStore } from '$lib/stores/auth.svelte.js';

    // Local state management with runes
    let isOpen = $state(false);
    let activeTab = $state('app');
    let testApiConnection = $state(false);
    let showToast = $state(false);
    let toastMessage = $state('');
    let toastType = $state<'success' | 'error'>('success');

    // Form states using runes
    let appForm = $state({
        name: appData.name,
        version: appData.version,
        description: appData.description,
        author: appData.author
    });

    let apiForm = $state({
        URL: apiStore.URL,
        VERSION: apiStore.VERSION,
        TIMEOUT: apiStore.TIMEOUT
    });

    let authForm = $state({
        id: authStore.user?.id || '',
        name: authStore.user?.name || '',
        email: authStore.user?.email || '',
        role: authStore.user?.role || 'user'
    });

    // Toast handler
    function displayToast(message: string, type: 'success' | 'error' = 'success') {
        toastMessage = message;
        toastType = type;
        showToast = true;
        setTimeout(() => showToast = false, 3000);
    }

    // Form submission handlers
    function handleAppSubmit() {
        appData.init(appForm);
        displayToast('App settings updated successfully');
    }

    async function handleApiSubmit() {
        apiStore.init(apiForm);
        if (testApiConnection) {
            try {
                await apiStore.checkConnection();
                displayToast(
                    apiStore.IS_CONNECTED ? 'API connected successfully' : 'API connection failed', 
                    apiStore.IS_CONNECTED ? 'success' : 'error'
                );
            } catch (error) {
                displayToast('API connection check failed', 'error');
            }
        }
    }

    function handleAuthSubmit() {
        if (authStore.isAuthenticated) {
            authStore.login({
                id: authForm.id,
                name: authForm.name,
                email: authForm.email,
                role: authForm.role as 'admin' | 'staff' | 'user'
            });
            displayToast('Auth settings updated successfully');
        } else {
            displayToast('Please log in first', 'error');
        }
    }

    // Tab configuration
    const tabs = [
        { id: 'app', icon: Gear, label: 'App Settings' },
        { id: 'api', icon: Database, label: 'API Configuration' },
        { id: 'auth', icon: User, label: 'Auth Management' }
    ];
</script>

<div class="fixed bottom-4 right-4 z-50">
    <!-- Toggle Button -->
    <button
        class="btn btn-circle btn-lg btn-primary"
        onclick={() => isOpen = !isOpen}
        aria-label="Toggle Store Manager"
    >
        <Gear size={24} class={isOpen ? 'animate-spin' : ''} />
    </button>

    <!-- Manager Panel -->
    {#if isOpen}
        <div class="fixed inset-0 bg-base-300 bg-opacity-50 backdrop-blur-sm">
            <div class="absolute right-0 top-0 h-full w-96 bg-base-100 shadow-xl">
                <!-- Header -->
                <div class="flex items-center justify-between p-4 border-b border-base-200">
                    <h2 class="text-xl font-bold">Store Manager</h2>
                    <button
                        class="btn btn-ghost btn-circle"
                        onclick={() => isOpen = false}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <!-- Tabs -->
                <div class="tabs tabs-boxed m-4">
                    {#each tabs as tab}
                        <button
                            class="tab flex-1 {activeTab === tab.id ? 'tab-active' : ''}"
                            onclick={() => activeTab = tab.id}
                        >
                            <tab.icon size={16} class="mr-2" />
                            {tab.label}
                        </button>
                    {/each}
                </div>

                <!-- Content -->
                <div class="p-4">
                    {#if activeTab === 'app'}
                        <form class="space-y-4" onsubmit={handleAppSubmit}>
                            <div class="form-control">
                                <label class="label" for="app-name">
                                    <span class="label-text">App Name</span>
                                </label>
                                <input
                                    id="app-name"
                                    type="text"
                                    class="input input-bordered"
                                    bind:value={appForm.name}
                                />
                            </div>

                            <div class="form-control">
                                <label class="label" for="app-version">
                                    <span class="label-text">Version</span>
                                </label>
                                <input
                                    id="app-version"
                                    type="text"
                                    class="input input-bordered"
                                    bind:value={appForm.version}
                                />
                            </div>

                            <div class="form-control">
                                <label class="label" for="app-description">
                                    <span class="label-text">Description</span>
                                </label>
                            </div>

                            <div class="form-control">
                                <label class="label" for="app-author">
                                    <span class="label-text">Author</span>
                                </label>
                                <input
                                    id="app-author"
                                    type="text"
                                    class="input input-bordered"
                                    bind:value={appForm.author}
                                />
                            </div>

                            <button type="submit" class="btn btn-primary w-full">
                                Update App Settings
                            </button>
                        </form>

                    {:else if activeTab === 'api'}
                        <form class="space-y-4" onsubmit={handleApiSubmit}>
                            <div class="form-control">
                                <label class="label" for="api-url">
                                    <span class="label-text">API URL</span>
                                </label>
                                <input
                                    id="api-url"
                                    type="url"
                                    class="input input-bordered"
                                    bind:value={apiForm.URL}
                                />
                            </div>

                            <div class="form-control">
                                <label class="label" for="api-version">
                                    <span class="label-text">API Version</span>
                                </label>
                                <input
                                    id="api-version"
                                    type="text"
                                    class="input input-bordered"
                                    bind:value={apiForm.VERSION}
                                />
                            </div>

                            <div class="form-control">
                                <label class="label" for="api-timeout">
                                    <span class="label-text">Timeout (ms)</span>
                                </label>
                                <input
                                    id="api-timeout"
                                    type="number"
                                    class="input input-bordered"
                                    bind:value={apiForm.TIMEOUT}
                                />
                            </div>

                            <div class="form-control">
                                <label class="label cursor-pointer">
                                    <span class="label-text">Test connection after update</span>
                                    <input
                                        type="checkbox"
                                        class="toggle toggle-primary"
                                        bind:checked={testApiConnection}
                                    />
                                </label>
                            </div>

                            <div class="flex gap-2">
                                <button type="submit" class="btn btn-primary flex-1">
                                    Update API Settings
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-outline"
                                    onclick={() => apiStore.checkConnection()}
                                >
                                    Test Connection
                                </button>
                            </div>
                        </form>

                    {:else if activeTab === 'auth'}
                        <form class="space-y-4" onsubmit={handleAuthSubmit}>
                            <div class="form-control">
                                <label class="label" for="auth-id">
                                    <span class="label-text">User ID</span>
                                </label>
                                <input
                                    id="auth-id"
                                    type="text"
                                    class="input input-bordered"
                                    bind:value={authForm.id}
                                />
                            </div>

                            <div class="form-control">
                                <label class="label" for="auth-name">
                                    <span class="label-text">Name</span>
                                </label>
                                <input
                                    id="auth-name"
                                    type="text"
                                    class="input input-bordered"
                                    bind:value={authForm.name}
                                />
                            </div>

                            <div class="form-control">
                                <label class="label" for="auth-email">
                                    <span class="label-text">Email</span>
                                </label>
                                <input
                                    id="auth-email"
                                    type="email"
                                    class="input input-bordered"
                                    bind:value={authForm.email}
                                />
                            </div>

                            <div class="form-control">
                                <label class="label" for="auth-role">
                                    <span class="label-text">Role</span>
                                </label>
                                <select
                                    id="auth-role"
                                    class="select select-bordered"
                                    bind:value={authForm.role}
                                >
                                    <option value="user">User</option>
                                    <option value="staff">Staff</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div class="flex gap-2">
                                <button type="submit" class="btn btn-primary flex-1">
                                    Update Auth Settings
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-outline"
                                    onclick={() => authStore.logout()}
                                >
                                    Logout
                                </button>
                            </div>
                        </form>
                    {/if}
                </div>

                <!-- Status Bar -->
                <div class="absolute bottom-0 w-full p-4 bg-base-200 border-t border-base-300">
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center gap-2">
                            <div class="badge badge-sm {apiStore.IS_CONNECTED ? 'badge-success' : 'badge-error'}">
                                API {apiStore.IS_CONNECTED ? 'Connected' : 'Disconnected'}
                            </div>
                            <div class="badge badge-sm {authStore.isAuthenticated ? 'badge-success' : 'badge-error'}">
                                {authStore.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                            </div>
                        </div>
                        <span class="opacity-50">v{appData.version}</span>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Toast Notification -->
    {#if showToast}
        <div class="toast toast-end">
            <div class="alert alert-{toastType}">
                <span>{toastMessage}</span>
            </div>
        </div>
    {/if}
</div>
