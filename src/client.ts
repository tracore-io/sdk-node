import type { Client } from './generated/client';
import { createClient, createConfig } from './generated/client';
import * as sdk from './generated/sdk.gen';
import type { Run } from './generated/types.gen';
import { normalizeError } from './helpers/errors';
import { pollRun } from './helpers/polling';
import { DocumentsResource } from './resources/documents';
import { EnvironmentsResource } from './resources/environments';
import { RunsResource } from './resources/runs';
import { SchemasResource } from './resources/schemas';
import { UserResource } from './resources/user';
import { WebhooksResource } from './resources/webhooks';
import { WorkspacesResource } from './resources/workspaces';
import type { ClientOptions, ExtractOptions } from './types';
import { API_VERSION } from './version';

const DEFAULT_BASE_URL = 'https://api.tracore.io';

/**
 * Tracore API client.
 *
 * @example
 * ```ts
 * import { TracoreClient } from '@tracore/sdk';
 *
 * const client = new TracoreClient({
 *   apiKey: process.env.TRACORE_API_KEY!,
 *   baseUrl: 'https://api.tracore.io',
 * });
 *
 * // List workspaces
 * const { data: workspaces } = await client.workspaces.list();
 *
 * // Extract data from a document
 * const run = await client.extract('my-workspace', 'invoice', {
 *   documentId: 'doc-123',
 * }, { poll: true });
 *
 * console.log(run.extractedData);
 * ```
 */
export class TracoreClient {
	/** Manage workspaces. */
	readonly workspaces: WorkspacesResource;
	/** Manage schema families and versions. */
	readonly schemas: SchemasResource;
	/** Manage documents (upload, download, delete). */
	readonly documents: DocumentsResource;
	/** Manage extraction runs (list, get, poll). */
	readonly runs: RunsResource;
	/** Manage webhook endpoints and deliveries. */
	readonly webhooks: WebhooksResource;
	/** Manage environments within a workspace. */
	readonly environments: EnvironmentsResource;
	/** User-scoped resources for the authenticated user. */
	readonly user: UserResource;

	/**
	 * The Tracore API contract version this SDK was generated from (e.g. `0.5.0`).
	 * Sent on every request as the `Tracore-Version` header. This is the API
	 * contract version, not this package's own npm version.
	 */
	readonly apiVersion: string = API_VERSION;

	private readonly httpClient: Client;
	private readonly defaultEnv?: 'production' | 'staging' | 'development';

	constructor(options: ClientOptions) {
		this.defaultEnv = options.environment;

		this.httpClient = createClient(
			createConfig({
				baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
			}),
		);

		this.httpClient.interceptors.request.use((request) => {
			request.headers.set('x-api-key', options.apiKey);
			// Advisory header: tells the API which contract version this SDK targets.
			request.headers.set('Tracore-Version', API_VERSION);
			return request;
		});

		this.workspaces = new WorkspacesResource(this.httpClient);
		this.schemas = new SchemasResource(this.httpClient);
		this.documents = new DocumentsResource(this.httpClient, this.defaultEnv);
		this.runs = new RunsResource(this.httpClient, this.defaultEnv);
		this.webhooks = new WebhooksResource(this.httpClient, this.defaultEnv);
		this.environments = new EnvironmentsResource(this.httpClient);
		this.user = new UserResource(this.httpClient);
	}

	/**
	 * Extract structured data from a document.
	 *
	 * This is a convenience method that triggers extraction and optionally
	 * polls until the run completes.
	 *
	 * @param workspace - Workspace slug
	 * @param schemaKey - Schema key for the extraction schema
	 * @param input - Either `{ documentId }` for an existing document, or `{ file, name }` for inline upload
	 * @param options - Extraction and polling options
	 * @returns The extraction run. If `poll` is enabled, the run will be in a terminal state.
	 *
	 * @example
	 * ```ts
	 * // Extract from existing document with auto-polling
	 * const run = await client.extract('my-workspace', 'invoice', {
	 *   documentId: 'doc-123',
	 * }, { poll: true });
	 *
	 * if (run.status === 'completed') {
	 *   console.log(run.extractedData);
	 * }
	 * ```
	 *
	 * @example
	 * ```ts
	 * // Extract from file with manual polling
	 * const { runId } = await client.extract('my-workspace', 'invoice', {
	 *   file: new Blob([pdfBuffer], { type: 'application/pdf' }),
	 *   name: 'invoice.pdf',
	 * });
	 *
	 * // Poll separately
	 * const result = await client.runs.poll(runId);
	 * ```
	 */
	async extract(
		workspace: string,
		schemaKey: string,
		input: { documentId: string } | { file: Blob; name: string },
		options?: ExtractOptions,
	): Promise<Run> {
		const env = options?.env ?? this.defaultEnv;

		let runId: string;

		if ('documentId' in input) {
			const { data, error } = await sdk.extractDocumentById({
				client: this.httpClient,
				path: { slug: workspace, schemaKey, id: input.documentId },
				body: {
					versionNumber: options?.versionNumber,
					model: options?.model,
				},
				query: { env },
			});
			if (error) throw normalizeError(error);
			runId = (data as { runId: string }).runId;
		} else {
			const formData = new FormData();
			formData.append('file', input.file, input.name);
			formData.append('name', input.name);
			if (options?.versionNumber) {
				formData.append('versionNumber', String(options.versionNumber));
			}
			if (options?.model) {
				formData.append('model', options.model);
			}

			const { data, error } = await sdk.extractDocument({
				client: this.httpClient,
				path: { slug: workspace, schemaKey },
				body: formData as unknown as import('./generated/types.gen').ExtractRequest,
				query: { env },
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});
			if (error) throw normalizeError(error);
			runId = (data as { runId: string }).runId;
		}

		if (options?.poll) {
			const pollOpts = typeof options.poll === 'object' ? options.poll : undefined;
			return pollRun(this.httpClient, runId, pollOpts);
		}

		// Return the initial run state
		const { data, error } = await sdk.getRunById({
			client: this.httpClient,
			path: { id: runId },
		});
		if (error) throw normalizeError(error);
		return data as Run;
	}
}
