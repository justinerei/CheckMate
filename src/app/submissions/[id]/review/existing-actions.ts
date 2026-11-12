"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { canConfirmClearSuggestion, matchCandidates, parseExtraction, type ExtractionItem } from "@/lib/extraction";
import { objectivePoints } from "@/lib/scoring";
import { revalidatePath } from "next/cache";
import { sumCriterionScores } from "@/lib/rubric";
import { automaticDecision } from "@/lib/auto-review";
import { pagesComplete } from "@/lib/submission-upload";

export async function saveExistingAnswer(submissionId: string, questionId: string, _state: { message: string; ok: boolean }, form: FormData) {
  const teacher = await getTeacher(); if (!teacher) return { message: "Please sign in again.", ok: false };
  const answer = form.get("answer"), comment = form.get("comment"), blank = form.get("blank") === "on", rawScore = form.get("score"), instruction = form.get("instruction");
  if (typeof answer !== "string" || answer.length > 4000 || typeof comment !== "string" || comment.length > 4000 || (blank && answer.trim()) || (!blank && !answer.trim())) return { message: "Enter the answer or select blank.", ok: false };
  if (!["FOLLOWED", "VIOLATION"].includes(String(instruction))) return { message: "Check the paper and choose whether the answer followed the instructions.", ok: false };
  try {
    const saved = await db.$transaction(async tx => {
      const submission = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, status: "IN_REVIEW", quiz: { source: "EXISTING", teacherId: teacher.id } }, select: { quizId: true } });
      if (!submission) return false;
      const question = await tx.question.findFirst({ where: { id: questionId, section: { quizId: submission.quizId } }, select: { type: true, points: true, rubricCriteria: { orderBy: { position: "asc" } } } });
      if (!question) return false;
      const rubricScores = question.rubricCriteria.map(criterion => { const raw = form.get(`criterion-${criterion.id}`); return { criterion, score: typeof raw === "string" && raw.trim() ? Number(raw) : null, feedback: String(form.get(`feedback-${criterion.id}`) ?? "") }; });
      if (rubricScores.some(item => item.feedback.length > 4000)) return false;
      const score = question.type === "ESSAY" && rubricScores.length ? sumCriterionScores(rubricScores.map(item => ({ maxPoints: Number(item.criterion.maxPoints), score: item.score }))) : typeof rawScore === "string" && rawScore.trim() ? Number(rawScore) : NaN;
      if (question.type === "ESSAY" && (score === null || !Number.isFinite(score) || score < 0 || score > Number(question.points) || (!rubricScores.length && !/^\d+(\.\d{1,2})?$/.test(String(rawScore))))) return false;
      const data = { confirmedText: blank ? "" : answer.trim(), teacherComment: comment.trim() || null, reviewStatus: "CONFIRMED", instructionDecision: String(instruction), teacherScore: question.type === "ESSAY" ? score : null };
      const savedAnswer = await tx.submissionAnswer.upsert({ where: { submissionId_questionId: { submissionId, questionId } }, create: { submissionId, questionId, ...data }, update: data });
      for (const item of rubricScores) { const existing = await tx.essayAssessment.findFirst({ where: { answerId: savedAnswer.id, criterionId: item.criterion.id } }); if (existing) await tx.essayAssessment.update({ where: { id: existing.id }, data: { teacherScore: item.score, teacherFeedback: item.feedback.trim() || null } }); else await tx.essayAssessment.create({ data: { answerId: savedAnswer.id, criterionId: item.criterion.id, teacherScore: item.score, teacherFeedback: item.feedback.trim() || null } }); }
      return true;
    }, { isolationLevel: "Serializable" });
    if (!saved) return { message: "Check that the paper is in review and the essay score is within its points.", ok: false };
  } catch { return { message: "Could not save this answer. Please try again.", ok: false }; }
  revalidatePath(`/submissions/${submissionId}/review`); return { message: "Answer confirmed.", ok: true };
}

