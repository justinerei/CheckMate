type Candidate = { status: string; answer: string | null; observedStyle?: string; note: string };
export function automaticDecision(items: Candidate[], expectedStyle: string, type: string, keys?: string[]): "FOLLOWED" | "VIOLATION" | null {
  if (type === "ESSAY" || items.length !== 1) return null;
  const item = items[0];
  if (item.status !== "clear" || !item.answer?.trim() || item.note.trim() || !item.observedStyle || item.observedStyle === "unknown") return null;
  if (requiresLetterReview(item.answer, expectedStyle, type, keys)) return null;
  const expected = expectedStyle === "text" ? "written" : expectedStyle;
  if (item.observedStyle === expected) return "FOLLOWED";
  return null;
}

export function requiresLetterReview(answer: string | null | undefined, style: string, type: string, keys?: string[]) {
  const letter = /^[A-Z]$/i;
  return type === "MULTIPLE_CHOICE" && ["written", "text"].includes(style)
    && !!keys?.length && keys.every(key => letter.test(key.trim()))
    && !!answer?.trim() && !letter.test(answer.trim());
}
