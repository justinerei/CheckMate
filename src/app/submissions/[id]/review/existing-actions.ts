"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { matchesAnswer } from "@/lib/scoring";
import { revalidatePath } from "next/cache";

export async function saveExistingAnswer(submissionId: string, questionId: string, _state: { message: string; ok: boolean }, form: FormData) {
  const teacher = await getTeacher(); if (!teacher) return { message: "Please sign in again.", ok: false };
  const answer = form.get("answer"), comment = form.get("comment"), blank = form.get("blank") === "on", rawScore = form.get("score");
  if (typeof answer !== "string" || answer.length > 4000 || typeof comment !== "string" || comment.length > 4000 || (blank && answer.trim()) || (!blank && !answer.trim())) return { message: "Enter the answer or select blank.", ok: false };
  try {
    const saved = await db.$transaction(async tx => {
      const submission = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, status: "IN_REVIEW", quiz: { source: "EXISTING", teacherId: teacher.id } }, select: { quizId: true } });
      if (!submission) return false;
      const question = await tx.question.findFirst({ where: { id: questionId, section: { quizId: submission.quizId } }, select: { type: true, points: true } });
      if (!question) return false;
      const score = typeof rawScore === "string" && rawScore.trim() ? Number(rawScore) : NaN;
      if (question.type === "ESSAY" && (!Number.isFinite(score) || score < 0 || score > Number(question.points) || !/^\d+(\.\d{1,2})?$/.test(String(rawScore)))) return false;
      const data = { confirmedText: blank ? "" : answer.trim(), teacherComment: comment.trim() || null, reviewStatus: "CONFIRMED", teacherScore: question.type === "ESSAY" ? score : null };
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
        if (q.type === "ESSAY") { if (answer.teacherScore === null) return "Enter a score for every essay."; essay += Number(answer.teacherScore); }
        else { if (!q.answerKey?.acceptedAnswers.length) return "An answer key is missing."; const score = matchesAnswer(answer.confirmedText, q.answerKey.acceptedAnswers) ? Number(q.points) : 0; objective += score; await tx.submissionAnswer.update({ where: { id: answer.id }, data: { objectiveScore: score, keyVersion: q.answerKey.version } }); }
      }
      const total = Math.round((objective + essay) * 100) / 100;
      await tx.submission.update({ where: { id: submission.id }, data: { status: "FINALIZED", finalizedAt: new Date(), objectiveScore: objective, essayScore: essay, totalScore: total } });
      await tx.resultHistory.create({ data: { submissionId: submission.id, changedById: teacher.id, reason: "Teacher confirmed answers and finalized", newScore: total } }); return "";
    }, { isolationLevel: "Serializable" });
    if (result) return { error: result };
  } catch { return { error: "Could not finalize the paper. Refresh and try again." }; }
  revalidatePath(`/submissions/${submissionId}/review`); revalidatePath(`/submissions/${submissionId}`); revalidatePath("/submissions"); return { error: "" };
}
