export type SuggestedQuestion = { questionId: string; text: string; choices: string[]; answer: string; sourceModuleId: string; sourceName: string; sourcePage: number };
type Source = { id: string; moduleId: string; name: string; page: number };
export function parseSuggestedQuestions(input: unknown, ids: string[], type: string, sources: Source[]): SuggestedQuestion[] | null {
  if (!input || typeof input !== "object" || !("questions" in input) || !Array.isArray(input.questions) || input.questions.length !== ids.length) return null;
  const output: SuggestedQuestion[] = [];
  for (const [index, row] of input.questions.entries()) {
    if (!row || typeof row !== "object" || typeof row.text !== "string" || !row.text.trim() || row.text.length > 2000 || typeof row.source !== "string") return null;
    const source = sources.find(item => item.id === row.source);
    if (!source) return null;
    const choices = Array.isArray(row.choices) ? row.choices : [];
    if (type === "MULTIPLE_CHOICE" && (choices.length !== 4 || choices.some((choice: unknown) => typeof choice !== "string" || !choice.trim() || choice.length > 500) || new Set(choices.map((choice: string) => choice.normalize("NFKC").trim().toLowerCase())).size !== choices.length)) return null;
    const answer = typeof row.answer === "string" ? row.answer.trim() : "";
    if ((type === "MULTIPLE_CHOICE" && !["A", "B", "C", "D"].includes(answer)) || (type === "TRUE_FALSE" && !["T", "F"].includes(answer)) || (type === "IDENTIFICATION" && (!answer || answer.length > 200))) return null;
    output.push({ questionId: ids[index], text: row.text.trim(), choices: type === "MULTIPLE_CHOICE" ? choices.map((choice: string) => choice.trim()) : [], answer: type === "ESSAY" ? "" : answer, sourceModuleId: source.moduleId, sourceName: source.name, sourcePage: source.page });
  }
  return output;
}
