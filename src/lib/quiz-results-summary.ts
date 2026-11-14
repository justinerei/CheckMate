type Question = { id: string; maximum: number; type: string };
type Answer = { questionId: string; objectiveScore: number | null; teacherScore: number | null; instructionDecision: string | null };
type Paper = { status: string; score: number | null; answers: Answer[] };
const valid = (value: number | null): value is number => value !== null && Number.isFinite(value);
const rounded = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function summarizeResults(questions: Question[], papers: Paper[], maximum: number) {
  const finalized = papers.filter(paper => paper.status === "FINALIZED" && valid(paper.score));
  const average = finalized.length ? rounded(finalized.reduce((sum, paper) => sum + paper.score!, 0) / finalized.length) : null;
  const bands = [{ label: "Below 50%", count: 0 }, { label: "50% to below 75%", count: 0 }, { label: "75% to below 90%", count: 0 }, { label: "90–100%", count: 0 }];
  if (maximum > 0) for (const paper of finalized) {
    const percent = paper.score! / maximum * 100;
    if (percent < 0 || percent > 100) continue;
    const index = percent < 50 ? 0 : percent < 75 ? 1 : percent < 90 ? 2 : 3;
    bands[index].count++;
  }
  const items = questions.map(question => {
    const values = finalized.flatMap(paper => {
      const answer = paper.answers.find(item => item.questionId === question.id);
      if (!answer) return [];
      const score = question.type === "ESSAY" ? answer.instructionDecision === "VIOLATION" ? 0 : answer.teacherScore : answer.objectiveScore;
      return valid(score) ? [score] : [];
    });
    const itemAverage = values.length ? rounded(values.reduce((sum, score) => sum + score, 0) / values.length) : null;
    return { id: question.id, maximum: question.maximum, count: values.length, average: itemAverage, percent: itemAverage !== null && question.maximum > 0 ? rounded(itemAverage / question.maximum * 100) : null };
  });
  return { paperCount: finalized.length, average, bands, items };
}
