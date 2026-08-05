import type { Client } from '../generated/client';
import * as sdk from '../generated/sdk.gen';
import type { CreateSchemaFamilyRequest } from '../generated/types.gen';
import { normalizeError } from '../helpers/errors';
import type { PaginationParams } from '../types';

/** Manage schema families and versions. */
export class SchemasResource {
	/** @internal */
	constructor(private readonly client: Client) {}

	/**
	 * List schema families in a workspace.
	 *
	 * @param workspace - Workspace slug
	 */
	async list(workspace: string, params?: PaginationParams) {
		const { data, error, response } = await sdk.getSchemaFamilies({
			client: this.client,
			path: { slug: workspace },
			query: params,
		});
		if (error) throw normalizeError(error, response);
		return data;
	}

	/**
	 * Get a schema family by key.
	 *
	 * @param workspace - Workspace slug
	 * @param schemaKey - Schema key identifier
	 */
	async get(workspace: string, schemaKey: string) {
		const { data, error, response } = await sdk.getSchemaFamilyByKey({
			client: this.client,
			path: { slug: workspace, schemaKey },
		});
		if (error) throw normalizeError(error, response);
		return data;
	}

	/**
	 * Create a schema family or add a new version.
	 *
	 * If the schema key already exists and the definition hash differs
	 * from the latest version, a new version is created automatically.
	 *
	 * @param workspace - Workspace slug
	 * @param body - Schema family creation parameters
	 *
	 * @example
	 * ```ts
	 * const schema = await client.schemas.create('my-workspace', {
	 *   schemaKey: 'invoice',
	 *   name: 'Invoice Schema',
	 *   definition: {
	 *     type: 'object',
	 *     properties: {
	 *       invoiceNumber: { type: 'string' },
	 *       total: { type: 'number' }
	 *     }
	 *   }
	 * });
	 * ```
	 */
	async create(workspace: string, body: CreateSchemaFamilyRequest) {
		const { data, error, response } = await sdk.createSchemaFamily({
			client: this.client,
			path: { slug: workspace },
			body,
		});
		if (error) throw normalizeError(error, response);
		return data;
	}

	/**
	 * List versions of a schema family.
	 *
	 * @param workspace - Workspace slug
	 * @param schemaKey - Schema key identifier
	 */
	async listVersions(workspace: string, schemaKey: string, params?: PaginationParams) {
		const { data, error, response } = await sdk.getSchemaVersions({
			client: this.client,
			path: { slug: workspace, schemaKey },
			query: params,
		});
		if (error) throw normalizeError(error, response);
		return data;
	}

	/**
	 * Get a specific version of a schema family.
	 *
	 * @param workspace - Workspace slug
	 * @param schemaKey - Schema key identifier
	 * @param versionNumber - Version number
	 */
	async getVersion(workspace: string, schemaKey: string, versionNumber: number) {
		const { data, error, response } = await sdk.getSchemaVersion({
			client: this.client,
			path: { slug: workspace, schemaKey, versionNumber },
		});
		if (error) throw normalizeError(error, response);
		return data;
	}
}
