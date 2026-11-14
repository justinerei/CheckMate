export type PaperOrigin = "quiz" | "papers" | "dashboard" | "batch" | "students";
export function paperOrigin(value: unknown): PaperOrigin | null {
  return value === "quiz" || value === "papers" || value === "dashboard" || value === "batch" || value === "students" ? value : null;
}
export function paperReviewUrl(id: string, origin: unknown): string {
  const from = paperOrigin(origin);
  return `/submissions/${encodeURIComponent(id)}/review${from ? `?from=${from}` : ""}`;
}
export function paperBackDestination(paper: { id: string; quizId: string; batchId: string | null; studentId?: string | null }, from: unknown, origin?: unknown): { href: string; label: string } {
  if (from === "review") return { href: paperReviewUrl(paper.id, origin), label: "Back to review" };
  if (from === "quiz") return { href: `/quizzes/${encodeURIComponent(paper.quizId)}/overview`, label: "Back to quiz" };
  if (from === "students") return paper.studentId ? { href: `/students?student=${encodeURIComponent(paper.studentId)}#student-${encodeURIComponent(paper.studentId)}`, label: "Back to student history" } : { href: "/students", label: "Back to students" };
  if (from === "papers") return { href: "/submissions", label: "Back to student papers" };
  if (from === "dashboard") return { href: "/dashboard", label: "Back to dashboard" };
  if (paper.batchId) return { href: `/batches/${encodeURIComponent(paper.batchId)}`, label: "Back to batch" };
  return { href: "/submissions", label: "Back to student papers" };
}
export function quizChildBackDestination(id: string, from: unknown): { href: string; label: string } {
  return from === "editor" ? { href: `/quizzes/${encodeURIComponent(id)}`, label: "Back to quiz editor" } : { href: `/quizzes/${encodeURIComponent(id)}/overview`, label: "Back to quiz" };
}
