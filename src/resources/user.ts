import type { Client } from '../generated/client';
import { UserProviderKeysResource } from './user-provider-keys';

/**
 * User-scoped resources for the authenticated user (session-cookie auth only).
 *
 * Currently exposes:
 * - {@link providerKeys} — manage the user's AI provider keys (BYOK).
 *
 * Future user-scoped surfaces (e.g. profile, plan) will live here as well.
 */
export class UserResource {
	/** Manage the user's AI provider keys (BYOK). */
	readonly providerKeys: UserProviderKeysResource;

	/** @internal */
	constructor(private readonly client: Client) {
		this.providerKeys = new UserProviderKeysResource(client);
	}
}
