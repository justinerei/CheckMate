type Candidate = { status: string; answer: string | null; observedStyle?: string; markShape?: string; erasure?: string; note: string };
const uncertainty = /\b(?:unclear|uncertain|unsure|ambiguous|maybe|possibly|possible|probably|likely|faint|illegible|unreadable|smudged|multiple|overlap|guess|appears|seems|looks like)\b/i;

// Only recognize standalone, unambiguous rules; other wording stays under teacher control.
export function forbidsErasures(directions: string | null | undefined): boolean {
  return (directions ?? "").split(/[.!?;\n]+/).some(clause => /^(?:no erasures?(?: (?:are )?allowed)?|erasures? (?:are |is )?not allowed)$/i.test(clause.trim()));
}

export function automaticDecision(items: Candidate[], expectedStyle: string, type: string, keys?: string[], directions?: string | null): "FOLLOWED" | "VIOLATION" | null {
  if (type === "ESSAY" || items.length !== 1) return null;
  const item = items[0];
  if (uncertainty.test(item.note)) return null;
  if (/\berased\b/i.test(item.note) && !item.erasure) return null;
  if (forbidsErasures(directions)) {
    if (item.erasure === "present" && ["clear", "blank", "erased"].includes(item.status)) return "VIOLATION";
    if (item.erasure !== "none") return null;
  }
  if (item.status === "blank" && !item.answer?.trim()) return "FOLLOWED";
  if (item.status !== "clear" || !item.answer?.trim() || !item.observedStyle || item.observedStyle === "unknown") return null;
  if (expectedStyle === "circle" && type === "MULTIPLE_CHOICE" && ["box", "triangle"].includes(item.observedStyle)) return "VIOLATION";
  if (hasInstructionConcern(items, expectedStyle, type, keys)) return null;
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

export function hasInstructionConcern(items: Candidate[], style: string, type: string, keys?: string[]) {
  const expected = style === "text" ? "written" : style;
  return items.some(item => {
    const observed = item.observedStyle && item.observedStyle !== "unknown"
      ? item.observedStyle
      : item.markShape;
    return (!!observed && observed !== "unknown" && observed !== expected)
      || requiresLetterReview(item.answer, style, type, keys);
  });
}
