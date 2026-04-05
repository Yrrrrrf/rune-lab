import type { Handle } from "@sveltejs/kit";
import { paraglideMiddleware } from "./lib/i18n/paraglide/server.js";

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;

    return resolve(event, {
      transformPageChunk: ({ html }) =>
        html.replace("%paraglide.lang%", locale),
    });
  });

export const handle: Handle = handleParaglide;
