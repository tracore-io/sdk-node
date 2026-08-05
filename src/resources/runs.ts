import type { Client } from '../generated/client';
import * as sdk from '../generated/sdk.gen';
import { normalizeError } from '../helpers/errors';
import { type PollOptions, pollRun } from '../helpers/polling';
import type { EnvironmentParams, PaginationParams } from '../types';

/** Manage extraction runs. */
export class RunsResource {
	/** @internal */
	constructor(
		private readonly client: Client,
		private readonly defaultEnv?: 'production' | 'staging' | 'development',
	) {}

	private env(params?: EnvironmentParams) {
		return params?.env ?? this.defaultEnv;
	}

	/**
	 * List runs for a schema in a specific environment.
	 *
	 * @param workspace - Workspace slug
	 * @param schemaKey - Schema key identifier
	 */
	async list(workspace: string, schemaKey: string, params?: PaginationParams & EnvironmentParams) {
		const { data, error, response } = await sdk.getRuns({
			client: this.client,
			path: { slug: workspace, schemaKey },
			query: {
				env: this.env(params),
				page: params?.page,
				pageSize: params?.pageSize,
			},
		});
		if (error) throw normalizeError(error, response);
		return data;
	}

	/**
	 * Get a run by ID.
	 *
	 * @param id - Run ID
	 */
	async get(id: string) {
		const { data, error, response } = await sdk.getRunById({
			client: this.client,
			path: { id },
		});
		if (error) throw normalizeError(error, response);
		return data;
	}

	/**
	 * Poll a run until it reaches a terminal status (completed, failed, or validation_failed).
	 *
	 * @param id - Run ID to poll
	 * @param options - Polling configuration
	 *
	 * @example
	 * ```ts
	 * const run = await client.runs.poll('run-id', {
	 *   intervalMs: 2000,
	 *   onProgress: (run) => console.log(`Status: ${run.status}`)
	 * });
	 * console.log(run.extractedData);
	 * ```
	 */
	async poll(id: string, options?: PollOptions) {
		return pollRun(this.client, id, options);
	}
}
