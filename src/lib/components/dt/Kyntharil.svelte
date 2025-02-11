<!-- Kyntharil (from Old Norse "kyn" = kind, kin + suffix -tharil suggesting evolution) -->
<!-- src/lib/components/dt/Kyntharil.svelte -->
<script lang="ts">
    import { Gear, Database, User, X } from 'phosphor-svelte';
    import { appData } from '$lib/stores/app.svelte.js';
    // import { apiStore } from '$lib/stores/api.svelte.js';
    import { authStore } from '$lib/stores/auth.svelte.js';

    // Local state management with runes
    let isOpen = $state(false);
    let activeTab = $state('app');
    let testApiConnection = $state(false);
    let showToast = $state(false);
    let toastMessage = $state('');
    let toastType = $state<'success' | 'error'>('success');

    // // Form states using runes
    // let appForm = $state({
    //     name: appData.name,
    //     version: appData.version,
    //     description: appData.description,
    //     author: appData.author
    // });

    // let apiForm = $state({
    //     URL: apiStore.URL,
    //     VERSION: apiStore.VERSION,
    //     TIMEOUT: apiStore.TIMEOUT
    // });

    // let authForm = $state({
    //     id: authStore.user?.id || '',
    //     name: authStore.user?.name || '',
    //     email: authStore.user?.email || '',
    //     role: authStore.user?.role || 'user'
    // });

    // Toast handler
    function displayToast(message: string, type: 'success' | 'error' = 'success') {
        toastMessage = message;
        toastType = type;
        showToast = true;
        setTimeout(() => showToast = false, 3000);
    }

    // // Form submission handlers
    // function handleAppSubmit() {
    //     appData.init(appForm);
    //     displayToast('App settings updated successfully');
    // }

    // async function handleApiSubmit() {
    //     apiStore.init(apiForm);
    //     if (testApiConnection) {
    //         try {
    //             await apiStore.checkConnection();
    //             displayToast(
    //                 apiStore.IS_CONNECTED ? 'API connected successfully' : 'API connection failed', 
    //                 apiStore.IS_CONNECTED ? 'success' : 'error'
    //             );
    //         } catch (error) {
    //             displayToast('API connection check failed', 'error');
    //         }
    //     }
    // }

    // function handleAuthSubmit() {
    //     if (authStore.isAuthenticated) {
    //         authStore.login({
    //             id: authForm.id,
    //             name: authForm.name,
    //             email: authForm.email,
    //             role: authForm.role as 'admin' | 'staff' | 'user'
    //         });
    //         displayToast('Auth settings updated successfully');
    //     } else {
    //         displayToast('Please log in first', 'error');
    //     }
    // }

    // Tab configuration
    const tabs = [
        { id: 'app', icon: Gear, label: 'App Settings' },
        { id: 'api', icon: Database, label: 'API Configuration' },
        { id: 'auth', icon: User, label: 'Auth Management' }
    ];
</script>

<!-- <div class="fixed bottom-4 right-4 z-50"> -->
    <!-- Toggle Button -->
    <button
        class="btn btn-circle btn-lg btn-primary"
        onclick={() => isOpen = !isOpen}
        aria-label="Toggle Store Manager"
    >
        <Gear size={24} class={isOpen ? 'animate-spin' : ''} />
    </button>
