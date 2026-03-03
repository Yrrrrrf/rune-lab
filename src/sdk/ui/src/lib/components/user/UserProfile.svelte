<!--
  UserProfile — Richer user identity card.
  Composes UserAvatar + name/role/email.
  Zero domain knowledge.
-->
<script module lang="ts">
    export interface UserProfileProps {
        /** User's display name */
        name: string;
        /** User's email address */
        email?: string;
        /** User's role or title */
        role?: string;
        /** URL to avatar image */
        avatar_url?: string;
        /** Size variant */
        size?: "sm" | "md" | "lg";
        /** Display variant */
        variant?: "card" | "trigger";
    }
</script>

<script lang="ts">
    import UserAvatar from "./UserAvatar.svelte";

    let {
        name,
        email,
        role,
        avatar_url,
        size = "md",
        variant = "card",
    }: UserProfileProps = $props();

    const avatarSize = $derived(
        size === "sm" ? "sm" : size === "lg" ? "lg" : "md",
    );

    const textSizes = $derived({
        name:
            size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base",
        meta: size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs",
    });
</script>

{#if variant === "trigger"}
    <!-- Compact trigger variant — for navbar dropdowns -->
    <div
        class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
    >
        <UserAvatar {name} {avatar_url} size={avatarSize} />
        <div class="flex flex-col leading-tight min-w-0">
            <span class="{textSizes.name} font-medium truncate">{name}</span>
            {#if role}
                <span class="{textSizes.meta} text-base-content/60 truncate"
                    >{role}</span
                >
            {/if}
        </div>
    </div>
{:else}
    <!-- Card variant — for profile pages / settings -->
    <div class="flex items-center gap-3 p-3 rounded-box bg-base-200/50">
        <UserAvatar {name} {avatar_url} size={avatarSize} />
        <div class="flex flex-col leading-tight min-w-0">
            <span class="{textSizes.name} font-semibold truncate">{name}</span>
            {#if role}
                <span class="{textSizes.meta} text-base-content/60 truncate"
                    >{role}</span
                >
            {/if}
            {#if email}
                <span class="{textSizes.meta} text-base-content/40 truncate"
                    >{email}</span
                >
            {/if}
        </div>
    </div>
{/if}
