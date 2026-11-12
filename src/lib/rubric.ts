export type CriterionDraft = { title: string; description: string; maxPoints: number };
const precise = (n: number) => Number.isFinite(n) && Math.abs(n * 100 - Math.round(n * 100)) < 0.000001;
export function validateRubric(criteria: CriterionDraft[], points: number): boolean {
  return Array.isArray(criteria) && criteria.length > 0 && criteria.length <= 20 && precise(points) && criteria.every(c => !!c && typeof c.title === "string" && !!c.title.trim() && c.title.length <= 120 && typeof c.description === "string" && c.description.length <= 1000 && precise(c.maxPoints) && c.maxPoints > 0 && c.maxPoints <= 9999) && Math.round(criteria.reduce((sum, c) => sum + c.maxPoints, 0) * 100) === Math.round(points * 100);
}
export function sumCriterionScores(items: { maxPoints: number; score: number | null }[]): number | null {
  if (!items.length || items.some(i => i.score === null || !precise(i.score) || i.score < 0 || i.score > i.maxPoints)) return null;
  return Math.round(items.reduce((sum, i) => sum + i.score!, 0) * 100) / 100;
}
