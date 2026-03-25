import type { PersistenceDriver } from "@rune-lab/core";
export declare function createInMemoryDriver(): PersistenceDriver;
export declare const inMemoryDriver: PersistenceDriver;
export declare const localStorageDriver: PersistenceDriver;
export declare const sessionStorageDriver: PersistenceDriver;
export declare const createCookieDriver: (options?: {
  path?: string;
  maxAge?: number;
  sameSite?: "Lax" | "Strict" | "None";
}) => PersistenceDriver;
/** Default cookie driver singleton (path='/') */
export declare const cookieDriver: PersistenceDriver;
