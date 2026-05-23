import type { ErrorResponse } from '../generated/types.gen';

/**
 * Error thrown by the Tracore SDK when an API request fails.
 *
 * @example
 * ```ts
 * try {
 *   await client.workspaces.get('my-workspace');
 * } catch (error) {
 *   if (error instanceof TracoreError) {
 *     console.log(error.status);  // 404
 *     console.log(error.message); // "Workspace not found"
 *     console.log(error.code);    // "NOT_FOUND"
 *   }
 * }
 * ```
 */
export class TracoreError extends Error {
	/** HTTP status code of the response. */
	readonly status: number;
	/** Machine-readable error code, if provided by the API. */
	readonly code?: string;
	/** Additional error details, if provided by the API. */
	readonly details?: Record<string, unknown>;

	constructor(
		status: number,
		message: string,
		code?: string,
		details?: Record<string, unknown>,
	) {
		super(message);
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

/**
 * Normalize an error from the hey-api client into a TracoreError.
 * @internal
 */
export function normalizeError(error: unknown): TracoreError {
	if (error instanceof TracoreError) {
		return error;
	}

	if (error && typeof error === 'object') {
		const err = error as Error & ErrorWithStatus;
		const status = err.status ?? err.statusCode ?? 500;

		if (err.body && typeof err.body === 'object' && 'error' in err.body) {
			const errorBody = err.body as { error?: ErrorResponse['error'] };
			if (errorBody.error) {
				return new TracoreError(
					status,
					errorBody.error.message,
					errorBody.error.code,
					errorBody.error.details as Record<string, unknown> | undefined,
				);
			}
		}

		if (err.message) {
			return new TracoreError(status, err.message);
		}
	}

	return new TracoreError(500, 'An unexpected error occurred');
}
