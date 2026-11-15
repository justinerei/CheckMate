import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import OutlineForm from "./outline-form";
import styles from "./outline.module.css";

export const instant = false;
export default async function ConfigureQuiz({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const { id } = await params;
  const quiz = await db.quiz.findFirst({ where: { id, teacherId: teacher.id, source: "BUILT" }, include: { _count: { select: { submissions: true } }, sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" } } } } } });
  if (!quiz) notFound();
  const labels: Record<string, string> = { MULTIPLE_CHOICE: "Multiple Choice", IDENTIFICATION: "Identification", TRUE_FALSE: "True or False", ESSAY: "Essay" };
  const editable = !quiz._count.submissions && quiz.sections.every(s => s.questions.length > 0 && !s.instructions.trim() && Number(s.defaultPoints) === 1 && s.title === labels[s.questions[0].type] && s.questions.every(q => !q.text.trim() && q.type === s.questions[0].type));
  if (!editable) redirect(`/quizzes/${encodeURIComponent(id)}`);
  const initial = quiz.sections.filter(section => section.questions.length > 0 && section.questions.every(q => q.type === section.questions[0].type)).map(section => ({ type: section.questions[0].type, count: section.questions.length }));
  if (initial.length !== quiz.sections.length) redirect(`/quizzes/${encodeURIComponent(id)}`);
  const editing = initial.length > 0;
  return <main className={styles.shell}><header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link href={`/quizzes/${encodeURIComponent(id)}`} className="back-navigation">Back to quiz</Link></header><div className={styles.page}><div className={styles.intro}><div><p className={styles.eyebrow}>{editing ? "QUIZ OUTLINE" : "QUIZ SETUP"} <span> / 01</span></p><h1>{editing ? "Edit your outline" : "Plan your quiz"}<span>.</span></h1><p>{editing ? "Adjust the sections and question counts below." : "Choose the structure to prepare your question slots."}</p></div></div><OutlineForm key={`${id}:${JSON.stringify(initial)}`} id={id} initial={initial} editing={editing} /></div></main>;
}
