import type { ExtractionItem } from "./extraction";

export function builtAnswerStyle(type: string): string {
  return type === "MULTIPLE_CHOICE" ? "circle" : "written";
}

export function normalizeBuiltReading(item: ExtractionItem, type: string): ExtractionItem {
  if (item.observedStyle) return item;
  return { ...item, observedStyle: type === "MULTIPLE_CHOICE" ? item.markShape ?? "unknown" : "unknown" };
}
