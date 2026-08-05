import type { Client } from '../generated/client';
import * as sdk from '../generated/sdk.gen';
import type { ProviderType } from '../generated/types.gen';
import { normalizeError } from '../helpers/errors';

/**
 * Body for {@link UserProviderKeysResource.set}.
 *
 * Two modes:
 * - **Create / replace** — supply `key` (and optionally `defaultModel`). The
 *   server tests the plaintext key against the provider's `/models` endpoint
 *   before encrypting and persisting it. The previously stored key (if any)
 *   is left intact on test failure.
 * - **Update default model only** — omit `key` and supply `defaultModel`.
 *   Requires an existing stored key for the provider; no provider call is
 *   made and the stored ciphertext is unchanged.
 *
 * In both modes `defaultModel` (when supplied) must be in the provider's
 * allowlist (see spec §3.5).
 */
export interface SetProviderKeyRequest {
	/** Plaintext API key. Supply when creating or rotating the stored key. */
	key?: string;
	/**
	 * Profile default model id. Preselected for environments that assign this
	 * key without a per-env override. Defaults to the provider's
	 * `DEFAULT_MODEL_PER_PROVIDER` value when omitted in mode A.
	 */
	defaultModel?: string;
}

/**
 * Manage the **current user's** AI provider keys (BYOK).
 *
 * Keys are user-scoped — one per provider per user. They are reused across
 * every workspace the user owns. An environment with no key assignment
 * silently falls back to Tracore's system Mistral.
 *
 * All operations require a session-cookie authenticated user; API-key
 * authentication is rejected on these endpoints by design (prevents a
 * compromised API key from burning a user's provider account).
 */
export class UserProviderKeysResource {
	/** @internal */
	constructor(private readonly client: Client) {}

	/**
	 * List the current user's provider keys.
	 *
	 * Each entry includes a masked `keyPreview` (never plaintext), profile
	 * `defaultModel`, residency, last test status, and the workspace/env
	 * tuples currently consuming the key (`usedIn`).
	 *
	 * @example
	 * ```ts
	 * const { data: keys } = await client.user.providerKeys.list();
	 * for (const k of keys) {
	 *   console.log(`${k.provider} → ${k.lastTestStatus}`);
	 * }
	 * ```
	 */
	async list() {
		const { data, error, response } = await sdk.getUserProviderKeys({
			client: this.client,
		});
		if (error) throw normalizeError(error, response);
		return data;
	}

	/**
	 * Get a single provider key's metadata by provider.
	 *
	 * @param params - The provider whose key metadata to fetch.
	 */
	async get(params: { provider: ProviderType }) {
		const { data, error, response } = await sdk.getUserProviderKey({
			client: this.client,
			path: { provider: params.provider },
		});
		if (error) throw normalizeError(error, response);
		return data;
	}

	/**
	 * Create, replace, or update a provider key.
	 *
	 * - With `key`: atomic test-and-save. The server calls the provider's
	 *   `GET /models` endpoint with the plaintext; on success the key is
	 *   encrypted with AES-256-GCM and stored. On test failure (`400
	 *   invalid_key`) the previously stored key is untouched.
	 * - With `defaultModel` only: updates the profile default model without
	 *   re-encrypting or contacting the provider. Requires an existing row.
	 *
	 * Rate limited to 20 req/min/user.
	 *
	 * @param params - Provider + body fields. See {@link SetProviderKeyRequest}.
	 *
	 * @example
	 * ```ts
	 * // Connect a new Anthropic key
	 * await client.user.providerKeys.set({
	 *   provider: 'anthropic',
	 *   key: 'sk-ant-api03-...',
	 *   defaultModel: 'claude-haiku-4-5',
	 * });
	 *
	 * // Later, change just the default model
	 * await client.user.providerKeys.set({
	 *   provider: 'anthropic',
	 *   defaultModel: 'claude-opus-4-7',
	 * });
	 * ```
	 */
	async set(params: { provider: ProviderType } & SetProviderKeyRequest) {
		const { provider, ...body } = params;
		const { data, error, response } = await sdk.setUserProviderKey({
			client: this.client,
			path: { provider },
			body,
		});
		if (error) throw normalizeError(error, response);
		return data;
	}

	/**
	 * Re-test the stored provider key against the provider.
	 *
	 * Calls the provider's `GET /models` endpoint with the stored key and
	 * updates `lastTestedAt` + `lastTestStatus`. Returns the new status. Rate
	 * limited to 10 req/min/user, 100 req/hr/user.
	 *
	 * @param params - The provider whose key to re-test.
	 */
	async test(params: { provider: ProviderType }) {
		const { data, error, response } = await sdk.testUserProviderKey({
			client: this.client,
			path: { provider: params.provider },
		});
		if (error) throw normalizeError(error, response);
		return data;
	}

	/**
	 * Remove the current user's provider key for a given provider.
	 *
	 * Cascades: any environment whose `providerKeyId` references the deleted
	 * key has its `providerKeyId` and `model` set to `null`, reverting that
	 * environment to the system Mistral fallback.
	 *
	 * @param params - The provider whose key to remove.
	 */
	async remove(params: { provider: ProviderType }) {
		const { data, error, response } = await sdk.deleteUserProviderKey({
			client: this.client,
			path: { provider: params.provider },
		});
		if (error) throw normalizeError(error, response);
		return data;
	}
}
