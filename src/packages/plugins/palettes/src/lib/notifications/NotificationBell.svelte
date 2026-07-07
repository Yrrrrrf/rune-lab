<!--
  NotificationBell — Universal notification indicator.
  Purely presentational: takes props, emits events, knows nothing about routing or domain.
-->
<script module lang="ts">
    export interface NotificationBellProps {
        /** Number of unread notifications (badge hides when 0) */
        unreadCount?: number;
        /** Click handler */
        onclick?: () => void;
        /** Enable shake animation to draw attention */
        animate?: boolean;
    }
</script>

<script lang="ts">
    let {
        unreadCount = 0,
        onclick,
        animate = false,
    }: NotificationBellProps = $props();

    const showBadge = $derived(unreadCount > 0);
    const badgeText = $derived(unreadCount > 99 ? "99+" : String(unreadCount));
</script>

<button
    class="btn btn-ghost btn-sm btn-square relative"
    class:rl-bell-animate={animate && showBadge}
    {onclick}
    aria-label={showBadge
        ? `Notifications — ${unreadCount} unread`
        : "Notifications"}
>
    <!-- Bell Icon (inline SVG) -->
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-5 h-5"
    >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>

    <!-- Badge -->
    {#if showBadge}
        <span
            class="absolute -top-1 -right-1 badge badge-error badge-xs text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center"
        >
            {badgeText}
        </span>
    {/if}
</button>

<style>
    @keyframes rl-bell-shake {
        0%,
        100% {
            transform: rotate(0deg);
        }
        10%,
        30%,
        50%,
        70%,
        90% {
            transform: rotate(-6deg);
        }
        20%,
        40%,
        60%,
        80% {
            transform: rotate(6deg);
        }
    }

    .rl-bell-animate {
        animation: rl-bell-shake 0.8s ease-in-out infinite;
        animation-delay: 2s;
    }

    .rl-bell-animate:hover {
        animation: none;
    }
</style>
