type Page = { status: string; retryAt: Date | string | null };
export function paperProgress(status: string, expectedPages: number | null, pages: Page[], review?: { flagged: number; unmatchedBlocked: boolean; nameReviewed: boolean; finalizationBlocked?: boolean }) {
  if (status === "FINALIZED") return { label: "Finalized", action: "View result", review: true };
  if (status === "DRAFT") return { label: "Photos needed", action: "Continue upload", review: false };
  if (review && !review.flagged && !review.unmatchedBlocked && !review.finalizationBlocked && review.nameReviewed) return { label: "Ready to finalize", action: "Finalize", review: true };
  if (pages.some(page => page.status === "FAILED" && !page.retryAt)) return { label: "Page needs attention", action: "Check page", review: false };
  if (pages.some(page => page.status === "FAILED" && page.retryAt)) return { label: "Waiting to continue", action: "View progress", review: false };
  if (expectedPages !== null && expectedPages > 0 && pages.length === expectedPages && pages.every(page => page.status === "COMPLETE")) return review ? review.flagged || review.unmatchedBlocked || review.finalizationBlocked ? { label: "Needs review", action: "Review", review: true } : !review.nameReviewed ? { label: "Confirm student name", action: "Review", review: true } : { label: "Ready to finalize", action: "Finalize", review: true } : { label: "Ready for review", action: "Review", review: true };
  if (pages.some(page => page.status === "PROCESSING")) return { label: "Checking", action: "View progress", review: false };
  return { label: "Waiting to be checked", action: "View progress", review: false };
}
