type NavigationQuestion = { id: string; complete: boolean };
type NavigationSection = { id: string; title: string; questions: NavigationQuestion[] };

export function questionNavigation(sections: NavigationSection[], numbering: string) {
  let offset = 0;
  return sections.map(section => {
    const questions = section.questions.map((question, index) => ({ ...question, number: (numbering === 'CONTINUOUS' ? offset : 0) + index + 1 }));
    offset += section.questions.length;
    return { ...section, questions };
  });
}
