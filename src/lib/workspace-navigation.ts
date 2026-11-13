export function paperStatus(status: string) { return status === "DRAFT" ? "Uploading" : status === "IN_REVIEW" ? "In review" : status === "FINALIZED" ? "Finalized" : "Unavailable"; }
export function paperDestination(id: string, status: string, pagesRead = false) { const base = `/submissions/${encodeURIComponent(id)}`; return status === "FINALIZED" || (status === "IN_REVIEW" && pagesRead) ? `${base}/review` : base; }
export function quizDestination(id: string, _source: string) { void _source; return `/quizzes/${encodeURIComponent(id)}/overview`; }
