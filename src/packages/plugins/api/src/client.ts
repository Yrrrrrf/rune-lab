import { up, type StandardSchemaV1 } from "up-fetch";
import { ApiConfigurationError, describeApiError } from "./errors.ts";
import { resolveApiUrl } from "./url.ts";
import type {
	ApiConfig,
	ApiEnvironment,
	ApiEnvironmentChange,
	ApiHeaders,
	ApiHealthConfig,
	ApiPersistence,
	ApiRawExecution,
	ApiRequestOptions,
	ApiSnapshot,
	HealthResult,
	HealthSnapshot,
} from "./types.ts";

const unknownHealth = (): HealthSnapshot =>
	Object.freeze({
		status: "unknown",
		checking: false,
		checkedAt: null,
		latencyMs: null,
	});
const aborted = (message: string) => new DOMException(message, "AbortError");

function validateConfig(
	input: unknown,
): asserts input is ApiConfig | undefined {
	if (input === undefined) return;
	if (
		!input ||
		typeof input !== "object" ||
		!Array.isArray((input as ApiConfig).environments)
	) {
		throw new ApiConfigurationError(
			"API configuration requires an environments array.",
		);
	}
	const config = input as ApiConfig;
	const ids = new Set<string>();
	for (const environment of config.environments) {
		if (
			!environment ||
			typeof environment.id !== "string" ||
			!environment.id.trim() ||
			typeof environment.label !== "string" ||
			!environment.label.trim() ||
			typeof environment.baseUrl !== "string" ||
			!environment.baseUrl.trim() ||
			ids.has(environment.id)
		) {
			throw new ApiConfigurationError(
				"Every API environment needs a unique id, label, and baseUrl.",
			);
		}
		ids.add(environment.id);
		// Validate relative URLs without requiring a browser during provider creation.
		resolveApiUrl(
			environment.baseUrl,
			"",
			config.origin ?? "http://relative.invalid",
		);
		if (
			environment.getToken !== undefined &&
			typeof environment.getToken !== "function"
		) {
			throw new ApiConfigurationError("getToken must be a function.");
		}
		if (environment.docsUrl) {
			const url = new URL(environment.docsUrl, "https://relative.invalid");
			if (!/^https?:$/.test(url.protocol) || url.username || url.password) {
				throw new ApiConfigurationError(
					"docsUrl must be an HTTP(S) URL or relative path.",
				);
			}
		}
		validateHealth(environment.health);
		validateRaw(environment.execRaw);
	}
	if (
		config.initialEnvironment !== undefined &&
		!ids.has(config.initialEnvironment)
	) {
		throw new ApiConfigurationError(
			"initialEnvironment is not in environments.",
		);
	}
	for (const [key, value] of [
		["timeoutMs", config.timeoutMs],
		["pollIntervalMs", config.pollIntervalMs],
	] as const) {
		if (value !== undefined && (!Number.isFinite(value) || value <= 0)) {
			throw new ApiConfigurationError(
				`${key} must be a positive finite number.`,
			);
		}
	}
	for (const key of ["autoCheck", "monitoring", "persist"] as const) {
		if (config[key] !== undefined && typeof config[key] !== "boolean") {
			throw new ApiConfigurationError(`${key} must be a boolean.`);
		}
	}
	if (config.fetch !== undefined && typeof config.fetch !== "function") {
		throw new ApiConfigurationError("fetch must be a function.");
	}
	validateHealth(config.health);
	validateRaw(config.execRaw);
}
function validateHealth(value: ApiHealthConfig | false | undefined) {
	if (value === undefined || value === false) return;
	if (
		!value ||
		typeof value.path !== "string" ||
		(value.interpret !== undefined && typeof value.interpret !== "function") ||
		(value.timeoutMs !== undefined &&
			(!Number.isFinite(value.timeoutMs) || value.timeoutMs <= 0))
	) {
		throw new ApiConfigurationError(
			"Health configuration requires a path and valid interpreter/timeout.",
		);
	}
}
function validateRaw(value: ApiRawExecution | false | undefined) {
	if (value === undefined || value === false) return;
	if (
		!value ||
		typeof value.path !== "string" ||
		(value.body !== undefined && typeof value.body !== "function")
	) {
		throw new ApiConfigurationError(
			"execRaw configuration requires a path and optional body function.",
		);
	}
}
function mergeHeaders(...sources: (ApiHeaders | undefined)[]): Headers {
	const result = new Headers();
	for (const source of sources) {
		if (!source) continue;
		if (source instanceof Headers || Array.isArray(source)) {
			new Headers(source as HeadersInit).forEach((value, key) =>
				result.set(key, value),
			);
		} else {
			for (const [key, value] of Object.entries(source)) {
				if (value === undefined || value === null) result.delete(key);
				else result.set(key, String(value));
			}
		}
	}
	return result;
}
/** up-fetch 2.6's fallback parser maps false/0/empty-string JSON to null. Preserve them. */
async function parseResponse(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) return null;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}
function raceAbort<T>(job: Promise<T>, signal: AbortSignal): Promise<T> {
	return new Promise((resolve, reject) => {
		const cancel = () => reject(signal.reason ?? aborted("Request cancelled."));
		signal.addEventListener("abort", cancel, { once: true });
		job
			.then(resolve, reject)
			.finally(() => signal.removeEventListener("abort", cancel));
		if (signal.aborted) cancel();
	});
}

