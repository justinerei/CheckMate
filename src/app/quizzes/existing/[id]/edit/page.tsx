import Link from "next/link";
import { quizChildBackDestination } from "@/lib/back-navigation";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import EditAnswer from "./edit-answer";
import styles from "../../../../submissions/submissions.module.css";
export const instant = false;
export default async function EditKey({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> }) {
  await connection(); const teacher = await getTeacher(); if (!teacher) redirect("/"); const { id } = await params; const { from } = await searchParams; const back = quizChildBackDestination(id, from);
  const quiz = await db.quiz.findFirst({ where: { id, teacherId: teacher.id }, include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { answerKey: true, choices: { orderBy: { position: "asc" } } } } } } } });
  if (!quiz) notFound(); let number = 0;
  return <main className={styles.shell}><header className={styles.header}><Link className={styles.logo} href="/dashboard">checkmate<span>.</span></Link><Link href={back.href} className="back-navigation">{back.label}</Link></header><div className={styles.narrow}><p className={styles.eyebrow}>QUIZ / EDIT KEY</p><h1>Edit correct answers</h1><p className={styles.description}>{quiz.title}. Save each corrected answer. If papers were already finalized, their scores will be recalculated using the corrected answer. For identification questions, use | between accepted alternatives.</p>{quiz.sections.map(section => <section className={styles.confirm} key={section.id}><h2>{section.title}</h2>{section.questions.map((question, index) => { const n = quiz.numbering === "CONTINUOUS" ? ++number : index + 1; return question.answerKey ? <EditAnswer key={question.id} quizId={id} questionId={question.id} number={n} value={question.answerKey.acceptedAnswers.join(" | ")} questionText={quiz.source === "BUILT" ? question.text : undefined} type={quiz.source === "BUILT" ? question.type : undefined} choices={quiz.source === "BUILT" ? question.choices.map(choice => ({ label: choice.label, text: choice.text })) : undefined} /> : <p key={question.id}>Question {n}: {question.type === "ESSAY" ? "Essay is scored by the teacher." : "No answer key has been saved yet."}</p>; })}</section>)}</div></main>;
}
