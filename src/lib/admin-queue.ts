export type RetryablePage = { id: string; status: string; retryAt: string | null; batch: boolean; inReview: boolean };

export function initialQueueStatus(status?: string) {
  return ["ALL", "NEEDS_ATTENTION", "PENDING", "PROCESSING", "COMPLETE", "FAILED"].includes(status ?? "") ? status! : "NEEDS_ATTENTION";
}

export function matchesQueueStatus(page: { status: string }, status: string) {
  return status === "ALL" || page.status === (status === "NEEDS_ATTENTION" ? "FAILED" : status);
}

export function canRetryPage(page: RetryablePage) {
  return page.status === "FAILED" && !page.retryAt && page.batch && page.inReview;
}

export function eligibleVisiblePageIds(pages: RetryablePage[], status: string) {
  return pages.filter(page => matchesQueueStatus(page, status) && canRetryPage(page)).slice(0, 100).map(page => page.id);
}
