import type { Client } from '../generated/client';
import * as sdk from '../generated/sdk.gen';
import type { CreateDocumentRequest } from '../generated/types.gen';
import type { PaginationParams, EnvironmentParams } from '../types';
import { normalizeError } from '../helpers/errors';

/** Manage documents. */
export class DocumentsResource {
	/** @internal */
	constructor(
		private readonly client: Client,
		private readonly defaultEnv?: 'production' | 'staging' | 'development',
	) {}

	private env(params?: EnvironmentParams) {
		return params?.env ?? this.defaultEnv;
	}

	/**
	 * List documents for a schema in a specific environment.
	 *
	 * @param workspace - Workspace slug
	 * @param schemaKey - Schema key identifier
	 *
	 * @example
	 * ```ts
	 * const { data, total } = await client.documents.list('my-workspace', 'invoice');
	 * ```
	 */
	async list(
		workspace: string,
		schemaKey: string,
		params?: PaginationParams & EnvironmentParams,
	) {
		const { data, error } = await sdk.getDocuments({
			client: this.client,
			path: { slug: workspace, schemaKey },
			query: {
				env: this.env(params),
				page: params?.page,
				pageSize: params?.pageSize,
			},
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Get a document by ID.
	 *
	 * @param id - Document ID
	 */
	async get(id: string) {
		const { data, error } = await sdk.getDocumentById({
			client: this.client,
			path: { id },
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Create a document with text content.
	 *
	 * @param workspace - Workspace slug
	 * @param schemaKey - Schema key identifier
	 * @param body - Document creation parameters
	 */
	async create(
		workspace: string,
		schemaKey: string,
		body: CreateDocumentRequest,
		params?: EnvironmentParams,
	) {
		const { data, error } = await sdk.createDocument({
			client: this.client,
			path: { slug: workspace, schemaKey },
			body,
			query: { env: this.env(params) },
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Upload a file as a document.
	 *
	 * @param workspace - Workspace slug
	 * @param schemaKey - Schema key identifier
	 * @param file - File to upload (Blob, File, or Buffer)
	 * @param name - Display name for the document
	 *
	 * @example
	 * ```ts
	 * import { readFileSync } from 'fs';
	 *
	 * const buffer = readFileSync('./invoice.pdf');
	 * const doc = await client.documents.upload(
	 *   'my-workspace',
	 *   'invoice',
	 *   new Blob([buffer], { type: 'application/pdf' }),
	 *   'invoice.pdf'
	 * );
	 * ```
	 */
	async upload(
		workspace: string,
		schemaKey: string,
		file: Blob,
		name: string,
		params?: EnvironmentParams,
	) {
		const formData = new FormData();
		formData.append('name', name);
		formData.append('file', file, name);

		const { data, error } = await sdk.createDocument({
			client: this.client,
			path: { slug: workspace, schemaKey },
			body: formData as unknown as CreateDocumentRequest,
			query: { env: this.env(params) },
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Download the original document file.
	 *
	 * @param id - Document ID
	 * @returns The document file as a Blob
	 */
	async download(id: string) {
		const { data, error } = await sdk.downloadDocument({
			client: this.client,
			path: { id },
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Delete a document, its file from storage, and all associated runs.
	 *
	 * @param id - Document ID
	 */
	async delete(id: string) {
		const { error } = await sdk.deleteDocument({
			client: this.client,
			path: { id },
		});
		if (error) throw normalizeError(error);
	}
}
