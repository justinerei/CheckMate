import { quizChildBackDestination } from "@/lib/back-navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { questionIsComplete } from "@/lib/quiz-outline";
import { quizPrintCode } from "@/lib/print-label";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import PagedPreview from "./paged-preview";

export const instant = false;

export default async function PrintQuiz({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> }) {
  await connection();
  const { id } = await params;
  const { from } = await searchParams;
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id } }) : null;
  if (!user?.enabled || user.role !== "TEACHER") redirect("/");
  const quiz = await db.quiz.findFirst({ where: { id, teacherId: user.id }, include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { choices: { orderBy: { position: "asc" } }, answerKey: true, rubricCriteria: { orderBy: { position: "asc" } } } } } } } });
  if (!quiz) notFound();
  const questions = quiz.sections.flatMap(section => section.questions);
  if (!questions.length || questions.some(question => !questionIsComplete(question))) redirect(`/quizzes/${encodeURIComponent(id)}?error=incomplete`);
  const paper = quiz.paperSize === "LETTER" ? { page: "letter", width: "8.5in", height: "11in", label: "Letter" } : quiz.paperSize === "LONG" ? { page: "8.5in 13in", width: "8.5in", height: "13in", label: "Long bond" } : { page: "A4", width: "210mm", height: "297mm", label: "A4" };
  const sections = quiz.sections.map(section => ({ id: section.id, title: section.title, instructions: section.instructions, questionLayout: section.questionLayout, questions: section.questions.map(question => ({ id: question.id, type: question.type, text: question.text, besideNext: question.besideNext, essayLineCount: question.essayLineCount, choices: question.choices.map(choice => ({ id: choice.id, label: choice.label, text: choice.text })), rubric: question.type === "ESSAY" ? question.rubricCriteria.map(criterion => ({ id: criterion.id, title: criterion.title, description: criterion.description, points: criterion.maxPoints.toString() })) : [] })) }));
  return <PagedPreview back={quizChildBackDestination(id, from)} title={quiz.title} generalInstructions={quiz.generalInstructions} code={quizPrintCode(quiz.id)} paper={paper} numbering={quiz.numbering} sections={sections} />;
}
