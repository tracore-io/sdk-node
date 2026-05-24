export { TracoreClient } from './client';
export { TracoreError } from './helpers/errors';
export { API_VERSION } from './version';
export { WorkspacesResource } from './resources/workspaces';
export { SchemasResource } from './resources/schemas';
export { DocumentsResource } from './resources/documents';
export { RunsResource } from './resources/runs';
export { WebhooksResource } from './resources/webhooks';
export { EnvironmentsResource } from './resources/environments';
export { UserResource } from './resources/user';
export { UserProviderKeysResource } from './resources/user-provider-keys';

export type {
	ClientOptions,
	PaginationParams,
	EnvironmentParams,
	ExtractOptions,
} from './types';

export type { PollOptions } from './helpers/polling';
export type { SetProviderKeyRequest } from './resources/user-provider-keys';

// Re-export all generated API types for consumers
export type {
	Workspace,
	CreateWorkspaceRequest,
	UpdateWorkspaceRequest,
	Environment,
	EnvironmentQuery,
	EnvironmentWithResolved,
	UpdateEnvironmentRequest,
	ResolvedModel,
	Document,
	CreateDocumentRequest,
	SchemaFamily,
	SchemaFamilyWithVersion,
	SchemaVersion,
	CreateSchemaFamilyRequest,
	Run,
	RunListItem,
	ExtractRequest,
	DocumentExtractRequest,
	ExtractAcceptedResponse,
	WebhookEndpoint,
	WebhookDelivery,
	CreateWebhookRequest,
	UpdateWebhookRequest,
	SendTestWebhookRequest,
	UserPlanResponse,
	RunErrorCode,
	ProviderKey,
	ProviderKeyListResponse,
	ProviderKeyPutRequest,
	ProviderKeyTestResponse,
	ProviderKeyUsage,
	ProviderType,
	KeySource,
	KeyTestStatus,
	Residency,
	ErrorResponse,
	PaginatedResponse,
} from './generated/types.gen';
