# @tracore/sdk

<!-- tracore-api-version:start -->
> Built against Tracore API v0.6.0.
<!-- tracore-api-version:end -->

Official TypeScript SDK for the Tracore API.

## Installation

```bash
npm install @tracore/sdk
```

## Quick Start

```typescript
import { TracoreClient } from '@tracore/sdk';

const client = new TracoreClient({
  apiKey: process.env.TRACORE_API_KEY!,
});

// Create a workspace
const workspace = await client.workspaces.create({
  name: 'My Workspace',
});

// Define a schema
const schema = await client.schemas.create(workspace.slug, {
  schemaKey: 'invoice',
  name: 'Invoice Schema',
  definition: {
    type: 'object',
    properties: {
      invoiceNumber: { type: 'string' },
      total: { type: 'number' },
      lineItems: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            amount: { type: 'number' },
          },
        },
      },
    },
  },
});

// Extract data from a document with auto-polling
const run = await client.extract(workspace.slug, 'invoice', {
  file: new Blob([pdfBuffer], { type: 'application/pdf' }),
  name: 'invoice.pdf',
}, { poll: true });

console.log(run.extractedData);
```

## Resources

- `client.workspaces` - Manage workspaces
- `client.schemas` - Manage schema families and versions
- `client.documents` - Upload, download, and manage documents
- `client.runs` - Track and poll extraction runs
- `client.webhooks` - Configure webhook endpoints
- `client.environments` - Manage environments

## Fire-and-forget extraction

`client.extract` is not idempotent across retries: it issues a billed POST plus at
least one follow-up GET, so retrying the whole call can start a second billed run.
Webhook-driven consumers should use `client.extractAsync`, which performs the
single POST and returns the API's 202 accepted envelope as-is — the run id is
never lost to a failed follow-up request:

```typescript
const { runId } = await client.extractAsync('my-workspace', 'invoice', {
  documentId: 'doc-123',
});
await store(runId); // the run.completed webhook will quote this id
```

## Error Handling

Every failure throws a `TracoreError`. HTTP failures carry the response status
and the API's `error.code`; failures that never produced a response (network,
decoding) have `status === 0`, `code === ERROR_CODES.TRANSPORT`, and keep the
underlying error reachable via the standard `Error#cause`.

```typescript
import { ERROR_CODES, TracoreClient, TracoreError } from '@tracore/sdk';

try {
  await client.workspaces.get('nonexistent');
} catch (error) {
  if (error instanceof TracoreError) {
    console.log(error.status);  // 404
    console.log(error.code);    // ERROR_CODES.NOT_FOUND
    console.log(error.message); // "Workspace not found"
    console.log(error.cause);   // original error for transport failures
  }
}
```

`ERROR_CODES` exports the client-side synthetic codes (`TRANSPORT`, `CONFIG`,
`POLLING_TIMEOUT`) and the server `error.code` vocabulary (`NOT_FOUND`,
`PLAN_LIMIT_EXCEEDED`, ...) so retry/breaker layers never restate code strings by
hand.

## License

MIT
