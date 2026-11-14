import { automaticDecision } from "@/lib/auto-review";
import { normalizeBuiltReading } from "@/lib/built-review";
import { matchCandidates, parseExtraction, type ExtractionItem } from "@/lib/extraction";
import { reviewPoints } from "@/lib/review-points";
import { requiresUnmatchedReview } from "@/lib/review-safety";
import { objectivePoints } from "@/lib/scoring";
import { pagesComplete } from "@/lib/submission-upload";

type Question = { id: string; number: number; section: number; type: string; answerStyle: string; instructions: string; points: { toString(): string } | number; answerKey: { acceptedAnswers: string[] } | null };
type Paper = { expectedPages: number | null; nameReviewed: boolean; pages: { pageNumber: number; status: string; extraction: unknown }[]; answers: { questionId: string; reviewStatus: string; confirmedText: string | null; instructionDecision: string | null; objectiveScore: unknown; teacherScore: unknown }[] };
export function paperReviewSummary(paper: Paper, questions: Question[], source: string) {
  const suggestions: Record<string, ExtractionItem[]> = Object.create(null);
  let unmatched = 0;
  let invalidReading = false;
  for (const page of paper.pages) {
    const parsed = page.extraction ? parseExtraction(JSON.stringify(page.extraction)) : null;
    if (!parsed) { invalidReading = true; continue; }
    const mapped = matchCandidates(questions, source === "EXISTING" ? parsed.items.map(item => ({ ...item, section: null })) : parsed.items);
    unmatched += mapped.unmatched.length;
    for (const [id, readings] of Object.entries(mapped.byQuestion)) {
      const question = questions.find(item => item.id === id)!;
      (suggestions[id] ??= []).push(...readings.map(item => source === "BUILT" ? normalizeBuiltReading(item, question.type) : item));
    }
  }
  const unfinished = paper.pages.some(page => page.status !== "COMPLETE");
  const points = questions.map(question => {
    const saved = paper.answers.find(answer => answer.questionId === question.id);
    const items = suggestions[question.id] ?? [];
    const automatic = !saved && !unfinished ? automaticDecision(items, question.answerStyle, question.type, question.answerKey?.acceptedAnswers, question.instructions) : null;
    return reviewPoints(saved, false, question.type, question.answerKey?.acceptedAnswers ?? [], Number(question.points), automatic, items[0]?.answer ?? "", objectivePoints);
  });
  const flagged = points.filter(point => point === null).length;
  const unmatchedBlocked = requiresUnmatchedReview(unmatched, questions, paper.answers);
  const manuallyComplete = questions.every(question => paper.answers.some(answer => answer.questionId === question.id && answer.reviewStatus === "CONFIRMED" && answer.confirmedText !== null));
  const finalizationReason = !questions.length ? "The answer key has no questions." : !pagesComplete(paper.expectedPages, paper.pages.map(page => page.pageNumber)) ? "Upload and confirm all paper pages before finalizing." : !manuallyComplete && (unfinished || invalidReading) ? "Finish checking all pages or confirm every answer manually." : questions.some(question => question.type !== "ESSAY" && !question.answerKey?.acceptedAnswers.length) ? "A question is missing its answer key." : null;
  const finalizationBlocked = !!finalizationReason;
  return { flagged, unmatchedBlocked, finalizationBlocked, finalizationReason, nameReviewed: paper.nameReviewed, proposed: points.reduce<number>((sum, point) => sum + (point ?? 0), 0) };
}
