type Page = { status: string; retryAt: Date | string | null };
type Paper = { status: string; expectedPages: number | null; pages: Page[] };

/** Count completed readings, not time spent or scores. Draft papers have not started checking. */
export function readingProgress(papers: Paper[]) {
  const started = papers.filter(paper => paper.status !== "DRAFT");
  const pages = started.flatMap(paper => paper.pages);
  const total = started.reduce((sum, paper) => sum + Math.max(paper.expectedPages ?? 0, paper.pages.length), 0);
  const completed = pages.filter(page => page.status === "COMPLETE").length;
  const state = pages.some(page => page.status === "PROCESSING") ? "Reading page"
    : pages.some(page => page.status === "FAILED" && !page.retryAt) ? "Needs attention"
    : pages.some(page => page.status === "FAILED" && page.retryAt) ? "Waiting to retry"
    : total > 0 && completed === total ? "Pages read"
    : "Queued for checking";
  return { total, completed, state };
}
