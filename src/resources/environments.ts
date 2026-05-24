import type { Client } from '../generated/client';
import * as sdk from '../generated/sdk.gen';
import type { UpdateEnvironmentRequest } from '../generated/types.gen';
import { normalizeError } from '../helpers/errors';
import type { PaginationParams } from '../types';
/** Manage environments within a workspace. */
export class EnvironmentsResource {
	/** @internal */
	constructor(private readonly client: Client) {}

	/**
	 * List environments for a workspace.
	 *
	 * @param workspace - Workspace slug
	 */
	async list(workspace: string, params?: PaginationParams) {
		const { data, error } = await sdk.getEnvironments({
			client: this.client,
			path: { slug: workspace },
			query: params,
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Get an environment by slug.
	 *
	 * @param workspace - Workspace slug
	 * @param envSlug - Environment slug (production, staging, or development)
	 */
	async get(workspace: string, envSlug: 'production' | 'staging' | 'development') {
		const { data, error } = await sdk.getEnvironmentBySlug({
			client: this.client,
			path: { slug: workspace, envSlug },
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Assign a provider key and/or model override to an environment.
	 *
	 * Body shape (see spec §4.2):
	 * - `providerKeyId`: id of one of the user's provider keys (from
	 *   `client.user.providerKeys.list()`), or `null` to revert this
	 *   environment to the system Mistral fallback. When `null`, `model`
	 *   must also be `null`.
	 * - `model`: per-environment model override. `null` means inherit the
	 *   provider key's profile `defaultModel`. Must be in the
	 *   provider's allowlist when non-null.
	 *
	 * The 200 response includes a denormalized `resolved` block describing
	 * the effective `{ provider, model, residency, keySource }` after
	 * precedence rules (spec §5.2).
	 *
	 * @param workspace - Workspace slug.
	 * @param envSlug   - Environment slug (production, staging, or development).
	 * @param body      - Patch body. At least one of
	 *                    `providerKeyId`/`model` must be present.
	 *
	 * @example
	 * ```ts
	 * // Assign Anthropic key with profile-default model
	 * const { data: keys } = await client.user.providerKeys.list();
	 * const anthropic = keys.find((k) => k.provider === 'anthropic')!;
	 * await client.environments.update(
	 *   'my-workspace',
	 *   'production',
	 *   { providerKeyId: anthropic.id, model: null },
	 * );
	 *
	 * // Revert to system fallback
	 * await client.environments.update(
	 *   'my-workspace',
	 *   'production',
	 *   { providerKeyId: null, model: null },
	 * );
	 * ```
	 */
	async update(
		workspace: string,
		envSlug: 'production' | 'staging' | 'development',
		body: UpdateEnvironmentRequest,
	) {
		const { data, error } = await sdk.updateEnvironment({
			client: this.client,
			path: { slug: workspace, envSlug },
			body,
		});
		if (error) throw normalizeError(error);
		return data;
	}
}
