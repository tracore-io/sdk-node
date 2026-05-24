export type {
	CreateDocumentRequest,
	CreateSchemaFamilyRequest,
	CreateWebhookRequest,
	CreateWorkspaceRequest,
	Document,
	DocumentExtractRequest,
	Environment,
	EnvironmentQuery,
	EnvironmentWithResolved,
	ErrorResponse,
	ExtractAcceptedResponse,
	ExtractRequest,
	KeySource,
	KeyTestStatus,
	PaginatedResponse,
	ProviderKey,
	ProviderKeyListResponse,
	ProviderKeyPutRequest,
	ProviderKeyTestResponse,
	ProviderKeyUsage,
	ProviderType,
	Residency,
	ResolvedModel,
	Run,
	RunErrorCode,
	RunListItem,
	SchemaFamily,
	SchemaFamilyWithVersion,
	SchemaVersion,
	SendTestWebhookRequest,
	UpdateEnvironmentRequest,
	UpdateWebhookRequest,
	UpdateWorkspaceRequest,
	UserPlanResponse,
	WebhookDelivery,
	WebhookEndpoint,
	Workspace,
} from './generated/types.gen';

export type { PollOptions } from './helpers/polling';

/** Options for creating a Tracore client. */
export interface ClientOptions {
	/** API key for authentication. Sent as `x-api-key` header. */
	apiKey: string;
	/** Base URL of the Tracore API. @default "https://api.tracore.io" */
	baseUrl?: string;
	/** Default environment for environment-scoped requests. @default "production" */
	environment?: 'production' | 'staging' | 'development';
}

/** Pagination parameters for list endpoints. */
export interface PaginationParams {
	/** Page number (1-based). @default 1 */
	page?: number;
	/** Number of items per page (1-100). @default 20 */
	pageSize?: number;
}

/** Options for environment-scoped requests. */
export interface EnvironmentParams {
	/** Override the default environment for this request. */
	env?: 'production' | 'staging' | 'development';
}

/** Options for the extract convenience method. */
export interface ExtractOptions extends EnvironmentParams {
	/** Schema version number to use. Uses latest if omitted. */
	versionNumber?: number;
	/**
	 * Optional provider/model override for this run. Format is
	 * `<provider>/<model>` — for example `anthropic/claude-opus-4-7`.
	 * Takes precedence over the environment's assignment. Returns 412
	 * `no_key` if the named provider has no user key and is not Mistral.
	 */
	model?: string;
	/** If true or PollOptions, automatically poll until the run completes. */
	poll?: boolean | import('./helpers/polling').PollOptions;
}
