/** Only retry brief provider cooldowns automatically; longer limits need user attention. */
export function shortRetrySeconds(status: number, retryAfter: unknown, attempts: number): number | null {
  if (status !== 429 || typeof retryAfter !== "number" || !Number.isInteger(retryAfter) || retryAfter < 1 || retryAfter > 20 || attempts >= 2) return null;
  return retryAfter;
}
