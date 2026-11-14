export const questionTypes = ["MULTIPLE_CHOICE", "IDENTIFICATION", "TRUE_FALSE", "ESSAY"] as const;
export type OutlineType = typeof questionTypes[number];
export type OutlineSection = { type: OutlineType; count: number };
export function parseAdditionalSection(type: unknown, count: unknown, existingCount: number): OutlineSection | null {
  if (typeof type !== "string" || !questionTypes.includes(type as OutlineType) || typeof count !== "string" || !/^\d+$/.test(count)) return null;
  const n = Number(count);
  if (!Number.isInteger(existingCount) || existingCount < 0 || !Number.isInteger(n) || n < 1 || existingCount + n > 200) return null;
  return { type: type as OutlineType, count: n };
}
export function sameQuizOutline(left: OutlineSection[], right: OutlineSection[]): boolean {
  return left.length === right.length && left.every((section, index) => section.type === right[index].type && section.count === right[index].count);
}
export function parseQuizOutline(input: unknown, total: unknown): OutlineSection[] | null {
  const n = Number(total);
  if (!Number.isInteger(n) || n < 1 || n > 200 || !Array.isArray(input) || input.length < 1 || input.length > 50) return null;
  const sections: OutlineSection[] = [];
  for (const value of input) {
    if (!value || typeof value !== "object" || !questionTypes.includes(value.type) || !Number.isInteger(value.count) || value.count < 1 || value.count > 200) return null;
    sections.push({ type: value.type, count: value.count });
  }
  return sections.reduce((sum, section) => sum + section.count, 0) === n ? sections : null;
}
export function questionIsComplete(question: { text: string; type: string; answerKey: { acceptedAnswers: string[] } | null; rubricCriteria: { id: string }[] }): boolean {
  return !!question.text.trim() && (question.type === "ESSAY" ? question.rubricCriteria.length > 0 : !!question.answerKey?.acceptedAnswers.some(answer => answer.trim()));
}
