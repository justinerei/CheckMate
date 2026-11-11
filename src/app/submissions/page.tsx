import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import styles from "./submissions.module.css";

export const instant = false;
export default async function Submissions() {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const submissions = await db.submission.findMany({ where: { teacherId: teacher.id, quiz: { teacherId: teacher.id } }, orderBy: { createdAt: "desc" }, select: { id: true, status: true, expectedPages: true, paperName: true, student: { select: { name: true } }, quiz: { select: { title: true } }, _count: { select: { pages: true } } } });
  return <main className={styles.shell}><header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link href="/dashboard" className={styles.back}>← Dashboard</Link></header><div className={styles.content}><div className={styles.titleRow}><div><p className={styles.eyebrow}>YOUR WORKSPACE / SUBMISSIONS</p><h1>Student papers.</h1><p className={styles.description}>Upload and organize one student paper at a time.</p></div><Link className={styles.primary} href="/submissions/new">＋ New submission</Link></div><section className={styles.list}><h2>Your submissions</h2>{!submissions.length ? <div className={styles.empty}><p>No submissions yet. Start by selecting a quiz.</p><Link href="/submissions/new">Create a submission ↗</Link></div> : <ul>{submissions.map(item => <li key={item.id}><Link href={`/submissions/${item.id}`}><strong>{item.paperName || item.student?.name || "Unnamed paper"}</strong><span>{item.quiz.title} · {item._count.pages}/{item.expectedPages ?? "?"} pages · {item.status === "DRAFT" ? "Uploading" : item.status === "IN_REVIEW" ? "Pages confirmed" : "Finalized"}</span></Link></li>)}</ul>}</section></div></main>;
}
