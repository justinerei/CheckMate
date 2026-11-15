export type ExtractionItem = { number: number | null; section: number | null; answer: string | null; status: "clear" | "blank" | "unclear" | "multiple" | "erased"; note: string; erasure?: "present" | "none" | "uncertain"; markShape?: "circle" | "box" | "triangle" | "unknown"; observedStyle?: "written" | "circle" | "shade" | "box" | "triangle" | "underline" | "other" | "unknown" };

export function targetedCircleReading(item: ExtractionItem, input: unknown): ExtractionItem {
  const data = input as { handwritten_next_to_number?: unknown; circled_choices?: unknown; uncertain?: unknown } | null;
  const choices = data?.circled_choices;
  const confirmed = data?.uncertain === false && data.handwritten_next_to_number === null && Array.isArray(choices) && choices.length === 1 && typeof choices[0] === "string" && /^[A-D]$/i.test(choices[0].trim()) && choices[0].trim().toUpperCase() === item.answer?.trim().toUpperCase();
  return confirmed ? item : { ...item, status: "unclear", note: "The focused mark check did not confirm this circle. Check the photo." };
}

export function verifyCircleReadings(items: ExtractionItem[], verification: ExtractionItem[]): ExtractionItem[] {
  return items.map(item => {
    if (item.status !== "clear" || (item.observedStyle ?? item.markShape) !== "circle") return item;
    const matches = verification.filter(check => check.number === item.number && (check.section === null || item.section === null || check.section === item.section));
    const check = matches[0];
    if (item.number !== null && matches.length === 1 && check.status === "clear" && !/\b(?:unclear|uncertain|unsure|ambiguous|maybe|possibly|possible|probably|likely|faint|illegible|unreadable|smudged|multiple|overlap|guess|appears|seems)\b/i.test(check.note) && (check.observedStyle ?? check.markShape) === "circle" && !!item.answer?.trim() && check.answer?.trim().toUpperCase() === item.answer.trim().toUpperCase()) return item;
    return { ...item, status: "unclear", note: "Independent mark reading did not confirm this circle and answer. Check the photo." };
  });
}
export function parseExtraction(input: string): { items: ExtractionItem[]; studentName?: string | null } | null {
  try {
    const value = JSON.parse(input);
    if (!value || !Array.isArray(value.items) || value.items.length > 200 || (value.studentName !== undefined && value.studentName !== null && (typeof value.studentName !== "string" || value.studentName.length > 120))) return null;
    const positive = (x: unknown) => x === null || (typeof x === "number" && Number.isInteger(x) && x > 0 && x <= 500);
    for (const item of value.items) {
      if (!item || !positive(item.number) || !positive(item.section) || !(item.answer === null || (typeof item.answer === "string" && item.answer.length <= 4000)) || !["clear", "blank", "unclear", "multiple", "erased"].includes(item.status) || typeof item.note !== "string" || item.note.length > 500) return null;
      if (item.observedStyle !== undefined && !["written", "circle", "shade", "box", "triangle", "underline", "other", "unknown"].includes(item.observedStyle)) return null;
      if (item.erasure !== undefined && !["present", "none", "uncertain"].includes(item.erasure)) return null;
      if (item.markShape !== undefined && !["circle", "box", "triangle", "unknown"].includes(item.markShape)) return null;
    }
    return { items: value.items.map((i: ExtractionItem) => ({ number: i.number, section: i.section, answer: i.answer, status: i.status, note: i.note, ...(i.erasure !== undefined ? { erasure: i.erasure } : {}), ...(i.markShape !== undefined ? { markShape: i.markShape } : {}), ...(i.observedStyle !== undefined ? { observedStyle: i.observedStyle } : {}) })), ...(value.studentName !== undefined ? { studentName: value.studentName } : {}) };
  } catch { return null; }
}
export function needsReview(items: ExtractionItem[], confirmed: boolean, multipleChoice = false) {
  if (confirmed) return false;
  if (items.length !== 1) return true;
  const item = items[0];
  if (item.status === "blank") return false;
  if (item.status !== "clear" || !item.answer?.trim()) return true;
  return multipleChoice && (!item.markShape || item.markShape === "unknown");
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

// Eligibility never treats an AI observation as a teacher decision; it only
// identifies suggestions that may be presented for explicit group review.
export function canConfirmClearSuggestion(items: ExtractionItem[], expectedStyle: string, questionType: string, alreadySaved: boolean) {
  if (alreadySaved || questionType === "ESSAY" || items.length !== 1) return false;
  const item = items[0];
  const expected = expectedStyle === "text" ? "written" : expectedStyle;
  return item.status === "clear" && !!item.answer?.trim() && !!item.observedStyle && item.observedStyle !== "unknown" && item.observedStyle === expected;
}
