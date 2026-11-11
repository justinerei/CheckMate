import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import CreateForm from "./create-form";
import styles from "../submissions.module.css";

export const instant = false;
export default async function NewSubmission({ searchParams }: { searchParams: Promise<{ quizId?: string }> }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const { quizId } = await searchParams;
  const quizzes = await db.quiz.findMany({ where: { teacherId: teacher.id }, orderBy: { title: "asc" }, select: { id: true, title: true } });
  return <main className={styles.shell}><header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link href="/submissions" className={styles.back}>← Submissions</Link></header><div className={styles.narrow}><p className={styles.eyebrow}>NEW SUBMISSION / 01</p><h1>Check a paper</h1><p className={styles.description}>Choose the quiz, then upload the answered paper. You can review the name after it is read.</p><CreateForm selectedQuizId={quizId} quizzes={quizzes.map(q => ({ id: q.id, label: q.title }))} /></div></main>;
}
