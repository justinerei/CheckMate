import { paperProgress } from "@/lib/paper-progress";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { paperDestination } from "@/lib/workspace-navigation";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import WorkspaceFrame from "../workspace-frame";
import styles from "../workspace-content.module.css";

export const instant = false;
export default async function Submissions() {
  await connection(); const teacher = await getTeacher(); if (!teacher) redirect("/");
  const submissions = await db.submission.findMany({ where: { teacherId: teacher.id, quiz: { teacherId: teacher.id } }, orderBy: { updatedAt: "desc" }, select: { id: true, status: true, expectedPages: true, pages: { select: { status: true, retryAt: true } }, paperName: true, student: { select: { name: true } }, quiz: { select: { title: true } }, _count: { select: { pages: true } } } });
  return <WorkspaceFrame active="papers" teacherId={teacher.id}><header className={styles.pageHeader}><div><span className={styles.eyebrow}>YOUR WORKSPACE / STUDENT PAPERS</span><h1>Student papers.</h1><p>Continue checking a paper or revisit a finalized result.</p></div><div className={styles.pageActions}><Link className={styles.button} href="/submissions/new">+ Check a paper</Link></div></header><section className={styles.listSection} aria-label="All student papers">{submissions.length ? <div className={styles.list}>{submissions.map(item => <Link className={styles.row} href={paperDestination(item.id, item.status, !!item.expectedPages && item.pages.length === item.expectedPages && item.pages.every(page => page.status === "COMPLETE"))} key={item.id}><span className={styles.rowIcon} aria-hidden="true">▤</span><span className={styles.rowMain}><strong>{item.paperName || item.student?.name || "Unnamed paper"}</strong><small>{item.quiz.title} · {item._count.pages}/{item.expectedPages ?? "?"} pages</small></span><span className={styles.status}>{paperProgress(item.status, item.expectedPages, item.pages).label}</span><span className={styles.rowAction}>{item.status === "FINALIZED" ? "View result" : "Continue"} <span aria-hidden="true">↗</span></span></Link>)}</div> : <div className={styles.empty}><strong>No papers yet</strong><p>Upload a student paper when your quiz is ready.</p><Link href="/submissions/new">Check your first paper ↗</Link></div>}</section></WorkspaceFrame>;
}
