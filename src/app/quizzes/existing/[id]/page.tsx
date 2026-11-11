import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import styles from "../../../submissions/submissions.module.css";
export const instant = false;
export default async function ExistingDetails({ params }: { params: Promise<{ id: string }> }) {
  await connection(); const teacher = await getTeacher(); if (!teacher) redirect("/"); const { id } = await params;
  const quiz = await db.quiz.findFirst({ where: { id, teacherId: teacher.id, source: "EXISTING" }, include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { answerKey: true } } } } } });
  if (!quiz) notFound(); let number = 0;
  return <main className={styles.shell}><header className={styles.header}><Link className={styles.logo} href="/dashboard">checkmate<span>.</span></Link><Link className={styles.back} href="/dashboard">← Dashboard</Link></header><div className={styles.content}><p className={styles.eyebrow}>EXISTING QUIZ / CONFIRMED KEY</p><h1>{quiz.title}</h1><p className={styles.description}>This key is saved. Select a student and upload their paper to begin checking.</p><Link className={styles.primary} href="/submissions/new">Upload a student paper</Link>{quiz.sections.map(section => <section className={styles.confirm} key={section.id}><h2>{section.title}</h2><p>Answer style: {section.answerStyle} {section.instructions && `· ${section.instructions}`}</p>{section.questions.map(question => <p key={question.id}>{++number}. {question.type === "ESSAY" ? "Teacher graded essay" : question.answerKey?.acceptedAnswers.join(" / ")} · {question.points.toString()} points</p>)}</section>)}</div></main>;
}
