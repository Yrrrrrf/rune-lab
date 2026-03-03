<!--
  UserAvatar — Universal user identity primitive.
  Renders avatar image or falls back to generated initials.
  Zero domain knowledge.
-->
<script module lang="ts">
    export interface UserAvatarProps {
        /** User's display name (used for initials fallback) */
        name: string;
        /** URL to avatar image */
        avatar_url?: string;
        /** Size variant */
        size?: "xs" | "sm" | "md" | "lg";
        /** Show online indicator */
        online?: boolean;
    }
</script>

<script lang="ts">
    let { name, avatar_url, size = "md", online }: UserAvatarProps = $props();

    const sizeClasses: Record<string, string> = {
        xs: "w-6 h-6 text-[10px]",
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-14 h-14 text-lg",
    };

    const initials = $derived(
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0].toUpperCase())
            .join(""),
    );

    /**
     * Deterministic color from name — generates a consistent hue
     * so the same user always gets the same color
     */
    const bgHue = $derived(
        name.split("").reduce((hash, char) => {
            return char.charCodeAt(0) + ((hash << 5) - hash);
        }, 0) % 360,
    );

    const bgColor = $derived(`hsl(${Math.abs(bgHue)}, 60%, 45%)`);
</script>

<div class="avatar placeholder" class:online>
    <div
        class="rounded-full {sizeClasses[size]}"
        style={avatar_url ? undefined : `background-color: ${bgColor}`}
    >
        {#if avatar_url}
            <img
                src={avatar_url}
                alt={`${name}'s avatar`}
                class="rounded-full object-cover"
            />
        {:else}
            <span class="text-white font-semibold select-none">{initials}</span>
        {/if}
    </div>
</div>
