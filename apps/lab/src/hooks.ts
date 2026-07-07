import { deLocalizeUrl } from "$lib/i18n/messages.ts";

export const reroute = (request) => deLocalizeUrl(request.url).pathname;
