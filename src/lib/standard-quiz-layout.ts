export function questionRows<T extends { besideNext: boolean }>(questions: T[], start: number, standard: boolean): { question: T; number: number }[][] {
  const rows: { question: T; number: number }[][] = [];
  for (let i = 0; i < questions.length; i++) {
    const row = [{ question: questions[i], number: start + i + 1 }];
    if (!standard && questions[i].besideNext && questions[i + 1]) { i++; row.push({ question: questions[i], number: start + i + 1 }); }
    rows.push(row);
  }
  return rows;
}

export function sectionDirections(instructions: string, types: string[], templates: Record<string, string>, standard: boolean): string {
  if (instructions.trim() || !standard || !types.length || !types.every(type => type === types[0])) return instructions;
  return templates[types[0]] ?? "";
}
