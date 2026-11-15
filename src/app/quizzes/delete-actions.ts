"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { removeQuizIfEmpty, updateQuizArchiveState } from "@/lib/quiz-deletion";

export async function deleteQuiz(quizId: string): Promise<{ error: string }> {
  const teacher = await getTeacher();
  if (!teacher) return { error: "Please sign in again." };
  if (typeof quizId !== "string" || !quizId || quizId.length > 200) return { error: "This quiz is unavailable." };
  try {
    const removed = await db.$transaction(async tx => {
      const quiz = await tx.quiz.findFirst({ where: { id: quizId, teacherId: teacher.id, submissions: { none: {} } }, select: { id: true } });
      if (!quiz) return false;
      await tx.checkingBatch.deleteMany({ where: { quizId, teacherId: teacher.id, submissions: { none: {} } } });
      await tx.answerKeyHistory.deleteMany({ where: { answerKey: { question: { section: { quizId, quiz: { teacherId: teacher.id } } } }, resultChanges: { none: {} } } });
      if (!await removeQuizIfEmpty(tx, quizId, teacher.id)) throw new Error("Quiz changed or has retained result history");
      return true;
    }, { isolationLevel: "Serializable" });
    if (!removed) return { error: "This quiz is unavailable or has papers. Archive it to keep its records." };
    revalidatePath("/quizzes");
    revalidatePath("/dashboard");
    return { error: "" };
  } catch (error) {
    console.error("Quiz deletion failed:", error instanceof Error ? error.name : "UnknownError");
    return { error: "Could not delete this quiz. Refresh and try again." };
  }
}

export async function setQuizArchived(quizId: string, archived: boolean): Promise<{ error: string }> {
  const teacher = await getTeacher();
  if (!teacher) return { error: "Please sign in again." };
  if (typeof quizId !== "string" || !quizId || quizId.length > 200 || typeof archived !== "boolean") return { error: "This quiz is unavailable." };
  try {
    if (!await updateQuizArchiveState(db, quizId, teacher.id, archived)) return { error: "This quiz is unavailable or its archive status has changed. Refresh and try again." };
    revalidatePath("/quizzes"); revalidatePath("/dashboard"); revalidatePath(`/quizzes/${quizId}/overview`);
    return { error: "" };
  } catch { return { error: "Could not update this quiz. Refresh and try again." }; }
}
