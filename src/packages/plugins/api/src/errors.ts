import { isResponseError, isResponseValidationError } from "up-fetch";
import type { ApiFailure } from "./types.ts";

export class ApiConfigurationError extends Error {
	override name = "ApiConfigurationError";
}

/** Classify for presentation; requests still reject with the original error. */
export function describeApiError(cause: unknown): ApiFailure {
	const message = cause instanceof Error ? cause.message : String(cause);
	if (isResponseError(cause))
		return { kind: "http", message, status: cause.status, cause };
	if (isResponseValidationError(cause))
		return { kind: "validation", message, issues: cause.issues, cause };
	if (cause instanceof ApiConfigurationError)
		return { kind: "configuration", message, cause };
	if (cause instanceof Error && cause.name === "TimeoutError")
		return { kind: "timeout", message, cause };
	if (cause instanceof Error && cause.name === "AbortError")
		return { kind: "aborted", message, cause };
	if (cause instanceof TypeError) return { kind: "network", message, cause };
	return { kind: "unknown", message, cause };
}
