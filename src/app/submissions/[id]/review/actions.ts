"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { revalidatePath } from "next/cache";

export async function saveAnswer(submissionId: string, questionId: string, _previous: { message: string; ok: boolean }, form: FormData) {
  const teacher = await getTeacher();
  if (!teacher) return { message: "Please sign in again.", ok: false };
  const value = form.get("answer");
  const blank = form.get("blank") === "on";
  const comment = form.get("comment");
  const shape = form.get("markShape") || null;
  if (typeof value !== "string" || value.length > 4000 || (!value.trim() && !blank) || (value.trim() && blank)) return { message: "Enter an answer, or select Mark as blank.", ok: false };
  if (typeof comment !== "string" || comment.length > 4000 || (shape !== null && !["circle", "box", "triangle"].includes(String(shape)))) return { message: "Check the comment and mark shape.", ok: false };
  try {
    const saved = await db.$transaction(async tx => {
      const submission = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, status: "IN_REVIEW", quiz: { teacherId: teacher.id, sections: { some: { questions: { some: { id: questionId } } } } } }, select: { id: true, quizId: true } });
      if (!submission) return false;
      const question = await tx.question.findFirst({ where: { id: questionId, section: { quizId: submission.quizId } }, select: { type: true } });
      if (!question || (question.type === "MULTIPLE_CHOICE" && !blank && !shape) || (question.type !== "MULTIPLE_CHOICE" && shape)) return false;
      const confirmedMarkShape = question.type === "MULTIPLE_CHOICE" && !blank ? String(shape) : null;
      const data = { confirmedText: blank ? "" : value.trim(), reviewStatus: "CONFIRMED", teacherComment: comment.trim() || null, confirmedMarkShape, objectiveScore: confirmedMarkShape === "box" || confirmedMarkShape === "triangle" ? 0 : null };
      await tx.submissionAnswer.upsert({ where: { submissionId_questionId: { submissionId, questionId } }, create: { submissionId, questionId, ...data }, update: data });
      return true;
    }, { isolationLevel: "Serializable" });
    if (!saved) return { message: "Choose a mark shape for a multiple-choice answer, or check that this paper is available for review.", ok: false };
  } catch { return { message: "Could not save this answer. Please try again.", ok: false }; }
  revalidatePath(`/submissions/${submissionId}/review`);
  return { message: "Answer saved.", ok: true };
}
