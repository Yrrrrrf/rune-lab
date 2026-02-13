<script lang="ts">
    import {
        CurrencySelector,
        LanguageSelector,
        ThemeSelector,
    } from "$lib/index.ts";
    import * as m from "$lib/paraglide/messages.js";

    let {
        showFullSelectors = true,
        filteredThemes = ["light", "dark", "cyberpunk", "synthwave", "retro"],
        filteredCurrencies = ["USD", "EUR", "MXN"],
        filteredLanguages = ["en", "es", "fr"],
    } = $props();
</script>

<section class="flex flex-col items-center gap-12 w-full max-w-4xl mx-auto">
    <!-- Primary Settings (Filtered) -->
    <div
        class="flex flex-wrap gap-4 justify-center items-center bg-base-200 p-8 rounded-3xl shadow-inner w-full border border-base-300/50"
    >
        <div class="flex flex-col items-center gap-3">
            <span
                class="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]"
                >{m.themes()}</span
            >
            <ThemeSelector themes={filteredThemes} />
        </div>

        <div class="divider divider-horizontal hidden sm:flex"></div>

        <div class="flex flex-col items-center gap-3">
            <span
                class="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]"
                >{m.currency()}</span
            >
            <CurrencySelector codes={filteredCurrencies} />
        </div>

        <div class="divider divider-horizontal hidden sm:flex"></div>

        <div class="flex flex-col items-center gap-3">
            <span
                class="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]"
                >{m.languages()}</span
            >
            <LanguageSelector languages={filteredLanguages} />
        </div>
    </div>

    {#if showFullSelectors}
        <!-- Secondary Settings (All Options) -->
        <div class="flex flex-col items-center gap-4">
            <span
                class="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] italic"
                >{m.extended_controls()}</span
            >
            <div
                class="flex gap-3 opacity-60 scale-95 transition-all duration-300 hover:opacity-100 hover:scale-100"
            >
                <div class="tooltip" data-tip={m.all_themes()}>
                    <ThemeSelector />
                </div>
                <div class="tooltip" data-tip={m.all_currencies()}>
                    <CurrencySelector />
                </div>
                <div class="tooltip" data-tip={m.all_languages()}>
                    <LanguageSelector />
                </div>
            </div>
        </div>
    {/if}
</section>
