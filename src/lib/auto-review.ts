type Candidate = { status: string; answer: string | null; observedStyle?: string; markShape?: string; erasure?: string; note: string };
const uncertainty = /\b(?:unclear|uncertain|unsure|ambiguous|maybe|possibly|possible|probably|likely|faint|illegible|unreadable|smudged|multiple|overlap|guess|appears|seems|looks like)\b/i;

// Only recognize standalone, unambiguous rules; other wording stays under teacher control.
export function forbidsErasures(directions: string | null | undefined): boolean {
  return (directions ?? "").split(/[.!?;\n]+/).some(clause => /^(?:no erasures?(?: (?:are )?allowed)?|erasures? (?:are |is )?not allowed)$/i.test(clause.trim()));
}

export function analyzeAutomaticReview(items: Candidate[], expectedStyle: string, type: string, keys?: string[], directions?: string | null): { decision: "FOLLOWED" | "VIOLATION" | null; reason: string | null } {
  const review = (reason: string) => ({ decision: null, reason } as const);
  if (type === "ESSAY") return review("Essay answers need a teacher to score the response using the rubric.");
  if (items.length === 0) return review("No answer was matched to this question. Find it on the paper and enter or confirm the answer.");
  if (items.length > 1) return review("More than one reading was matched to this question. Compare the paper pages and confirm the answer.");
  const item = items[0];
  if (uncertainty.test(item.note)) return review(`The reading was uncertain: ${item.note}`);
  if (/\berased\b/i.test(item.note) && !item.erasure) return review("A possible erasure was noted, but it could not be confirmed. Check the original answer.");
  if (forbidsErasures(directions)) {
    if (item.erasure === "present" && ["clear", "blank", "erased"].includes(item.status)) return { decision: "VIOLATION", reason: null };
    if (item.erasure !== "none") return review("This section says no erasures, but the mark could not be checked for an erasure.");
  }
  if (item.status === "blank" && !item.answer?.trim()) return { decision: "FOLLOWED", reason: null };
  if (item.status === "multiple") return review("More than one answer or mark was detected. Check which answer the student intended.");
  if (item.status === "erased") return review("The answer appears erased or altered. Check the original before confirming it.");
  if (item.status === "unclear") return review("The answer could not be read clearly. Check the photo and confirm the response.");
  if (item.status !== "clear" || !item.answer?.trim()) return review("The answer could not be read reliably. Check the photo and confirm the response.");
  if (!item.observedStyle || item.observedStyle === "unknown") return review("The answer was read, but its marking style could not be confirmed. Check the mark on the paper.");
  if (expectedStyle === "circle" && type === "MULTIPLE_CHOICE" && ["box", "triangle", "written", "underline", "shade"].includes(item.observedStyle)) return { decision: "VIOLATION", reason: null };
  if (requiresLetterReview(item.answer, expectedStyle, type, keys)) return review("The answer key expects a letter, but the reading is not a single letter. Check what the student wrote.");
  if (hasInstructionConcern(items, expectedStyle, type, keys)) return review(`The expected marking style is ${expectedStyle === "text" ? "written" : expectedStyle}, but the detected mark is ${item.observedStyle}. Check the paper.`);
  const expected = expectedStyle === "text" ? "written" : expectedStyle;
  if (item.observedStyle === expected) return { decision: "FOLLOWED", reason: null };
  return review("The marking style could not be confirmed. Check the mark on the paper.");
}

export function automaticDecision(items: Candidate[], expectedStyle: string, type: string, keys?: string[], directions?: string | null): "FOLLOWED" | "VIOLATION" | null {
  return analyzeAutomaticReview(items, expectedStyle, type, keys, directions).decision;
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
