export function parseCorrectedAnswers(raw: string, source: string, type: string, choiceLabels: string[]): string[] | null {
  const answers = raw.split("|").map(answer => answer.trim()).filter(Boolean);
  if (!answers.length || raw.length > 500) return null;
  if (source !== "BUILT") return answers;
  if (type === "MULTIPLE_CHOICE") {
    const answer = answers[0].toUpperCase();
    return answers.length === 1 && choiceLabels.includes(answer) ? [answer] : null;
  }
  if (type === "TRUE_FALSE") {
    const answer = answers[0].toUpperCase();
    return answers.length === 1 && ["T", "F"].includes(answer) ? [answer] : null;
  }
  if (type === "IDENTIFICATION") return answers.every(answer => answer.length <= 200) ? answers : null;
  return null;
}
