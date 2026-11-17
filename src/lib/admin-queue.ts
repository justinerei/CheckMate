export type RetryablePage = { id: string; status: string; retryAt: string | null; batch: boolean; inReview: boolean };

export function canRetryPage(page: RetryablePage) {
  return page.status === "FAILED" && !page.retryAt && page.batch && page.inReview;
}

export function eligibleVisiblePageIds(pages: RetryablePage[], status: string) {
  return pages.filter(page => (status === "ALL" || page.status === status) && canRetryPage(page)).slice(0, 100).map(page => page.id);
}
