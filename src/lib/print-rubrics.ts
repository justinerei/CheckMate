type Criterion = { id: string; title: string; description: string; points: string };
type EssayQuestion = { type: string; rubric: Criterion[] };

export function groupSectionRubrics(questions: EssayQuestion[], startNumber: number) {
  const groups: { rubric: Criterion[]; numbers: number[] }[] = [];
  const keys = new Map<string, number>();
  questions.forEach((question, index) => {
    if (question.type !== "ESSAY" || !question.rubric.length) return;
    const key = JSON.stringify(question.rubric.map(c => [c.title, c.description, c.points]));
    const found = keys.get(key);
    if (found !== undefined) groups[found].numbers.push(startNumber + index + 1);
    else { keys.set(key, groups.length); groups.push({ rubric: question.rubric, numbers: [startNumber + index + 1] }); }
  });
  return groups;
}
