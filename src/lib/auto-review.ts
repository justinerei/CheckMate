type Candidate = { status: string; answer: string | null; observedStyle?: string; note: string };
export function automaticDecision(items: Candidate[], expectedStyle: string, type: string): "FOLLOWED" | "VIOLATION" | null {
  if (type === "ESSAY" || items.length !== 1) return null;
  const item = items[0];
  if (item.status !== "clear" || !item.answer?.trim() || item.note.trim() || !item.observedStyle || item.observedStyle === "unknown") return null;
  const expected = expectedStyle === "text" ? "written" : expectedStyle;
  if (item.observedStyle === expected) return "FOLLOWED";
  return null;
}
