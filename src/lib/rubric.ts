export type CriterionDraft = { title: string; description: string; maxPoints: number };
export function defaultEssayRubric(points: number): CriterionDraft[] {
  const total = Number.isFinite(points) && points > 0 ? points : 1;
  const scale = Number.isInteger(total) && total >= 3 ? 1 : 100;
  const units = Math.round(total * scale);
  const part = Math.floor(units / 3), remainder = units % 3;
  return [
    { title: "Accuracy", description: "Correctness of facts and concepts.", maxPoints: (part + (remainder > 0 ? 1 : 0)) / scale },
    { title: "Explanation", description: "Clarity and completeness of the explanation.", maxPoints: (part + (remainder > 1 ? 1 : 0)) / scale },
    { title: "Organization", description: "Logical structure and flow of ideas.", maxPoints: part / scale },
  ];
}
const precise = (n: number) => Number.isFinite(n) && Math.abs(n * 100 - Math.round(n * 100)) < 0.000001;
export function validateRubric(criteria: CriterionDraft[], points: number): boolean {
  return Array.isArray(criteria) && criteria.length > 0 && criteria.length <= 20 && precise(points) && criteria.every(c => !!c && typeof c.title === "string" && !!c.title.trim() && c.title.length <= 120 && typeof c.description === "string" && c.description.length <= 1000 && precise(c.maxPoints) && c.maxPoints > 0 && c.maxPoints <= 9999) && Math.round(criteria.reduce((sum, c) => sum + c.maxPoints, 0) * 100) === Math.round(points * 100);
}
export function sumCriterionScores(items: { maxPoints: number; score: number | null }[]): number | null {
  if (!items.length || items.some(i => i.score === null || !precise(i.score) || i.score < 0 || i.score > i.maxPoints)) return null;
  return Math.round(items.reduce((sum, i) => sum + i.score!, 0) * 100) / 100;
}
