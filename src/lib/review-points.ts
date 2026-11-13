type Saved = { reviewStatus: string; instructionDecision: string | null; confirmedText: string | null; objectiveScore: unknown; teacherScore: unknown } | null | undefined;

export function reviewPoints(saved: Saved, finalized: boolean, type: string, keys: string[], points: number, automatic: string | null, suggested: string, objectivePoints: (value: string, accepted: string[], points: number, decision: string | null) => number): number | null {
  const complete = (saved?.reviewStatus === "CONFIRMED" || saved?.reviewStatus === "AUTO_CHECKED") && !!saved.instructionDecision && saved.confirmedText !== null;
  if (complete && saved) {
    if (finalized && type !== "ESSAY") return saved.objectiveScore === null ? null : Number(saved.objectiveScore);
    if (saved.instructionDecision === "VIOLATION") return 0;
    if (type === "ESSAY") return saved.teacherScore === null ? null : Number(saved.teacherScore);
    return objectivePoints(saved.confirmedText!, keys, points, saved.instructionDecision);
  }
  return automatic && keys.length ? objectivePoints(suggested, keys, points, automatic) : null;
}
