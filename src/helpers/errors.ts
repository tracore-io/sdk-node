import type { ApiErrorCode, ErrorResponse } from '../generated/types.gen';

/**
 * Machine-readable error codes surfaced on {@link TracoreError.code}.
 *
 * `TRANSPORT`, `CONFIG`, and `POLLING_TIMEOUT` are synthesized client-side for
 * failures that never produced an HTTP response; the rest mirror the API's
 * top-level `error.code` vocabulary (the contract's `ApiErrorCode` schema). The
 * wire field stays a free-form string — new codes are not a breaking change —
 * so compare against these constants rather than an exhaustive union.
 * Note: key-validation failures arrive as `VALIDATION_ERROR` with
 * `details.code === 'invalid_key'`, not as a top-level code.
 *
 * @example
 * ```ts
 * if (error instanceof TracoreError && error.code === ERROR_CODES.TRANSPORT) {
 *   // network failure — retryable
 * }
 * ```
 */
export const ERROR_CODES = {
	/** Client-side: network, timeout, or decoding failure (retryable). `status` is 0. */
	TRANSPORT: 'transport_error',
	/** Client-side: invalid SDK input (permanent; a caller bug). */
	CONFIG: 'config_error',
	/** Client-side: poll loop exhausted its attempts; the run is still live server-side. */
	POLLING_TIMEOUT: 'polling_timeout',
	NOT_FOUND: 'NOT_FOUND',
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	UNAUTHORIZED: 'UNAUTHORIZED',
	INTERNAL_ERROR: 'INTERNAL_ERROR',
	NOT_IMPLEMENTED: 'not_implemented',
	PLAN_LIMIT_EXCEEDED: 'plan_limit_exceeded',
	RATE_LIMITED: 'rate_limited',
	EMAIL_NOT_VERIFIED: 'email_not_verified',
	FORBIDDEN_KEY: 'forbidden_key',
	INVALID_PROVIDER: 'invalid_provider',
	INVALID_MODEL: 'invalid_model',
	NO_KEY: 'no_key',
	/** Internal billing surfaces / Stripe webhook only — never public API endpoints. */
	STRIPE_NOT_CONFIGURED: 'stripe_not_configured',
	NO_STRIPE_CUSTOMER: 'no_stripe_customer',
	CHECKOUT_MISSING_USER: 'checkout_missing_user',
	INVALID_SIGNATURE: 'invalid_signature',
} as const;

/** Union of the known {@link ERROR_CODES} values. */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** The client-side synthetic subset of {@link ERROR_CODES}. */
export type SyntheticErrorCode =
	| typeof ERROR_CODES.TRANSPORT
	| typeof ERROR_CODES.CONFIG
	| typeof ERROR_CODES.POLLING_TIMEOUT;

// Compile-time drift guard (both directions): the server-side subset of
// ERROR_CODES must equal the contract's generated ApiErrorCode vocabulary.
// A contract rename/removal or a new contract code breaks typecheck here.
type ServerErrorCode = Exclude<ErrorCode, SyntheticErrorCode>;
type Expect<T extends true> = T;
export type _AssertServerCodesInContract = Expect<
	[ServerErrorCode] extends [ApiErrorCode] ? true : false
>;
export type _AssertContractCodesCovered = Expect<
	[ApiErrorCode] extends [ServerErrorCode] ? true : false
>;

/**
 * Error thrown by the Tracore SDK when an API request fails.
 *
 * For HTTP failures `status` is the response status code and `code`/`details`
 * come from the API's error envelope. For client-side failures (network,
 * decoding) `status` is 0, `code` is {@link ERROR_CODES.TRANSPORT}, and the
 * underlying error stays reachable via the standard `Error#cause`.
 *
 * @example
 * ```ts
 * try {
 *   await client.workspaces.get('my-workspace');
 * } catch (error) {
 *   if (error instanceof TracoreError) {
 *     console.log(error.status);  // 404
 *     console.log(error.message); // "Workspace not found"
 *     console.log(error.code);    // ERROR_CODES.NOT_FOUND
 *   }
 * }
 * ```
 */
export class TracoreError extends Error {
	/** HTTP status code of the response, or 0 for a client-side failure. */
	readonly status: number;
	/** Machine-readable error code, if provided by the API (see {@link ERROR_CODES}). */
	readonly code?: string;
	/** Additional error details, if provided by the API. */
	readonly details?: Record<string, unknown>;

	constructor(
		status: number,
		message: string,
		code?: string,
		details?: Record<string, unknown>,
		options?: { cause?: unknown },
	) {
		super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
		this.name = 'TracoreError';
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

interface ErrorWithStatus {
	status?: number;
	statusCode?: number;
	body?: unknown;
	message?: string;
}

function fromEnvelope(
	envelope: ErrorResponse['error'] | undefined,
	status: number,
): TracoreError | undefined {
	if (!envelope?.message) return undefined;
	return new TracoreError(
		status,
		envelope.message,
		envelope.code,
		envelope.details as Record<string, unknown> | undefined,
	);
}

/**
 * Normalize an error from the hey-api client into a TracoreError. `response` is
 * the fetch Response the generated call returned alongside the error, used as
 * the status source for raw API error-envelope bodies.
 * @internal
 */
export function normalizeError(error: unknown, response?: { status?: number }): TracoreError {
	if (error instanceof TracoreError) {
		return error;
	}

	if (error && typeof error === 'object') {
		// Raw API error-envelope body (`{ error: { code, message, details } }`) —
		// what the generated client returns as `error` for a non-2xx response.
		if ('error' in error) {
			const normalized = fromEnvelope(
				(error as { error?: ErrorResponse['error'] }).error,
				response?.status ?? 500,
			);
			if (normalized) return normalized;
		}

		const err = error as Error & ErrorWithStatus;
		const status = err.status ?? err.statusCode ?? response?.status;

		if (err.body && typeof err.body === 'object' && 'error' in err.body) {
			const normalized = fromEnvelope(
				(err.body as { error?: ErrorResponse['error'] }).error,
				status ?? 500,
			);
			if (normalized) return normalized;
		}

		if (err.message) {
			if (status === undefined) {
				// Thrown before any HTTP response (network/decoding failure).
				return new TracoreError(0, err.message, ERROR_CODES.TRANSPORT, undefined, {
					cause: error,
				});
			}
			return new TracoreError(
				status,
				err.message,
				undefined,
				undefined,
				error instanceof Error ? { cause: error } : undefined,
			);
		}
	}

	// An HTTP response DID arrive but its error body was not the JSON envelope
	// (e.g. an HTML 502 from a proxy, or a bare string). Keep the real status —
	// classifying this as a transport failure would misroute retry/status logic.
	if (response?.status !== undefined) {
		return new TracoreError(
			response.status,
			typeof error === 'string' && error !== '' ? error : 'An unexpected error occurred',
			undefined,
			undefined,
			error !== undefined ? { cause: error } : undefined,
		);
	}

	return new TracoreError(
		0,
		'An unexpected error occurred',
		ERROR_CODES.TRANSPORT,
		undefined,
		error !== undefined ? { cause: error } : undefined,
	);
}
