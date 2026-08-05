import { describe, expect, it } from 'vitest';

import { ERROR_CODES, normalizeError, TracoreError } from './errors';

describe('normalizeError', () => {
	it('returns a TracoreError input unchanged', () => {
		const original = new TracoreError(404, 'gone', ERROR_CODES.NOT_FOUND);
		expect(normalizeError(original)).toBe(original);
	});

	it('maps a raw API error-envelope body with the response status', () => {
		const body = {
			error: { code: 'NOT_FOUND', message: 'Workspace not found', details: { slug: 'x' } },
		};
		const err = normalizeError(body, { status: 404 });
		expect(err).toBeInstanceOf(TracoreError);
		expect(err.status).toBe(404);
		expect(err.code).toBe(ERROR_CODES.NOT_FOUND);
		expect(err.message).toBe('Workspace not found');
		expect(err.details).toEqual({ slug: 'x' });
	});

	it('maps an envelope nested under err.body (thrown ApiError shape)', () => {
		const thrown = Object.assign(new Error('Request failed'), {
			status: 403,
			body: { error: { code: 'plan_limit_exceeded', message: 'Upgrade required' } },
		});
		const err = normalizeError(thrown);
		expect(err.status).toBe(403);
		expect(err.code).toBe(ERROR_CODES.PLAN_LIMIT_EXCEEDED);
		expect(err.message).toBe('Upgrade required');
	});

	it('normalizes a status-less thrown error into a transport error with cause', () => {
		const network = new TypeError('fetch failed');
		const err = normalizeError(network);
		expect(err.status).toBe(0);
		expect(err.code).toBe(ERROR_CODES.TRANSPORT);
		expect(err.message).toBe('fetch failed');
		expect(err.cause).toBe(network);
	});

	it('keeps the response status for thrown errors without their own status', () => {
		const thrown = new Error('boom');
		const err = normalizeError(thrown, { status: 502 });
		expect(err.status).toBe(502);
		expect(err.code).toBeUndefined();
		expect(err.cause).toBe(thrown);
	});

	it('falls back to a transport error for unrecognized input, keeping it as cause', () => {
		const err = normalizeError('weird');
		expect(err.status).toBe(0);
		expect(err.code).toBe(ERROR_CODES.TRANSPORT);
		expect(err.cause).toBe('weird');
	});

	it('keeps the real HTTP status for non-envelope error bodies', () => {
		// e.g. an HTML 502 page from a proxy: primitive body + a real response status.
		const err = normalizeError('Bad Gateway', { status: 502 });
		expect(err.status).toBe(502);
		expect(err.code).toBeUndefined();
		expect(err.message).toBe('Bad Gateway');
		expect(err.cause).toBe('Bad Gateway');
	});

	it('does not label empty-bodied HTTP errors as transport failures', () => {
		const err = normalizeError('', { status: 503 });
		expect(err.status).toBe(503);
		expect(err.code).toBeUndefined();
		expect(err.message).toBe('An unexpected error occurred');
	});
});
