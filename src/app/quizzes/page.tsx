import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import QuizLibrary from "./quiz-library";
import WorkspaceFrame from "../workspace-frame";
import styles from "../workspace-content.module.css";

export const instant = false;
export default async function Quizzes() {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const quizzes = await db.quiz.findMany({ where: { teacherId: teacher.id }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, source: true, archivedAt: true, updatedAt: true, _count: { select: { sections: true, submissions: true } } } });
  const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Manila" });
  const items = quizzes.map(quiz => ({ id: quiz.id, title: quiz.title, source: quiz.source, archived: !!quiz.archivedAt, updated: date.format(quiz.updatedAt), papers: quiz._count.submissions }));
  return <WorkspaceFrame active="quizzes" teacherId={teacher.id}>
    <header className={styles.pageHeader}><div><span className={styles.eyebrow}>YOUR WORKSPACE / LIBRARY</span><h1>My quizzes &amp; keys.</h1><p>Find your saved answer keys and quizzes here. Choose one to check a student’s paper.</p></div><div className={styles.pageActions}><Link className={styles.buttonSecondary} href="/quizzes/import">↑ Import quiz</Link><Link className={styles.buttonSecondary} href="/quizzes/existing">+ Add an answer key</Link><Link className={styles.button} href="/quizzes/new">+ Create a quiz</Link></div></header>
    <QuizLibrary quizzes={items} />
  </WorkspaceFrame>;
}
