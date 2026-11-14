import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { parseQuestion } from "@/lib/question-input";
import { validateModulePages } from "@/lib/module-content";
import { revalidatePath } from "next/cache";
import { sectionRubric } from "@/lib/section-rubric";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  try { if (!request.headers.get("origin") || new URL(request.headers.get("origin")!).host !== request.headers.get("host")) throw new Error(); }
  catch { return NextResponse.json({ error: "Invalid request origin." }, { status: 403 }); }
  if (Number(request.headers.get("content-length") || 0) > 30_000) return NextResponse.json({ error: "Question is too large." }, { status: 413 });
  try {
    const { id, questionId } = await params;
    const form = await request.formData();
    const input = parseQuestion(form);
    const moduleId = form.get("moduleId");
    const page = Number(form.get("sourcePage"));
    if (!input || typeof moduleId !== "string" || !Number.isInteger(page) || page < 1 || page > 150) return NextResponse.json({ error: "Complete the question, answer, points, and rubric before saving." }, { status: 400 });
    const result = await db.$transaction(async tx => {
      const question = await tx.question.findFirst({ where: { id: questionId, section: { quizId: id, quiz: { teacherId: teacher.id, source: "BUILT" } } }, include: { section: { include: { questions: { include: { rubricCriteria: { orderBy: { position: "asc" } } } }, quiz: { include: { _count: { select: { submissions: true } } } } } }, answerKey: true, choices: { select: { id: true } }, rubricCriteria: { orderBy: { position: "asc" } } } });
      if (!question || question.section.quiz._count.submissions || question.text !== "" || question.type !== input.type || question.answerKey || question.choices.length || (question.type !== "ESSAY" && question.rubricCriteria.length)) return "This question has changed or the quiz is locked. Refresh before saving.";
      if (input.type === "ESSAY" && question.rubricCriteria.length && (Number(question.points) !== input.points || JSON.stringify(question.rubricCriteria.map(c => [c.title, c.description, Number(c.maxPoints)])) !== JSON.stringify(input.criteria.map(c => [c.title, c.description, c.maxPoints])))) return "The section rubric has changed. Refresh and try again.";
      if (input.type === "ESSAY") { const shared = sectionRubric(question.section.questions, Number(question.section.defaultPoints)); if (shared.differs || !question.rubricCriteria.length || JSON.stringify(shared.criteria) !== JSON.stringify(input.criteria)) return "Set a shared rubric in Edit section, then refresh and try again."; }
      const sourceModule = await tx.quizModule.findFirst({ where: { id: moduleId, quizId: id } });
      const pages = sourceModule ? validateModulePages(sourceModule.pages) : null;
      if (!sourceModule || !pages?.some(item => item.page === page && item.text.length >= 40)) return "The source module is no longer available. Generate this suggestion again.";
      const updated = await tx.question.updateMany({ where: { id: questionId, text: "", type: question.type }, data: { text: input.text, points: input.points, besideNext: input.besideNext, essayLineCount: input.essayLineCount, sourceModuleName: sourceModule.name, sourcePage: page } });
      if (updated.count !== 1) return "This question has changed. Refresh before saving.";
      if (input.type === "MULTIPLE_CHOICE") await tx.questionChoice.createMany({ data: input.choices.map((choice, position) => ({ ...choice, questionId, position })) });
      if (input.type !== "ESSAY") await tx.answerKey.create({ data: { questionId, acceptedAnswers: input.acceptedAnswers } });
      else { await tx.rubricCriterion.deleteMany({ where: { questionId } }); await tx.rubricCriterion.createMany({ data: input.criteria.map((criterion, position) => ({ ...criterion, questionId, position })) }); }
      return "";
    }, { isolationLevel: "Serializable" });
    if (result) return NextResponse.json({ error: result }, { status: 409 });
    try { revalidatePath(`/quizzes/${id}`); revalidatePath(`/quizzes/${id}/overview`); revalidatePath(`/quizzes/${id}/print`); } catch { console.error("Question saved, but page revalidation failed."); }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Could not save this question. Refresh and try again." }, { status: 400 }); }
}
