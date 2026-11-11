"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { canConfirmClearSuggestion, matchCandidates, parseExtraction, type ExtractionItem } from "@/lib/extraction";
import { objectivePoints } from "@/lib/scoring";
import { revalidatePath } from "next/cache";

export async function saveExistingAnswer(submissionId: string, questionId: string, _state: { message: string; ok: boolean }, form: FormData) {
  const teacher = await getTeacher(); if (!teacher) return { message: "Please sign in again.", ok: false };
  const answer = form.get("answer"), comment = form.get("comment"), blank = form.get("blank") === "on", rawScore = form.get("score"), instruction = form.get("instruction");
  if (typeof answer !== "string" || answer.length > 4000 || typeof comment !== "string" || comment.length > 4000 || (blank && answer.trim()) || (!blank && !answer.trim())) return { message: "Enter the answer or select blank.", ok: false };
  if (!["FOLLOWED", "VIOLATION"].includes(String(instruction))) return { message: "Check the paper and choose whether the answer followed the instructions.", ok: false };
  try {
    const saved = await db.$transaction(async tx => {
      const submission = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, status: "IN_REVIEW", quiz: { source: "EXISTING", teacherId: teacher.id } }, select: { quizId: true } });
      if (!submission) return false;
      const question = await tx.question.findFirst({ where: { id: questionId, section: { quizId: submission.quizId } }, select: { type: true, points: true } });
      if (!question) return false;
      const score = typeof rawScore === "string" && rawScore.trim() ? Number(rawScore) : NaN;
      if (question.type === "ESSAY" && (!Number.isFinite(score) || score < 0 || score > Number(question.points) || !/^\d+(\.\d{1,2})?$/.test(String(rawScore)))) return false;
      const data = { confirmedText: blank ? "" : answer.trim(), teacherComment: comment.trim() || null, reviewStatus: "CONFIRMED", instructionDecision: String(instruction), teacherScore: question.type === "ESSAY" ? score : null };
      await tx.submissionAnswer.upsert({ where: { submissionId_questionId: { submissionId, questionId } }, create: { submissionId, questionId, ...data }, update: data }); return true;
    }, { isolationLevel: "Serializable" });
    if (!saved) return { message: "Check that the paper is in review and the essay score is within its points.", ok: false };
  } catch { return { message: "Could not save this answer. Please try again.", ok: false }; }
  revalidatePath(`/submissions/${submissionId}/review`); return { message: "Answer confirmed.", ok: true };
}

export async function finalizeExisting(submissionId: string): Promise<{ error: string }> {
  const teacher = await getTeacher(); if (!teacher) return { error: "Please sign in again." };
  try {
    const result = await db.$transaction(async tx => {
      const submission = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, status: "IN_REVIEW", quiz: { source: "EXISTING", teacherId: teacher.id } }, include: { answers: true, quiz: { include: { sections: { include: { questions: { include: { answerKey: true } } } } } } } });
      if (!submission) return "This paper is unavailable or already finalized.";
      if (!submission.nameReviewed) return "Confirm the name, or mark that no readable name is present, before finalizing.";
      const questions = submission.quiz.sections.flatMap(s => s.questions); if (!questions.length) return "The answer key has no questions.";
      let objective = 0, essay = 0;
      for (const q of questions) {
        const answer = submission.answers.find(a => a.questionId === q.id);
        if (!answer || answer.reviewStatus !== "CONFIRMED" || answer.confirmedText === null) return "Confirm every answer before finalizing.";
        if (!["FOLLOWED", "VIOLATION"].includes(answer.instructionDecision ?? "")) return "Confirm whether every answer followed the instructions.";
        if (q.type === "ESSAY") { if (answer.teacherScore === null) return "Enter a score for every essay."; essay += answer.instructionDecision === "VIOLATION" ? 0 : Number(answer.teacherScore); }
        else { if (!q.answerKey?.acceptedAnswers.length) return "An answer key is missing."; const score = objectivePoints(answer.confirmedText, q.answerKey.acceptedAnswers, Number(q.points), answer.instructionDecision); objective += score; await tx.submissionAnswer.update({ where: { id: answer.id }, data: { objectiveScore: score, keyVersion: q.answerKey.version } }); }
      }
      const total = Math.round((objective + essay) * 100) / 100;
      await tx.submission.update({ where: { id: submission.id }, data: { status: "FINALIZED", finalizedAt: new Date(), objectiveScore: objective, essayScore: essay, totalScore: total } });
      await tx.resultHistory.create({ data: { submissionId: submission.id, changedById: teacher.id, reason: "Teacher confirmed answers and finalized", newScore: total } }); return "";
    }, { isolationLevel: "Serializable" });
    if (result) return { error: result };
  } catch { return { error: "Could not finalize the paper. Refresh and try again." }; }
  revalidatePath(`/submissions/${submissionId}/review`); revalidatePath(`/submissions/${submissionId}`); revalidatePath("/submissions"); return { error: "" };
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
