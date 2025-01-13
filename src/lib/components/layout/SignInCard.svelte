<script lang="ts">
    import { appData } from '$lib/stores/app.svelte';
    import { fly } from 'svelte/transition';
    import { Envelope, Pill, Eye, EyeSlash } from 'phosphor-svelte';

    
    let showPassword = $state(false);
    let signInData = $state({ email: '', password: '' });


    function logIn(signInData: { email: string, password: string }) {
        console.log(signInData);
    }
</script>

<div class="card w-96 bg-base-100/90 shadow-xl backdrop-blur-sm" in:fly={{ y: -20, duration: 500 }}>
    <div class="card-body">
        <!-- Header -->
        <div class="text-center space-y-2 mb-6">
            <div class="flex justify-center mb-4">
                <Pill class="h-12 w-12 text-primary" />
            </div>
            <h2 class="card-title text-3xl justify-center">{appData.name}</h2>
            <p class="text-base-content/60">Sign in to continue</p>
        </div>

        <!-- Sign In Form -->
        <form 
            class="space-y-4" 
            onsubmit={(e) => { e.preventDefault(); logIn(signInData); }}
        >
            <div class="form-control">
                <label class="label" for="email">Email</label>
                <div class="relative">
                    <input 
                        type="email"
                        class="input input-bordered w-full pr-10"
                        placeholder="m@example.com"
                        bind:value={signInData.email}
                        required
                    />
                    <Envelope class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                </div>
            </div>

            <div class="form-control">
                <label class="label" for="password">Password</label>
                <div class="relative">
                    <input 
                        type={showPassword ? 'text' : 'password'}
                        class="input input-bordered w-full pr-10"
                        bind:value={signInData.password}
                        required
                    />
                    <button 
                        type="button"
                        class="btn btn-ghost btn-sm btn-circle absolute right-2 top-1/2 -translate-y-1/2"
                        onclick={() => showPassword = !showPassword}
                    >
                        {#if showPassword}
                            <EyeSlash class="w-5 h-5" />
                        {:else}
                            <Eye class="w-5 h-5" />
                        {/if}
                    </button>
                </div>
            </div>

            <button class="btn btn-primary w-full">Sign In</button>
        </form>
    </div>
</div>