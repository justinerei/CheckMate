import { defaultEssayRubric, validateRubric, type CriterionDraft } from "./rubric";

type StoredCriterion = { title: string; description: string; maxPoints: { toString(): string } | number | string };
type Essay = { type: string; points: { toString(): string } | number | string; rubricCriteria: StoredCriterion[] };
export function sectionRubric(questions: Essay[], fallbackPoints: number) {
  const essays = questions.filter(q => q.type === "ESSAY");
  const populated = essays.filter(q => q.rubricCriteria.length);
  const base = populated[0]?.rubricCriteria.map(c => ({ title: c.title, description: c.description, maxPoints: Number(c.maxPoints) })) ?? (fallbackPoints < 0.03 ? [{ title: "Response", description: "Quality of the response.", maxPoints: fallbackPoints }] : defaultEssayRubric(fallbackPoints));
  const key = (q: Essay) => JSON.stringify(q.rubricCriteria.map(c => [c.title, c.description, Number(c.maxPoints)]));
  const differs = populated.some(q => key(q) !== key(populated[0])) || essays.some(q => q.rubricCriteria.length && Number(q.points) !== base.reduce((sum, c) => sum + c.maxPoints, 0));
  return { criteria: base, differs };
}
export function rubricFormValue(criteria: CriterionDraft[]) {
  return { rubric: criteria.map(c => `${c.title} | ${c.description} | ${c.maxPoints}`).join("\n"), points: String(Math.round(criteria.reduce((sum, c) => sum + c.maxPoints, 0) * 100) / 100) };
}
export function parseSharedRubric(raw: FormDataEntryValue | null): CriterionDraft[] | null {
  if (typeof raw !== "string" || raw.length > 20000) return null;
  try {
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows)) return null;
    const criteria = rows.map(row => ({ title: typeof row?.title === "string" ? row.title.trim() : "", description: typeof row?.description === "string" ? row.description.trim() : "", maxPoints: typeof row?.points === "string" && /^\d+(\.\d{1,2})?$/.test(row.points) ? Number(row.points) : NaN }));
    const total = Math.round(criteria.reduce((sum, c) => sum + c.maxPoints, 0) * 100) / 100;
    return total <= 9999 && criteria.every(c => c.description && c.description.length <= 500 && !c.title.includes("|") && !c.description.includes("|")) && validateRubric(criteria, total) ? criteria : null;
  } catch { return null; }
}
