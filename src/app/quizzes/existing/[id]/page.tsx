import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import styles from "../../../submissions/submissions.module.css";
export const instant = false;
export default async function ExistingDetails({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await connection(); const teacher = await getTeacher(); if (!teacher) redirect("/"); const { id } = await params; const { saved } = await searchParams;
  const quiz = await db.quiz.findFirst({ where: { id, teacherId: teacher.id, source: "EXISTING" }, include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { answerKey: true } } } } } });
  if (!quiz) notFound(); let number = 0;
  return <main className={styles.shell}><div className={styles.content}>
      <div className="teacher-page-back"><Link className="back-navigation" href="/quizzes">Back to quizzes &amp; keys</Link></div><h1>{quiz.title}</h1>{saved === "1" && <p className={styles.success} role="status">Answer key saved.</p>}<p className={styles.description}>Upload a student paper to start checking.</p><div className={styles.links}><Link className={styles.primary} href={`/submissions/new?quizId=${encodeURIComponent(id)}`}>Upload a student paper</Link><Link className={styles.secondary} href={`/quizzes/existing/${id}/edit`}>Edit correct answers</Link></div>{quiz.sections.map(section => <section className={styles.confirm} key={section.id}><h2>{section.title}</h2><p>Answer style: {section.answerStyle} {section.instructions && `· ${section.instructions}`}</p>{section.questions.map(question => <p key={question.id}>{++number}. {question.type === "ESSAY" ? "Teacher graded essay" : question.answerKey?.acceptedAnswers.join(" / ")} · {question.points.toString()} points</p>)}</section>)}</div></main>;
}
