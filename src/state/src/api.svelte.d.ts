/**
 * API connection state and configuration
 */
export type ConnectionState = "connected" | "connecting" | "disconnected";
export declare class ApiStore {
  #private;
  url: string;
  version: string;
  connectionState: ConnectionState;
  isConnected: boolean;
  isLoading: boolean;
  get URL(): string;
  get VERSION(): string;
  get IS_CONNECTED(): boolean;
  get IS_LOADING(): boolean;
  /**
   * Reconnect to the API
   */
  reconnect(): Promise<void>;
  /**
   * Initialize API settings
   */
  init(
    url: string,
    version?: string,
    healthCheck?: () => Promise<boolean>,
  ): void;
}
export declare function createApiStore(): ApiStore;
export declare function getApiStore(): ApiStore;
