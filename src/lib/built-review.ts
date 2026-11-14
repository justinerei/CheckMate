import type { ExtractionItem } from "./extraction";

export function builtAnswerStyle(type: string): string {
  return type === "MULTIPLE_CHOICE" ? "circle" : "written";
}

export function normalizeBuiltReading(item: ExtractionItem, type: string): ExtractionItem {
  if (item.observedStyle) return item;
  // Built true/false and identification questions have a dedicated written-answer
  // blank. When extraction omits the style entirely, use that layout as a fallback;
  // an explicitly unknown or different mark must remain subject to review.
  const observedStyle = item.markShape ?? ((type === "TRUE_FALSE" || type === "IDENTIFICATION") && item.status === "clear" && item.answer?.trim() ? "written" : "unknown");
  return { ...item, observedStyle };
}
