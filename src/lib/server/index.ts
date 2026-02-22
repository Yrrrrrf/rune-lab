import type { Handle } from "@sveltejs/kit";

/**
 * A SvelteKit Handle hook that prevents Flash of Unstyled Content (FOUC)
 * by injecting the saved theme straight into the HTML before it leaves the server.
 * 
 * @example
 * ```ts
 * // src/hooks.server.ts
 * import { sequence } from "@sveltejs/kit/hooks";
 * import { runeLabThemeHandler } from "rune-lab/server";
 * 
 * export const handle = sequence(runeLabThemeHandler);
 * ```
 */
export const runeLabThemeHandler: Handle = async ({ event, resolve }) => {
    // Assuming 'theme' is the default storageKey mapped from cookieDriver
    const theme = event.cookies.get("theme") || "system";

    return resolve(event, {
        transformPageChunk: ({ html }) =>
            html.replace('<html', `<html data-theme="${theme}"`)
    });
};
