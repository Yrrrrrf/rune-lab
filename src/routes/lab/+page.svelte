<script lang="ts">
    import LabHeader from "./LabHeader.svelte";
    import StoresMirror from "./StoresMirror.svelte";
    import InteractionDeck from "./InteractionDeck.svelte";
    import ComponentsPanel from "./ComponentsPanel.svelte";
    import PersistenceInspector from "./PersistenceInspector.svelte";
</script>

<div class="flex flex-col h-full w-full overflow-hidden">
    <!-- Header Bar -->
    <LabHeader />

    <!-- 4-Quadrant Grid -->
    <div
        class="flex-1 grid grid-cols-1 lg:grid-cols-2 grid-rows-2 min-h-0 overflow-hidden"
    >
        <!-- Q1: Stores Mirror (top-left) -->
        <div class="border-r border-b border-base-content/5 overflow-hidden">
            <StoresMirror />
        </div>

        <!-- Q2: Interaction Deck (top-right) -->
        <div class="border-b border-base-content/5 overflow-hidden">
            <InteractionDeck />
        </div>

        <!-- Q3: Components (bottom-left) -->
        <div class="border-r border-base-content/5 overflow-hidden">
            <ComponentsPanel />
        </div>

        <!-- Q4: Persistence Inspector (bottom-right) -->
        <div class="overflow-hidden">
            <PersistenceInspector />
        </div>
    </div>
</div>
