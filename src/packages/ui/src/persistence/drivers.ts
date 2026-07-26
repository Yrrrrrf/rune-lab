import { BROWSER as browser } from "esm-env";
import type { PersistenceDriver } from "rune-lab/core";

const browserOnly = (real: PersistenceDriver): PersistenceDriver => ({
  get: (key: string) => (browser ? real.get(key) : null),
  set: (key: string, value: string) => {
    if (browser) real.set(key, value);
  },
  remove: (key: string) => {
    if (browser) real.remove(key);
  },
});

export const localStorageDriver: PersistenceDriver = browserOnly({
  get: (key: string) => globalThis.localStorage.getItem(key),
  set: (key: string, value: string) =>
    globalThis.localStorage.setItem(key, value),
  remove: (key: string) => globalThis.localStorage.removeItem(key),
});

export const sessionStorageDriver: PersistenceDriver = browserOnly({
  get: (key: string) => globalThis.sessionStorage.getItem(key),
  set: (key: string, value: string) =>
    globalThis.sessionStorage.setItem(key, value),
  remove: (key: string) => globalThis.sessionStorage.removeItem(key),
});

export const createCookieDriver = (
  options: {
    path?: string;
    maxAge?: number;
    sameSite?: "Lax" | "Strict" | "None";
    secure?: boolean;
  } = {},
): PersistenceDriver =>
  browserOnly({
    get: (key: string) => {
      const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
      return match ? decodeURIComponent(match[2]) : null;
    },
    set: (key: string, value: string) => {
      let cookie = `${key}=${encodeURIComponent(value)}`;
      if (options.path) cookie += `; path=${options.path}`;
      if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
      if (options.sameSite) cookie += `; samesite=${options.sameSite}`;
      if (options.secure) cookie += "; Secure";
      document.cookie = cookie;
    },
    remove: (key: string) => {
      document.cookie = `${key}=; max-age=0; path=${options.path || "/"}`;
    },
  });

/** Default cookie driver singleton (path='/') */
export const cookieDriver: PersistenceDriver = createCookieDriver({
  path: "/",
});
