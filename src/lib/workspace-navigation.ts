export function paperStatus(status: string) { return status === "DRAFT" ? "Uploading" : status === "IN_REVIEW" ? "In review" : status === "FINALIZED" ? "Finalized" : "Unavailable"; }
export function paperDestination(id: string, status: string, pagesRead = false, from?: "quiz" | "papers" | "dashboard" | "batch") { const base = `/submissions/${encodeURIComponent(id)}`; const destination = status === "FINALIZED" || (status === "IN_REVIEW" && pagesRead) ? `${base}/review` : base; return from ? `${destination}?from=${from}` : destination; }
export function quizDestination(id: string, _source: string) { void _source; return `/quizzes/${encodeURIComponent(id)}/overview`; }
export function workspaceActive(pathname: string): "overview" | "quizzes" | "students" | "profile" {
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return "profile";
  if (pathname === "/students" || pathname.startsWith("/students/")) return "students";
  if (pathname === "/quizzes" || pathname.startsWith("/quizzes/")) return "quizzes";
  return "overview";
}