export async function finalizeExisting(submissionId: string): Promise<{ error: string; total?: number }> {
  const teacher = await getTeacher(); if (!teacher) return { error: "Please sign in again." };
  try {
    const result = await db.$transaction(async tx => {
      const submission = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, status: "IN_REVIEW", quiz: { source: "EXISTING", teacherId: teacher.id } }, include: { answers: true, pages: true, quiz: { include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { answerKey: true } } } } } } } });
      if (!submission) return "This paper is unavailable or already finalized.";
      if (!submission.nameReviewed) return "Confirm the name, or mark that no readable name is present, before finalizing.";
      let counter = 0;
      const questions = submission.quiz.sections.flatMap((section, index) => section.questions.map((question, position) => ({ ...question, number: submission.quiz.numbering === "CONTINUOUS" ? ++counter : position + 1, section: index + 1, answerStyle: section.answerStyle })));
      if (!questions.length) return "The answer key has no questions.";
      if (!pagesComplete(submission.expectedPages, submission.pages.map(page => page.pageNumber))) return "Upload and confirm all pages before finalizing.";
      const manuallyComplete = questions.every(q => submission.answers.some(a => a.questionId === q.id && a.reviewStatus === "CONFIRMED" && a.confirmedText !== null));
      const suggestions: Record<string, ExtractionItem[]> = Object.create(null);
      let unmatched = false;
      if (!manuallyComplete) {
        if (submission.pages.some(page => page.status !== "COMPLETE")) return "Read all pages or review every answer manually before finalizing.";
        for (const page of submission.pages) {
          const parsed = page.extraction ? parseExtraction(JSON.stringify(page.extraction)) : null;
          if (!parsed) return "A page has no valid reading. Retry it or review all answers manually.";
          const mapped = matchCandidates(questions, parsed.items.map(item => ({ ...item, section: null })));
          unmatched ||= mapped.unmatched.length > 0;
          for (const [id, items] of Object.entries(mapped.byQuestion)) (suggestions[id] ??= []).push(...items);
        }
        if (unmatched) return "Some responses could not be matched. Review all answers manually before finalizing.";
      }
      const automatic: { questionId: string; text: string; decision: "FOLLOWED" | "VIOLATION"; points: number; version: number }[] = [];
      let objective = 0, essay = 0;
      for (const q of questions) {
        const answer = submission.answers.find(a => a.questionId === q.id);
        if (!answer) {
          const items = suggestions[q.id] ?? [];
          const decision = automaticDecision(items, q.answerStyle, q.type);
          if (!decision || !q.answerKey?.acceptedAnswers.length) return "Review all flagged answers and essays before finalizing.";
          const text = items[0].answer!;
          const points = objectivePoints(text, q.answerKey.acceptedAnswers, Number(q.points), decision);
          automatic.push({ questionId: q.id, text, decision, points, version: q.answerKey.version }); objective += points;
          continue;
        }
        if (answer.reviewStatus !== "CONFIRMED" || answer.confirmedText === null) return "Review all flagged answers and essays before finalizing.";
        if (!["FOLLOWED", "VIOLATION"].includes(answer.instructionDecision ?? "")) return "Confirm whether every answer followed the instructions.";
        if (q.type === "ESSAY") { if (answer.teacherScore === null) return "Enter a score for every essay."; essay += answer.instructionDecision === "VIOLATION" ? 0 : Number(answer.teacherScore); }
        else { if (!q.answerKey?.acceptedAnswers.length) return "An answer key is missing."; const score = objectivePoints(answer.confirmedText, q.answerKey.acceptedAnswers, Number(q.points), answer.instructionDecision); objective += score; }
      }
      for (const item of automatic) await tx.submissionAnswer.create({ data: { submissionId, questionId: item.questionId, confirmedText: item.text, reviewStatus: "AUTO_CHECKED", instructionDecision: item.decision, objectiveScore: item.points, keyVersion: item.version } });
      for (const q of questions) { const answer = submission.answers.find(a => a.questionId === q.id); if (q.type !== "ESSAY" && answer && q.answerKey) await tx.submissionAnswer.update({ where: { id: answer.id }, data: { objectiveScore: objectivePoints(answer.confirmedText!, q.answerKey.acceptedAnswers, Number(q.points), answer.instructionDecision), keyVersion: q.answerKey.version } }); }
      const total = Math.round((objective + essay) * 100) / 100;
      await tx.submission.update({ where: { id: submission.id }, data: { status: "FINALIZED", finalizedAt: new Date(), objectiveScore: objective, essayScore: essay, totalScore: total } });
      await tx.resultHistory.create({ data: { submissionId: submission.id, changedById: teacher.id, reason: "Teacher finalized checked answers", newScore: total } }); return total;
    }, { isolationLevel: "Serializable" });
    if (typeof result === "string") return { error: result };
    revalidatePath(`/submissions/${submissionId}`); revalidatePath("/submissions"); return { error: "", total: result };
  } catch { return { error: "Could not finalize the paper. Refresh and try again." }; }
}

