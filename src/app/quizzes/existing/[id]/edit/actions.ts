"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { adjustedScore, objectivePoints } from "@/lib/scoring";
import { revalidatePath } from "next/cache";

export async function updateKeyAnswer(quizId: string, questionId: string, _previous: { message: string; ok: boolean }, form: FormData) {
  const teacher = await getTeacher();
  if (!teacher) return { message: "Please sign in again.", ok: false };
  const raw = form.get("answers");
  if (typeof raw !== "string" || raw.length > 500) return { message: "Enter at least one correct answer (maximum 500 characters).", ok: false };
  const answers = raw.split("|").map(a => a.trim()).filter(Boolean);
  if (!answers.length) return { message: "Enter at least one correct answer.", ok: false };
  try {
    const outcome = await db.$transaction(async tx => {
      const question = await tx.question.findFirst({ where: { id: questionId, section: { quizId, quiz: { teacherId: teacher.id, source: "EXISTING" } } }, include: { answerKey: true } });
      if (!question?.answerKey || question.type === "ESSAY") return "This answer key is unavailable.";
      const key = question.answerKey;
      if (JSON.stringify(key.acceptedAnswers) === JSON.stringify(answers)) return "No changes to save.";
      const affected = await tx.submissionAnswer.findMany({ where: { questionId, submission: { quizId, teacherId: teacher.id, status: "FINALIZED" } }, include: { submission: true } });
      if (affected.some(a => a.confirmedText === null || a.objectiveScore === null || a.submission.totalScore === null || a.submission.objectiveScore === null)) return "A finalized result is incomplete; the key was not changed.";
      const version = key.version + 1;
      await tx.answerKey.update({ where: { id: key.id }, data: { acceptedAnswers: answers, version } });
      const change = await tx.answerKeyHistory.create({ data: { answerKeyId: key.id, changedById: teacher.id, previousAnswers: key.acceptedAnswers, newAnswers: answers, version } });
      for (const entry of affected) {
        const oldScore = Number(entry.objectiveScore); const newScore = objectivePoints(entry.confirmedText!, answers, Number(question.points), entry.instructionDecision);
        const objective = adjustedScore(Number(entry.submission.objectiveScore), oldScore, newScore);
        const total = adjustedScore(Number(entry.submission.totalScore), oldScore, newScore);
        await tx.submissionAnswer.update({ where: { id: entry.id }, data: { objectiveScore: newScore, keyVersion: version } });
        await tx.submission.update({ where: { id: entry.submissionId }, data: { objectiveScore: objective, totalScore: total } });
        await tx.resultHistory.create({ data: { submissionId: entry.submissionId, changedById: teacher.id, answerKeyChangeId: change.id, reason: "Answer key corrected", previousScore: entry.submission.totalScore, newScore: total } });
      }
      return "";
    }, { isolationLevel: "Serializable" });
    if (outcome) return { message: outcome, ok: false };
  } catch { return { message: "Could not update the key. Please refresh and try again.", ok: false }; }
  revalidatePath(`/quizzes/existing/${quizId}`); revalidatePath(`/quizzes/existing/${quizId}/edit`); revalidatePath("/submissions"); revalidatePath("/submissions/[id]/review", "page");
  return { message: "Correct answer saved. Finalized scores were updated.", ok: true };
}
