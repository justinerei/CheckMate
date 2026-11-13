"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { isValidSectionOrder } from "@/lib/reorder";

export async function saveSectionOrder(quizId: string, _previous: { error: string }, form: FormData): Promise<{ error: string }> {
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  let order: unknown, expected: unknown;
  try { order = JSON.parse(String(form.get("order") ?? "")); expected = JSON.parse(String(form.get("expected") ?? "")); }
  catch { return { error: "Could not read the section order. Refresh and try again." }; }
  if (!Array.isArray(order) || !Array.isArray(expected) || !order.length || order.length > 500 || order.some(id => typeof id !== "string" || !id || id.length > 200) || expected.some(id => typeof id !== "string") || new Set(order).size !== order.length || order.length !== expected.length) return { error: "Invalid section order. Refresh and try again." };
  try {
    const result = await db.$transaction(async tx => {
      const quiz = await tx.quiz.findFirst({ where: { id: quizId, teacherId: teacher.id, source: "BUILT" }, include: { _count: { select: { submissions: true } }, sections: { orderBy: { position: "asc" }, select: { id: true, position: true } } } });
      if (!quiz || quiz._count.submissions) return "This quiz is unavailable or locked because it has papers.";
      const current = quiz.sections.map(section => section.id);
      if (!isValidSectionOrder(order, expected, current)) return "The section order changed. Refresh before trying again.";
      const base = Math.max(...quiz.sections.map(section => section.position)) + 1;
      for (const [index, id] of order.entries()) await tx.quizSection.update({ where: { id }, data: { position: base + index } });
      for (const [index, id] of order.entries()) await tx.quizSection.update({ where: { id }, data: { position: index } });
      return "";
    }, { isolationLevel: "Serializable" });
    if (result) return { error: result };
  } catch { return { error: "Could not save the section order. Refresh and try again." }; }
  revalidatePath(`/quizzes/${quizId}`);
  revalidatePath(`/quizzes/${quizId}/overview`);
  revalidatePath(`/quizzes/${quizId}/print`);
  redirect(`/quizzes/${encodeURIComponent(quizId)}?saved=order`);
}
