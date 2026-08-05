export { TracoreClient } from './client';
// Re-export all generated API types for consumers
export type {
	ApiErrorCode,
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
	WebhookEventType,
	WebhookPayload,
	Workspace,
} from './generated/types.gen';
export { ERROR_CODES, type ErrorCode, TracoreError } from './helpers/errors';
export type { PollOptions } from './helpers/polling';
export { DocumentsResource } from './resources/documents';
export { EnvironmentsResource } from './resources/environments';
export { RunsResource } from './resources/runs';
export { SchemasResource } from './resources/schemas';
export { UserResource } from './resources/user';
export type { SetProviderKeyRequest } from './resources/user-provider-keys';
export { UserProviderKeysResource } from './resources/user-provider-keys';
export { WebhooksResource } from './resources/webhooks';
export { WorkspacesResource } from './resources/workspaces';
export type {
	ClientOptions,
	EnvironmentParams,
	ExtractOptions,
	PaginationParams,
} from './types';
export { API_VERSION } from './version';
