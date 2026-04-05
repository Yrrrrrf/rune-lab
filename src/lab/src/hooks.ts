import { deLocalizeUrl } from "./lib/i18n/paraglide/runtime.js";

export const reroute = (request) => deLocalizeUrl(request.url).pathname;
