import { afterEach, describe, expect, it, vi } from 'vitest';

import { TracoreClient } from './client';
import { ERROR_CODES, TracoreError } from './helpers/errors';

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

function formKeys(form: FormData): string[] {
	const keys: string[] = [];
	form.forEach((_value, key) => {
		keys.push(key);
	});
	return keys;
}

function makeClient() {
	return new TracoreClient({ apiKey: 'test-key', baseUrl: 'https://api.test.local' });
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('extractAsync', () => {
	it('returns the 202 accepted envelope without a follow-up GET', async () => {
		const calls: Array<{ method: string; url: string }> = [];
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: Request) => {
				calls.push({ method: input.method, url: input.url });
				return jsonResponse(202, { runId: 'run_123', status: 'pending' });
			}),
		);

		const accepted = await makeClient().extractAsync('ws', 'invoice', {
			documentId: 'doc_1',
		});

		expect(accepted).toEqual({ runId: 'run_123', status: 'pending' });
		expect(calls).toHaveLength(1);
		expect(calls[0]?.method).toBe('POST');
	});

	it('throws a typed error carrying the API envelope on failure', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () =>
				jsonResponse(403, {
					error: { code: 'plan_limit_exceeded', message: 'Upgrade required' },
				}),
			),
		);

		const err = await makeClient()
			.extractAsync('ws', 'invoice', { documentId: 'doc_1' })
			.catch((e: unknown) => e);

		expect(err).toBeInstanceOf(TracoreError);
		const te = err as TracoreError;
		expect(te.status).toBe(403);
		expect(te.code).toBe(ERROR_CODES.PLAN_LIMIT_EXCEEDED);
		expect(te.message).toBe('Upgrade required');
	});
});

describe('extract', () => {
	it('fetches the initial run state after the POST when poll is off', async () => {
		const calls: Array<{ method: string; url: string }> = [];
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: Request) => {
				calls.push({ method: input.method, url: input.url });
				if (input.method === 'POST') {
					return jsonResponse(202, { runId: 'run_123', status: 'pending' });
				}
				return jsonResponse(200, { id: 'run_123', status: 'pending' });
			}),
		);

		const run = await makeClient().extract('ws', 'invoice', { documentId: 'doc_1' });

		expect(run.id).toBe('run_123');
		expect(calls).toHaveLength(2);
		expect(calls[1]?.method).toBe('GET');
		expect(calls[1]?.url).toContain('/runs/run_123');
	});
});

describe('extract request body', () => {
	const schema = {
		type: 'object',
		properties: { total: { type: 'number' } },
	};

	function captureRequest() {
		const captured: { request?: Request } = {};
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: Request) => {
				captured.request = input;
				return jsonResponse(202, { runId: 'run_123', status: 'pending' });
			}),
		);
		return captured;
	}

	it('sends a file upload as real multipart with every field before the file', async () => {
		const captured = captureRequest();

		await makeClient().extractAsync(
			'ws',
			'invoice',
			{ file: new Blob(['%PDF-1.4'], { type: 'application/pdf' }), name: 'invoice.pdf' },
			{
				versionNumber: 2,
				schema,
				schemaName: 'Invoice',
				description: 'Supplier invoices',
				model: 'mistral/mistral-small-latest',
			},
		);

		const request = captured.request as Request;
		expect(request.headers.get('content-type')).toMatch(/^multipart\/form-data; boundary=/);

		const form = await request.formData();
		expect(formKeys(form)).toEqual([
			'name',
			'versionNumber',
			'schema',
			'schemaName',
			'description',
			'model',
			'file',
		]);
		expect(form.get('name')).toBe('invoice.pdf');
		expect(JSON.parse(form.get('schema') as string)).toEqual(schema);
		expect(form.get('schemaName')).toBe('Invoice');
		expect(form.get('description')).toBe('Supplier invoices');
		expect(await (form.get('file') as File).text()).toBe('%PDF-1.4');
	});

	it('sends the inline schema in the JSON body for an existing document', async () => {
		const captured = captureRequest();

		await makeClient().extractAsync(
			'ws',
			'invoice',
			{ documentId: 'doc_1' },
			{ schema, schemaName: 'Invoice', description: 'Supplier invoices' },
		);

		const request = captured.request as Request;
		expect(request.url).toContain('/documents/doc_1/extract');
		expect(await request.json()).toEqual({
			schema,
			schemaName: 'Invoice',
			description: 'Supplier invoices',
		});
	});
});

describe('documents.upload request body', () => {
	it('sends real multipart with name before the file', async () => {
		const captured: { request?: Request } = {};
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: Request) => {
				captured.request = input;
				return jsonResponse(201, { id: 'doc_1' });
			}),
		);

		await makeClient().documents.upload(
			'ws',
			'invoice',
			new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
			'invoice.pdf',
		);

		const request = captured.request as Request;
		expect(request.headers.get('content-type')).toMatch(/^multipart\/form-data; boundary=/);
		const form = await request.formData();
		expect(formKeys(form)).toEqual(['name', 'file']);
		expect(await (form.get('file') as File).text()).toBe('%PDF-1.4');
	});
});

describe('resource error normalization', () => {
	it('surfaces API envelope errors with real status and code', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () =>
				jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Workspace not found' } }),
			),
		);

		const err = await makeClient()
			.workspaces.get('nope')
			.catch((e: unknown) => e);

		expect(err).toBeInstanceOf(TracoreError);
		const te = err as TracoreError;
		expect(te.status).toBe(404);
		expect(te.code).toBe(ERROR_CODES.NOT_FOUND);
		expect(te.message).toBe('Workspace not found');
	});

	it('normalizes network failures into transport errors preserving the cause', async () => {
		const network = new TypeError('fetch failed');
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				throw network;
			}),
		);

		const err = await makeClient()
			.workspaces.get('any')
			.catch((e: unknown) => e);

		expect(err).toBeInstanceOf(TracoreError);
		const te = err as TracoreError;
		expect(te.status).toBe(0);
		expect(te.code).toBe(ERROR_CODES.TRANSPORT);
		expect(te.cause).toBe(network);
	});
});
