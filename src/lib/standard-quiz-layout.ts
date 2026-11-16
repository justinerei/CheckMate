export type QuestionLayout = "CUSTOM" | "SINGLE_COLUMN" | "TWO_COLUMN";
export function validQuestionLayout(value: unknown): value is QuestionLayout {
  return value === "CUSTOM" || value === "SINGLE_COLUMN" || value === "TWO_COLUMN";
}

export function questionRows<T extends { besideNext: boolean }>(questions: T[], start: number, standard: boolean, preset: QuestionLayout = "CUSTOM"): { question: T; number: number }[][] {
  const rows: { question: T; number: number }[][] = [];
  for (let i = 0; i < questions.length; i++) {
    const row = [{ question: questions[i], number: start + i + 1 }];
    if (!standard && (preset === "TWO_COLUMN" || (preset === "CUSTOM" && questions[i].besideNext)) && questions[i + 1]) { i++; row.push({ question: questions[i], number: start + i + 1 }); }
    rows.push(row);
  }
  return rows;
}

export function sectionDirections(instructions: string, types: string[], templates: Record<string, string>, standard: boolean): string {
  if (instructions.trim() || !standard || !types.length || !types.every(type => type === types[0])) return instructions;
  return templates[types[0]] ?? "";
}
