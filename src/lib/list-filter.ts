export type PaperFilter = "all" | "progress" | "finalized";
export function matchesSearch(values: (string | null | undefined)[], query: string): boolean {
  const normalized = query.normalize("NFKC").trim().toLocaleLowerCase();
  return !normalized || values.some(value => value?.normalize("NFKC").toLocaleLowerCase().includes(normalized));
}
export function matchesPaperFilter(status: string, filter: PaperFilter): boolean {
  if (filter === "finalized") return status === "FINALIZED";
  if (filter === "progress") return status === "DRAFT" || status === "IN_REVIEW";
  return true;
}
