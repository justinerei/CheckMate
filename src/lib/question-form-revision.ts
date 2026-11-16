type FormSnapshot = { id: string; type: string; text: string; points: string; choices: { label: string; text: string }[]; answers: string[]; rubric: { title: string; description: string; points: string }[]; lines: number; besideNext: boolean };

export function questionFormRevision(snapshot: FormSnapshot): string {
  return JSON.stringify([snapshot.id, snapshot.type, snapshot.text, snapshot.points, snapshot.choices.map(choice => [choice.label, choice.text]), snapshot.answers, snapshot.rubric.map(criterion => [criterion.title, criterion.description, criterion.points]), snapshot.lines, snapshot.besideNext]);
}
