import type { Client } from '../generated/client';
import * as sdk from '../generated/sdk.gen';
import type {
	CreateWebhookRequest,
	SendTestWebhookRequest,
	UpdateWebhookRequest,
} from '../generated/types.gen';
import { normalizeError } from '../helpers/errors';
import type { EnvironmentParams, PaginationParams } from '../types';

/** Manage webhook endpoints and deliveries. */
export class WebhooksResource {
	/** @internal */
	constructor(
		private readonly client: Client,
		private readonly defaultEnv?: 'production' | 'staging' | 'development',
	) {}

	private env(params?: EnvironmentParams) {
		return params?.env ?? this.defaultEnv;
	}

	/**
	 * List webhooks for a schema in a specific environment.
	 *
	 * @param workspace - Workspace slug
	 * @param schemaKey - Schema key identifier
	 */
	async list(workspace: string, schemaKey: string, params?: PaginationParams & EnvironmentParams) {
		const { data, error } = await sdk.getWebhooks({
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
	 * Get a webhook by ID.
	 *
	 * @param id - Webhook endpoint ID
	 */
	async get(id: string) {
		const { data, error } = await sdk.getWebhookById({
			client: this.client,
			path: { id },
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Create a webhook endpoint.
	 *
	 * @param workspace - Workspace slug
	 * @param schemaKey - Schema key identifier
	 * @param body - Webhook creation parameters
	 *
	 * @example
	 * ```ts
	 * const webhook = await client.webhooks.create('my-workspace', 'invoice', {
	 *   url: 'https://example.com/webhook',
	 *   events: ['run.completed', 'run.failed']
	 * });
	 * console.log(webhook.secret); // HMAC signing secret
	 * ```
	 */
	async create(
		workspace: string,
		schemaKey: string,
		body: CreateWebhookRequest,
		params?: EnvironmentParams,
	) {
		const { data, error } = await sdk.createWebhook({
			client: this.client,
			path: { slug: workspace, schemaKey },
			body,
			query: { env: this.env(params) },
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Update a webhook endpoint.
	 *
	 * @param id - Webhook endpoint ID
	 * @param body - Fields to update
	 */
	async update(id: string, body: UpdateWebhookRequest) {
		const { data, error } = await sdk.updateWebhook({
			client: this.client,
			path: { id },
			body,
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Delete a webhook endpoint.
	 *
	 * @param id - Webhook endpoint ID
	 */
	async delete(id: string) {
		const { error } = await sdk.deleteWebhook({
			client: this.client,
			path: { id },
		});
		if (error) throw normalizeError(error);
	}

	/**
	 * List delivery logs for a webhook.
	 *
	 * @param id - Webhook endpoint ID
	 */
	async listDeliveries(id: string, params?: PaginationParams) {
		const { data, error } = await sdk.getWebhookDeliveries({
			client: this.client,
			path: { id },
			query: params,
		});
		if (error) throw normalizeError(error);
		return data;
	}

	/**
	 * Send a test event to a webhook endpoint.
	 *
	 * @param id - Webhook endpoint ID
	 * @param body - Test event configuration
	 */
	async sendTest(id: string, body: SendTestWebhookRequest) {
		const { data, error } = await sdk.sendTestWebhook({
			client: this.client,
			path: { id },
			body,
		});
		if (error) throw normalizeError(error);
		return data;
	}
}
