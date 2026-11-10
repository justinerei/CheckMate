"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { revalidatePath } from "next/cache";

export async function saveAnswer(submissionId: string, questionId: string, _previous: { message: string; ok: boolean }, form: FormData) {
  const teacher = await getTeacher();
  if (!teacher) return { message: "Please sign in again.", ok: false };
  const value = form.get("answer");
  const blank = form.get("blank") === "on";
  if (typeof value !== "string" || value.length > 4000 || (!value.trim() && !blank) || (value.trim() && blank)) return { message: "Enter an answer, or select Mark as blank.", ok: false };
  try {
    const saved = await db.$transaction(async tx => {
      const submission = await tx.submission.findFirst({ where: { id: submissionId, teacherId: teacher.id, status: "IN_REVIEW", quiz: { teacherId: teacher.id, sections: { some: { questions: { some: { id: questionId } } } } } }, select: { id: true } });
      if (!submission) return false;
      await tx.submissionAnswer.upsert({ where: { submissionId_questionId: { submissionId, questionId } }, create: { submissionId, questionId, confirmedText: blank ? "" : value.trim(), reviewStatus: "CONFIRMED" }, update: { confirmedText: blank ? "" : value.trim(), reviewStatus: "CONFIRMED" } });
      return true;
    }, { isolationLevel: "Serializable" });
    if (!saved) return { message: "This answer is no longer available for review.", ok: false };
  } catch { return { message: "Could not save this answer. Please try again.", ok: false }; }
  revalidatePath(`/submissions/${submissionId}/review`);
  return { message: "Answer saved.", ok: true };
}
