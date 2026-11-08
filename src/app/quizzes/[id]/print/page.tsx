import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quizPrintCode } from "@/lib/print-label";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import PagedPreview from "./paged-preview";

export const instant = false;

export default async function PrintQuiz({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id } }) : null;
  if (!user?.enabled || user.role !== "TEACHER") redirect("/");
  const quiz = await db.quiz.findFirst({ where: { id, teacherId: user.id }, include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { choices: { orderBy: { position: "asc" } } } } } } } });
  if (!quiz) notFound();
  const paper = quiz.paperSize === "LETTER" ? { page: "letter", width: "8.5in", height: "11in", label: "Letter" } : quiz.paperSize === "LONG" ? { page: "8.5in 13in", width: "8.5in", height: "13in", label: "Long bond" } : { page: "A4", width: "210mm", height: "297mm", label: "A4" };
  const sections = quiz.sections.map(section => ({ id: section.id, title: section.title, instructions: section.instructions, questions: section.questions.map(question => ({ id: question.id, type: question.type, text: question.text, besideNext: question.besideNext, essayLineCount: question.essayLineCount, choices: question.choices.map(choice => ({ id: choice.id, label: choice.label, text: choice.text })) })) }));
  return <PagedPreview id={id} title={quiz.title} code={quizPrintCode(quiz.id)} paper={paper} numbering={quiz.numbering} sections={sections} />;
}
