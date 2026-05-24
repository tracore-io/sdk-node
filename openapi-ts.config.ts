import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
	// The spec is downloaded from the api-vX.Y.Z release asset by sync.yml and
	// kept gitignored; only the generated output under src/generated is committed.
	input: './openapi.yaml',
	output: './src/generated',
	parser: {
		// Public SDK strips operations on EITHER extension:
		//   x-openapi-codegen-skip — also stripped from the internal SDK + docs
		//     (currently /billing/webhook, the Stripe-only external POST).
		//   x-internal             — kept in the internal SDK because the web app
		//     needs it; stripped here + from the docs site (currently /billing/checkout,
		//     /billing/portal, /user/subscription).
		patch: {
			input: (spec) => {
				const paths = (spec as { paths?: Record<string, Record<string, unknown>> }).paths;
				if (!paths) return;
				for (const pathItem of Object.values(paths)) {
					for (const [method, operation] of Object.entries(pathItem)) {
						if (
							operation &&
							typeof operation === 'object' &&
							((operation as Record<string, unknown>)['x-openapi-codegen-skip'] === true ||
								(operation as Record<string, unknown>)['x-internal'] === true)
						) {
							delete pathItem[method];
						}
					}
				}
			},
		},
	},
	plugins: ['@hey-api/typescript', '@hey-api/sdk', { name: '@hey-api/client-fetch', bundle: true }],
});
