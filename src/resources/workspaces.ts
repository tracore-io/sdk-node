import type { Client } from '../generated/client';
import * as sdk from '../generated/sdk.gen';
import type {
	CreateWorkspaceRequest,
	UpdateWorkspaceRequest,
} from '../generated/types.gen';
import type { PaginationParams } from '../types';
import { normalizeError } from '../helpers/errors';

/** Manage workspaces. */
export class WorkspacesResource {
	/** @internal */
	constructor(private readonly client: Client) {}

	/**
	 * List all workspaces for the authenticated user.
	 *
	 * @example
	 * ```ts
	 * const { data, total } = await client.workspaces.list();
	 * ```
	 */
	async list(params?: PaginationParams) {
		const { data, error } = await sdk.getWorkspaces({
			client: this.client,
			query: params,
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Get a workspace by its slug.
	 *
	 * @param slug - Workspace slug identifier
	 */
	async get(slug: string) {
		const { data, error } = await sdk.getWorkspaceBySlug({
			client: this.client,
			path: { slug },
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Create a new workspace. Automatically creates production, staging, and development environments.
	 *
	 * @param body - Workspace creation parameters
	 *
	 * @example
	 * ```ts
	 * const workspace = await client.workspaces.create({
	 *   name: 'My Workspace',
	 *   description: 'Invoice processing'
	 * });
	 * ```
	 */
	async create(body: CreateWorkspaceRequest) {
		const { data, error } = await sdk.createWorkspace({
			client: this.client,
			body,
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Update a workspace.
	 *
	 * @param slug - Workspace slug identifier
	 * @param body - Fields to update
	 */
	async update(slug: string, body: UpdateWorkspaceRequest) {
		const { data, error } = await sdk.updateWorkspace({
			client: this.client,
			path: { slug },
			body,
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Delete a workspace and all its children (environments, schemas, documents, runs).
	 *
	 * @param slug - Workspace slug identifier
	 */
	async delete(slug: string) {
		const { error } = await sdk.deleteWorkspace({
			client: this.client,
			path: { slug },
		});
		if (error) throw normalizeError(error);
	}
}