export async function confirmClearAnswers(submissionId: string, expectedItems: { id: string; answer: string }[]): Promise<{ error: string; count: number }> {
  const teacher = await getTeacher();
  if (!teacher) return { error: "Please sign in again.", count: 0 };
  if (!Array.isArray(expectedItems) || !expectedItems.length || expectedItems.length > 500 || expectedItems.some(item => !item || typeof item.id !== "string" || typeof item.answer !== "string") || new Set(expectedItems.map(item => item.id)).size !== expectedItems.length) return { error: "Refresh the page and review the suggestions again.", count: 0 };
  try {
    const result = await db.$transaction(async tx => {
      const submission = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, status: "IN_REVIEW", quiz: { source: "EXISTING", teacherId: teacher.id } }, include: { pages: true, answers: true, quiz: { include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" } } } } } } } });
      if (!submission || !submission.pages.length || submission.pages.some(page => page.status !== "COMPLETE")) return { error: "Read every page before confirming suggestions together.", count: 0 };
      let counter = 0;
      const questions = submission.quiz.sections.flatMap((section, index) => section.questions.map((question, position) => ({ ...question, number: submission.quiz.numbering === "CONTINUOUS" ? ++counter : position + 1, section: index + 1, answerStyle: section.answerStyle })));
      const suggestions: Record<string, ExtractionItem[]> = Object.create(null);
      for (const page of submission.pages) {
        const parsed = page.extraction ? parseExtraction(JSON.stringify(page.extraction)) : null;
        if (!parsed) return { error: "A page could not be read. Refresh and check the page before continuing.", count: 0 };
        const mapped = matchCandidates(questions, parsed.items.map(item => ({ ...item, section: null })));
        for (const [questionId, items] of Object.entries(mapped.byQuestion)) (suggestions[questionId] ??= []).push(...items);
      }
      const eligible = questions.filter(q => canConfirmClearSuggestion(suggestions[q.id] ?? [], q.answerStyle, q.type, submission.answers.some(a => a.questionId === q.id)));
      const eligibleById = new Map(eligible.map(q => [q.id, q]));
      if (expectedItems.some(item => !eligibleById.has(item.id) || suggestions[item.id][0].answer !== item.answer)) return { error: "The suggestions changed. Refresh and review them again.", count: 0 };
      for (const { id } of expectedItems) {
        await tx.submissionAnswer.create({ data: { submissionId, questionId: id, confirmedText: suggestions[id][0].answer!.trim(), teacherComment: null, reviewStatus: "CONFIRMED", instructionDecision: "FOLLOWED" } });
      }
      return { error: "", count: expectedItems.length };
    }, { isolationLevel: "Serializable" });
    if (!result.error) revalidatePath(`/submissions/${submissionId}/review`);
    return result;
  } catch { return { error: "Could not save these answers. Refresh and try again.", count: 0 }; }
}