/** Framework-independent, instance-scoped client. Construction never starts network work. */
export function createApiClient(
	input?: ApiConfig,
	persistence?: ApiPersistence,
) {
	validateConfig(input);
	const config = input ?? { environments: [] };
	const environments = Object.freeze(
		config.environments.map((env) =>
			Object.freeze({
				...env,
				health: env.health ? Object.freeze({ ...env.health }) : env.health,
				execRaw: env.execRaw ? Object.freeze({ ...env.execRaw }) : env.execRaw,
			}),
		),
	);
	let state: ApiSnapshot = Object.freeze({
		environmentId: config.initialEnvironment ?? environments[0]?.id ?? null,
		pending: 0,
		monitoring: config.monitoring ?? false,
		health: unknownHealth(),
		lastError: null,
		lastSuccessAt: null,
		persistenceError: null,
	});
	let disposed = false;
	let generation = 0;
	let preferencesRevision = 0;
	let healthTask: Promise<HealthSnapshot> | null = null;
	let runtimeMounted = false;
	let runtimeRevision = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let writeQueue = Promise.resolve();
	const controllers = new Set<AbortController>();
	const listeners = new Set<() => void>();
	const changeListeners = new Set<(event: ApiEnvironmentChange) => void>();
	const transport = up(
		config.fetch ??
			((...args: Parameters<typeof fetch>) => globalThis.fetch(...args)),
	);
	const active = () =>
		environments.find((env) => env.id === state.environmentId);
	const healthConfig = () => active()?.health ?? config.health;
	const rawConfig = () => active()?.execRaw ?? config.execRaw;
	const assertActive = () => {
		if (disposed) throw aborted("API client disposed.");
		const env = active();
		if (!env)
			throw new ApiConfigurationError(
				"Configure an API environment before making requests.",
			);
		return env;
	};
	function emit(patch: Partial<ApiSnapshot>) {
		if (disposed) return;
		state = Object.freeze({ ...state, ...patch });
		for (const listener of listeners) {
			try {
				listener();
			} catch {
				console.error("[rune-lab/api] State subscriber failed.");
			}
		}
	}
	function persist() {
		if (!persistence || config.persist === false || disposed) return;
		const saved = JSON.stringify({
			environmentId: state.environmentId,
			monitoring: state.monitoring,
		});
		writeQueue = writeQueue
			.then(() => persistence.set("preferences", saved))
			.then(
				() => emit({ persistenceError: null }),
				() => emit({ persistenceError: "API preferences could not be saved." }),
			);
	}
	const ready = (async () => {
		if (!persistence || config.persist === false) return;
		const revision = preferencesRevision;
		try {
			const raw = await persistence.get("preferences");
			if (!raw || disposed || revision !== preferencesRevision) return;
			const saved: unknown = JSON.parse(raw);
			if (!saved || typeof saved !== "object") return;
			const preference = saved as Record<string, unknown>;
			emit({
				environmentId: environments.some(
					(env) => env.id === preference.environmentId,
				)
					? (preference.environmentId as string)
					: state.environmentId,
				monitoring:
					typeof preference.monitoring === "boolean"
						? preference.monitoring
						: state.monitoring,
			});
		} catch {
			emit({ persistenceError: "API preferences could not be restored." });
		}
	})();

	async function perform<T>(
		path: string,
		options: ApiRequestOptions<T> = {},
		observe = true,
		expectedGeneration?: number,
	): Promise<T> {
		const invocationGeneration = expectedGeneration ?? generation;
		await ready;
		const environment = assertActive();
		if (invocationGeneration !== generation)
			throw aborted("API environment changed.");
		const epoch = generation;
		const controller = new AbortController();
		const callerSignal = options.signal;
		const cancel = () =>
			controller.abort(callerSignal?.reason ?? aborted("Request cancelled."));
		callerSignal?.addEventListener("abort", cancel, { once: true });
		if (callerSignal?.aborted) cancel();
		const deadline = options.timeout ?? config.timeoutMs ?? 10_000;
		const deadlineTimer =
			deadline > 0
				? setTimeout(
						() =>
							controller.abort(
								new DOMException("API request timed out.", "TimeoutError"),
							),
						deadline,
					)
				: undefined;
		controllers.add(controller);
		emit({ pending: state.pending + 1 });
		const current = () => !disposed && epoch === generation;
		try {
			const job = (async () => {
				const url = resolveApiUrl(environment.baseUrl, path, config.origin);
				const headers =
					typeof environment.headers === "function"
						? await environment.headers()
						: environment.headers;
				const token = await environment.getToken?.();
				controller.signal.throwIfAborted();
				const result = await transport<
					unknown,
					StandardSchemaV1<unknown, T>,
					unknown
				>(url, {
					timeout: config.timeoutMs ?? 10_000,
					credentials: environment.credentials ?? "same-origin",
					// Cross-origin redirects must not forward environment credentials.
					redirect: "error",
					...options,
					// A JS caller cannot override the selected environment with baseUrl.
					baseUrl: undefined,
					headers: mergeHeaders(
						headers,
						token ? { Authorization: `Bearer ${token}` } : undefined,
						options.headers,
					),
					signal: controller.signal,
					parseResponse: options.parseResponse ?? parseResponse,
					onRequest: async (request) => {
						controller.signal.throwIfAborted();
						await options.onRequest?.(request);
						controller.signal.throwIfAborted();
					},
					onResponse: async (response, request) => {
						controller.signal.throwIfAborted();
						await options.onResponse?.(response, request);
					},
					onSuccess: async (data, request) => {
						controller.signal.throwIfAborted();
						await options.onSuccess?.(data as T, request);
					},
					onError: (error, request) => {
						if (current() && !controller.signal.aborted)
							return options.onError?.(error, request);
					},
					retry: {
						attempts: 0,
						...options.retry,
						when: (context) => {
							controller.signal.throwIfAborted();
							return options.retry?.when
								? options.retry.when(context)
								: context.response?.ok === false;
						},
					},
				});
				controller.signal.throwIfAborted();
				return result as T;
			})();
			const result = await raceAbort(job, controller.signal);
			if (!current()) throw aborted("API environment changed.");
			if (observe) emit({ lastError: null, lastSuccessAt: Date.now() });
			return result;
		} catch (cause) {
			if (current() && observe) {
				const error = describeApiError(cause);
				if (error.kind !== "aborted") emit({ lastError: error });
			}
			throw cause;
		} finally {
			if (deadlineTimer !== undefined) clearTimeout(deadlineTimer);
			callerSignal?.removeEventListener("abort", cancel);
			controllers.delete(controller);
			if (current()) emit({ pending: Math.max(0, state.pending - 1) });
		}
	}
	function clearTimer() {
		if (timer !== undefined) clearTimeout(timer);
		timer = undefined;
	}
	function visible() {
		return (
			typeof document === "undefined" || document.visibilityState !== "hidden"
		);
	}
	function schedule() {
		clearTimer();
		if (
			!runtimeMounted ||
			disposed ||
			!state.monitoring ||
			!healthConfig() ||
			!visible()
		)
			return;
		timer = setTimeout(automaticCheck, config.pollIntervalMs ?? 30_000);
	}
	async function checkHealth(): Promise<HealthSnapshot> {
		await ready;
		assertActive();
		if (healthTask) return healthTask;
		const specification = healthConfig();
		if (!specification) return state.health;
		clearTimer();
		const epoch = generation;
		const started = performance.now();
		emit({ health: Object.freeze({ ...state.health, checking: true }) });
		const task = (async (): Promise<HealthSnapshot> => {
			let result: HealthSnapshot;
			try {
				const data = await perform(
					specification.path,
					{ timeout: specification.timeoutMs ?? 5_000 },
					false,
					epoch,
				);
				const report: HealthResult = specification.interpret
					? await specification.interpret(data)
					: { status: "healthy" };
				if (
					!report ||
					!["healthy", "degraded", "unhealthy"].includes(report.status)
				) {
					throw new ApiConfigurationError(
						"Health interpreter must return healthy, degraded, or unhealthy.",
					);
				}
				result = Object.freeze({
					...report,
					checking: false,
					checkedAt: Date.now(),
					latencyMs: Math.round(performance.now() - started),
				});
			} catch (cause) {
				const error = describeApiError(cause);
				result = Object.freeze({
					status:
						error.kind === "http"
							? error.status === 401 || error.status === 403
								? "unauthorized"
								: "unhealthy"
							: error.kind === "network" || error.kind === "timeout"
								? "unreachable"
								: "unknown",
					checking: false,
					checkedAt: Date.now(),
					latencyMs: Math.round(performance.now() - started),
					error,
				});
			}
			if (disposed || epoch !== generation)
				throw aborted("Health check superseded.");
			emit({ health: result });
			return result;
		})();
		healthTask = task;
		try {
			return await task;
		} finally {
			if (healthTask === task) {
				healthTask = null;
				schedule();
			}
		}
	}
	// Automatic checks consume cancellation/errors. Manual checkHealth callers retain rejection semantics.
	function automaticCheck() {
		void checkHealth().catch(() => {});
	}
	function setEnvironment(id: string) {
		if (disposed) throw aborted("API client disposed.");
		if (!environments.some((env) => env.id === id))
			throw new ApiConfigurationError(`Unknown API environment: ${id}`);
		preferencesRevision++;
		if (id === state.environmentId) {
			persist();
			return;
		}
		const previous = state.environmentId;
		generation++;
		clearTimer();
		for (const controller of controllers)
			controller.abort(aborted("API environment changed."));
		controllers.clear();
		healthTask = null;
		emit({
			environmentId: id,
			pending: 0,
			health: unknownHealth(),
			lastError: null,
			lastSuccessAt: null,
		});
		persist();
		for (const listener of changeListeners) {
			try {
				listener({ previous, current: id });
			} catch {
				console.error("[rune-lab/api] Environment subscriber failed.");
			}
		}
		if (runtimeMounted && healthConfig() && visible()) automaticCheck();
	}
	function setMonitoring(value: boolean) {
		if (disposed) throw aborted("API client disposed.");
		if (typeof value !== "boolean")
			throw new ApiConfigurationError("monitoring must be a boolean.");
		preferencesRevision++;
		emit({ monitoring: value });
		persist();
		clearTimer();
		if (value && runtimeMounted && healthConfig() && visible())
			automaticCheck();
	}
	function visibilityChanged() {
		clearTimer();
		if (visible() && state.monitoring && healthConfig()) automaticCheck();
	}
	async function start() {
		const revision = runtimeRevision;
		await ready;
		if (revision !== runtimeRevision) return;
		if (disposed || runtimeMounted || typeof window === "undefined") return;
		runtimeMounted = true;
		document.addEventListener("visibilitychange", visibilityChanged);
		window.addEventListener("online", visibilityChanged);
		if (
			(config.autoCheck !== false || state.monitoring) &&
			healthConfig() &&
			visible()
		)
			automaticCheck();
	}
	function stop() {
		runtimeRevision++;
		runtimeMounted = false;
		clearTimer();
		if (typeof window !== "undefined") {
			document.removeEventListener("visibilitychange", visibilityChanged);
			window.removeEventListener("online", visibilityChanged);
		}
	}
	function dispose() {
		if (disposed) return;
		stop();
		generation++;
		for (const controller of controllers)
			controller.abort(aborted("API client disposed."));
		controllers.clear();
		emit({
			pending: 0,
			health: Object.freeze({ ...state.health, checking: false }),
		});
		disposed = true;
		listeners.clear();
		changeListeners.clear();
	}
	return {
		ready,
		environments,
		get state() {
			return state;
		},
		get environment(): Readonly<ApiEnvironment> | undefined {
			return active();
		},
		get current(): string | null {
			return state.environmentId;
		},
		set current(id: string | null) {
			if (id !== null) setEnvironment(id);
		},
		get monitoring() {
			return state.monitoring;
		},
		set monitoring(value: boolean) {
			setMonitoring(value);
		},
		get canCheckHealth() {
			return Boolean(healthConfig());
		},
		get canExecRaw() {
			return Boolean(rawConfig());
		},
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		onEnvironmentChange(listener: (event: ApiEnvironmentChange) => void) {
			changeListeners.add(listener);
			return () => {
				changeListeners.delete(listener);
			};
		},
		request: <T = unknown>(path: string, options?: ApiRequestOptions<T>) =>
			perform<T>(path, options),
		get: <T = unknown>(path: string, options?: ApiRequestOptions<T>) =>
			perform<T>(path, { ...options, method: "GET" }),
		post: <T = unknown>(
			path: string,
			body?: unknown,
			options?: ApiRequestOptions<T>,
		) => perform<T>(path, { ...options, method: "POST", body }),
		put: <T = unknown>(
			path: string,
			body?: unknown,
			options?: ApiRequestOptions<T>,
		) => perform<T>(path, { ...options, method: "PUT", body }),
		patch: <T = unknown>(
			path: string,
			body?: unknown,
			options?: ApiRequestOptions<T>,
		) => perform<T>(path, { ...options, method: "PATCH", body }),
		delete: <T = unknown>(path: string, options?: ApiRequestOptions<T>) =>
			perform<T>(path, { ...options, method: "DELETE" }),
		async execRaw<T = unknown>(
			query: string,
			params: Record<string, unknown> = {},
			options?: ApiRequestOptions<T>,
		): Promise<T> {
			const epoch = generation;
			await ready;
			assertActive();
			if (epoch !== generation) throw aborted("API environment changed.");
			const specification = rawConfig();
			if (!specification)
				throw new ApiConfigurationError(
					"execRaw requires an explicitly configured endpoint.",
				);
			return perform<T>(
				specification.path,
				{
					...options,
					method: "POST",
					body: specification.body?.(query, params) ?? { query, params },
					retry: { attempts: 0 },
				},
				true,
				generation,
			);
		},
		checkHealth,
		setEnvironment,
		setMonitoring,
		start,
		stop,
		dispose,
	};
}
export type ApiClient = ReturnType<typeof createApiClient>;
