"use server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { parseQuizOutline, sameQuizOutline } from "@/lib/quiz-outline";
import { redirect } from "next/navigation";

export async function saveOutline(quizId: string, _previous: { error: string }, form: FormData): Promise<{ error: string }> {
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  let raw: unknown;
  try { raw = JSON.parse(String(form.get("sections") ?? "")); } catch { return { error: "Check your sections and try again." }; }
  const sections = parseQuizOutline(raw, form.get("total"));
  if (!sections) return { error: "Assign every question to a section, using a total from 1 to 200." };
  const labels: Record<string, string> = { MULTIPLE_CHOICE: "Multiple Choice", IDENTIFICATION: "Identification", TRUE_FALSE: "True or False", ESSAY: "Essay" };
  try {
    const ok = await db.$transaction(async tx => {
      const quiz = await tx.quiz.findFirst({ where: { id: quizId, teacherId: teacher.id, source: "BUILT" }, include: { _count: { select: { submissions: true } }, sections: { orderBy: { position: "asc" }, include: { questions: true } } } });
      if (!quiz || quiz._count.submissions || quiz.sections.some(section => !section.questions.length || section.questionLayout !== "CUSTOM" || section.instructions.trim() || Number(section.defaultPoints) !== 1 || section.title !== labels[section.questions[0].type] || section.questions.some(question => question.text.trim() || question.type !== section.questions[0].type))) return false;
      const existing = quiz.sections.map(section => ({ type: section.questions[0].type, count: section.questions.length }));
      if (sameQuizOutline(existing, sections)) return "unchanged";
      await tx.quizSection.deleteMany({ where: { quizId } });
      await tx.quiz.update({ where: { id: quizId }, data: { numbering: "CONTINUOUS" } });
      for (const [position, section] of sections.entries()) {
        await tx.quizSection.create({ data: { quizId, position, title: labels[section.type], answerStyle: section.type === "MULTIPLE_CHOICE" ? "circle" : "written", questions: { create: Array.from({ length: section.count }, (_, index) => ({ position: index, type: section.type, text: "", points: 1, essayLineCount: section.type === "ESSAY" ? 7 : null })) } } });
      }
      return "saved";
    }, { isolationLevel: "Serializable" });
    if (!ok) return { error: "This outline cannot be replaced after questions have been filled in or papers added. Edit individual questions instead." };
  } catch { return { error: "Could not save your outline. Please try again." }; }
  redirect(`/quizzes/${encodeURIComponent(quizId)}?saved=outline`);
}
