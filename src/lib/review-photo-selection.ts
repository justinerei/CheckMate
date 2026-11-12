/** Use extraction's page numbers when available; otherwise show all originals without guessing. */
export function selectReviewPages<T extends { pageNumber: number }>(pages: T[], detectedNumbers: number[]) {
  const numbers = new Set(detectedNumbers);
  const matched = pages.filter(page => numbers.has(page.pageNumber));
  return { matched, visible: matched.length ? matched : pages };
}
