"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { studentLinkProblem } from "@/lib/student-paper-link";
import { revalidatePath } from "next/cache";

export async function assignPaperStudent(id: string, _state: { message: string; ok: boolean }, form: FormData) {
  const teacher = await getTeacher();
  if (!teacher) return { message: "Please sign in again.", ok: false };
  const raw = form.get("studentId");
  if (typeof raw !== "string" || raw.length > 200) return { message: "Choose a student from your student list.", ok: false };
  const studentId = raw || null;
  try {
    const issue = await db.$transaction(async tx => {
      const paper = await tx.submission.findFirst({ where: { id, teacherId: teacher.id, status: "IN_REVIEW", quiz: { teacherId: teacher.id } }, select: { id: true, quizId: true } });
      const allowed = !studentId || !!(await tx.teacherStudent.findUnique({ where: { teacherId_studentId: { teacherId: teacher.id, studentId } }, select: { studentId: true } }));
      const duplicate = !!(studentId && paper && await tx.submission.findFirst({ where: { quizId: paper.quizId, studentId, id: { not: id } }, select: { id: true } }));
      const error = studentLinkProblem(!!paper, allowed, duplicate);
      if (error) return error;
      const updated = await tx.submission.updateMany({ where: { id, teacherId: teacher.id, status: "IN_REVIEW", quiz: { teacherId: teacher.id } }, data: { studentId } });
      return updated.count === 1 ? null : "This paper is unavailable or already finalized.";
    }, { isolationLevel: "Serializable" });
    if (issue) return { message: issue, ok: false };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return { message: "This student already has a paper for this quiz.", ok: false };
    return { message: "Could not update the student link. Refresh and try again.", ok: false };
  }
  revalidatePath(`/submissions/${id}/review`); revalidatePath(`/submissions/${id}`); revalidatePath("/submissions"); revalidatePath("/dashboard"); revalidatePath("/batches/[id]", "page"); revalidatePath("/quizzes/[id]/overview", "page");
  return { message: studentId ? "Student linked to this paper." : "Student link removed.", ok: true };
}
