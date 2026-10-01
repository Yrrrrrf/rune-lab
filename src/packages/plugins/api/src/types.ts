import type { FetcherOptions, StandardSchemaV1 } from "up-fetch";

/** Standard up-fetch options, with base URL owned by the selected environment. */
export type ApiRequestOptions<T = unknown> = Omit<
	FetcherOptions<typeof fetch, StandardSchemaV1<unknown, T>, T, unknown>,
	"baseUrl"
>;
export type ApiHeaders = NonNullable<ApiRequestOptions["headers"]>;
export type ApiErrorKind =
	| "http"
	| "validation"
	| "timeout"
	| "aborted"
	| "network"
	| "configuration"
	| "unknown";
export interface ApiFailure {
	readonly kind: ApiErrorKind;
	readonly message: string;
	readonly status?: number;
	readonly issues?: readonly StandardSchemaV1.Issue[];
	readonly cause: unknown;
}
export type HealthStatus =
	| "unknown"
	| "healthy"
	| "degraded"
	| "unhealthy"
	| "unreachable"
	| "unauthorized";
export interface HealthResult {
	status: "healthy" | "degraded" | "unhealthy";
	message?: string;
	version?: string;
}
export interface HealthSnapshot {
	readonly status: HealthStatus;
	readonly checking: boolean;
	readonly checkedAt: number | null;
	readonly latencyMs: number | null;
	readonly message?: string;
	readonly version?: string;
	readonly error?: ApiFailure;
}
export interface ApiHealthConfig {
	/** Relative to the environment's baseUrl, including when it starts with '/'. */
	path: string;
	timeoutMs?: number;
	/** Defaults to a successful HTTP response meaning healthy. Interpret dependency status here. */
	interpret?: (data: unknown) => HealthResult | Promise<HealthResult>;
}
export interface ApiRawExecution {
	path: string;
	/** Defaults to { query, params }. The server must implement this contract. */
	body?: (query: string, params: Record<string, unknown>) => unknown;
}
export interface ApiEnvironment {
	id: string;
	label: string;
	baseUrl: string;
	docsUrl?: string;
	/** False disables the global configuration for this environment. */
	health?: ApiHealthConfig | false;
	execRaw?: ApiRawExecution | false;
	headers?: ApiHeaders | (() => ApiHeaders | Promise<ApiHeaders>);
	getToken?: () =>
		| string
		| null
		| undefined
		| Promise<string | null | undefined>;
	credentials?: RequestCredentials;
}
export interface ApiConfig {
	environments: readonly ApiEnvironment[];
	initialEnvironment?: string;
	/** Inject SvelteKit's request-scoped fetch or a test transport here. */
	fetch?: typeof fetch;
	/** Resolves relative base URLs outside the browser; must be an HTTP(S) origin. */
	origin?: string;
	timeoutMs?: number;
	health?: ApiHealthConfig;
	execRaw?: ApiRawExecution;
	/** One initial health check when the browser runtime mounts; defaults to true. */
	autoCheck?: boolean;
	/** Repeated health checks; defaults to false. */
	monitoring?: boolean;
	pollIntervalMs?: number;
	/** Only current environment and monitoring are saved; defaults to true. */
	persist?: boolean;
}
export interface ApiPersistence {
	get(key: string): string | null | Promise<string | null>;
	set(key: string, value: string): void | Promise<void>;
}
export interface ApiSnapshot {
	readonly environmentId: string | null;
	readonly pending: number;
	readonly monitoring: boolean;
	readonly health: HealthSnapshot;
	readonly lastError: ApiFailure | null;
	readonly lastSuccessAt: number | null;
	readonly persistenceError: string | null;
}
export interface ApiEnvironmentChange {
	previous: string | null;
	current: string;
}
