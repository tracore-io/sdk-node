# @tracore/sdk

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

## Error Handling

```typescript
import { TracoreClient, TracoreError } from '@tracore/sdk';

try {
  await client.workspaces.get('nonexistent');
} catch (error) {
  if (error instanceof TracoreError) {
    console.log(error.status);  // 404
    console.log(error.message); // "Workspace not found"
  }
}
```

## License

MIT
