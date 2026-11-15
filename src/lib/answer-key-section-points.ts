export function sectionPointsValue(questions: { type: string; points: number | string }[]): string | null {
  const values = questions.filter(question => question.type !== "ESSAY").map(question => String(question.points));
  if (!values.length) return null;
  return values.every(value => value === values[0] || (value !== "" && values[0] !== "" && Number(value) === Number(values[0]))) ? values[0] : null;
}

export function applyDraftSectionPoints<T extends { section: number; type: string; points: number | string }>(rows: T[], section: number, points: number | string): T[] {
  return rows.map(row => row.section === section && row.type !== "ESSAY" ? { ...row, points } : row);
}
