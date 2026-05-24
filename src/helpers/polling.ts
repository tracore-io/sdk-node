import type { Client } from '../generated/client';
import { getRunById } from '../generated/sdk.gen';
import type { Run } from '../generated/types.gen';
import { normalizeError, TracoreError } from './errors';

/** Options for polling a run until completion. */
export interface PollOptions {
	/** Interval between poll requests in milliseconds. @default 1000 */
	intervalMs?: number;
	/** Maximum number of poll attempts before timing out. @default 60 */
	maxAttempts?: number;
	/** Callback invoked on each poll with the current run state. */
	onProgress?: (run: Run) => void;
}

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'validation_failed']);

/**
 * Poll a run until it reaches a terminal status.
 * @internal
 */
export async function pollRun(
	client: Client,
	runId: string,
	options: PollOptions = {},
): Promise<Run> {
	const { intervalMs = 1000, maxAttempts = 60, onProgress } = options;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const { data, error } = await getRunById({
			client,
			path: { id: runId },
		});

		if (error) {
			throw normalizeError(error);
		}

		const run = data as Run;

		if (TERMINAL_STATUSES.has(run.status)) {
			return run;
		}

		onProgress?.(run);
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}

	throw new TracoreError(408, `Polling timed out after ${maxAttempts} attempts for run ${runId}`);
}
