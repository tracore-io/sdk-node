/**
 * Request options that send a `FormData` body as-is.
 *
 * The generated operations default to JSON: they serialize the body with
 * `JSON.stringify` (a `FormData` becomes `"{}"`) and set
 * `Content-Type: application/json`. Disabling the serializer passes the
 * `FormData` through, and clearing the header lets `fetch` set
 * `multipart/form-data` with its boundary.
 */
export const multipartBody = {
	bodySerializer: null,
	headers: { 'Content-Type': null },
} as const;
