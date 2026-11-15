export function parseDraftPoints(value: string | number): number | null {
  const text = String(value);
  const points = Number(text);
  return /^\d+(\.\d{1,2})?$/.test(text) && points > 0 && points <= 9999 ? points : null;
}

type DraftRow = { answer: string; type: string; points: number | string; style: string; section: number; sectionTitle?: string; directions: string; questionText?: string; rubric?: unknown[] };
export function hasAnswerKeyDraft(title: string, rows: DraftRow[]): boolean {
  return !!title.trim() || rows.length !== 1 || rows.some(row => !!row.answer?.trim() || row.type !== "MULTIPLE_CHOICE" || parseDraftPoints(row.points) !== 1 || row.style !== "written" || row.section !== 1 || !!row.sectionTitle?.trim() || !!row.directions?.trim() || !!row.questionText?.trim() || !!row.rubric?.length);
}
