import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { quizDestination } from "@/lib/workspace-navigation";
import WorkspaceFrame from "../workspace-frame";
import styles from "../workspace-content.module.css";

export const instant = false;
export default async function Quizzes() {
  await connection(); const teacher = await getTeacher(); if (!teacher) redirect("/");
  const quizzes = await db.quiz.findMany({ where: { teacherId: teacher.id }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, source: true, updatedAt: true, _count: { select: { sections: true } } } });
  return <WorkspaceFrame active="quizzes" teacherId={teacher.id}><header className={styles.pageHeader}><div><span className={styles.eyebrow}>YOUR WORKSPACE / QUIZZES</span><h1>My quizzes.</h1><p>Your answer keys and quizzes, all in one place.</p></div><div className={styles.pageActions}><Link className={styles.buttonSecondary} href="/quizzes/existing">Set up existing quiz</Link><Link className={styles.button} href="/quizzes/new">+ Create a quiz</Link></div></header><section className={styles.listSection} aria-label="All quizzes">{quizzes.length ? <div className={styles.list}>{quizzes.map(quiz => <Link className={styles.row} href={quizDestination(quiz.id, quiz.source)} key={quiz.id}><span className={styles.rowIcon} aria-hidden="true">▦</span><span className={styles.rowMain}><strong>{quiz.title}</strong><small>{quiz.source === "EXISTING" ? "Existing answer key" : "Created in CheckMate"} · {quiz._count.sections} {quiz._count.sections === 1 ? "section" : "sections"}</small></span><time dateTime={quiz.updatedAt.toISOString()}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Shanghai" }).format(quiz.updatedAt)}</time><span className={styles.rowAction}>Open <span aria-hidden="true">↗</span></span></Link>)}</div> : <div className={styles.empty}><strong>No quizzes yet</strong><p>Set up an existing quiz or create your first quiz.</p><Link href="/quizzes/existing">Set up an existing quiz ↗</Link></div>}</section></WorkspaceFrame>;
}
