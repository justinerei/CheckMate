export type ExtractionItem = { number: number | null; section: number | null; answer: string | null; status: "clear" | "blank" | "unclear" | "multiple" | "erased"; note: string };
export function parseExtraction(input: string): { items: ExtractionItem[] } | null {
  try {
    const value = JSON.parse(input);
    if (!value || !Array.isArray(value.items) || value.items.length > 200) return null;
    const positive = (x: unknown) => x === null || (typeof x === "number" && Number.isInteger(x) && x > 0 && x <= 500);
    for (const item of value.items) {
      if (!item || !positive(item.number) || !positive(item.section) || !(item.answer === null || (typeof item.answer === "string" && item.answer.length <= 4000)) || !["clear", "blank", "unclear", "multiple", "erased"].includes(item.status) || typeof item.note !== "string" || item.note.length > 500) return null;
    }
    return { items: value.items.map((i: ExtractionItem) => ({ number: i.number, section: i.section, answer: i.answer, status: i.status, note: i.note })) };
  } catch { return null; }
}
export function matchCandidates(questions: { id: string; number: number; section: number }[], items: ExtractionItem[]) {
  const byQuestion: Record<string, ExtractionItem[]> = Object.create(null);
  const unmatched: ExtractionItem[] = [];
  for (const item of items) {
    const candidates = questions.filter(q => q.number === item.number && (item.section === null || q.section === item.section));
    if (candidates.length !== 1) unmatched.push(item);
    else (byQuestion[candidates[0].id] ??= []).push(item);
  }
  return { byQuestion, unmatched };
}
export function retryDelayMs(header: string | null, now: number) {
  if (!header) return 60000;
  if (/^\d+$/.test(header)) return Math.min(Number(header) * 1000, 604800000);
  const date = Date.parse(header);
  return Number.isFinite(date) ? Math.max(0, Math.min(date - now, 604800000)) : 60000;
}
