type Question = {
  id: string;
  type: string;
  points: { toString(): string } | number | string;
  answerKey: { acceptedAnswers: string[] } | null;
  choices: { label: string; text: string }[];
  rubricCriteria: { title: string; description: string; maxPoints: { toString(): string } | number | string }[];
};
type Section = { id: string; title: string; questions: Question[] };

export function answerKeyPrintSections(sections: Section[], numbering: string) {
  let total = 0;
  return sections.map(section => ({
    id: section.id,
    title: section.title,
    questions: section.questions.map((question, index) => ({
      id: question.id,
      number: numbering === "CONTINUOUS" ? ++total : index + 1,
      type: question.type,
      points: question.points.toString(),
      answers: (question.answerKey?.acceptedAnswers ?? []).filter(answer => answer.trim()).map(answer => {
        const choice = question.type === "MULTIPLE_CHOICE" ? question.choices.find(item => item.label.toLowerCase() === answer.trim().toLowerCase()) : null;
        return choice?.text.trim() ? `${answer.trim()} — ${choice.text.trim()}` : answer.trim();
      }),
      rubric: question.rubricCriteria.map(criterion => ({ title: criterion.title, description: criterion.description, points: criterion.maxPoints.toString() })),
    })),
  }));
}
