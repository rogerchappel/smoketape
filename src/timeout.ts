/** The largest delay accepted by Node's setTimeout without overflow. */
export const MAX_TIMEOUT_MS = 2_147_483_647;

export const TIMEOUT_ERROR_SUFFIX = `must be a positive integer no greater than ${MAX_TIMEOUT_MS}`;
