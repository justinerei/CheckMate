import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import PhotoPages from "./photo-pages";
import styles from "../submissions.module.css";

export const instant = false;
export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const { id } = await params;
  const submission = await db.submission.findFirst({ where: { id, teacherId: teacher.id, quiz: { teacherId: teacher.id } }, select: { id: true, status: true, expectedPages: true, student: { select: { name: true } }, quiz: { select: { title: true } }, pages: { orderBy: { pageNumber: "asc" }, select: { id: true, pageNumber: true, status: true, error: true, retryAt: true } } } });
  if (!submission) notFound();
  return <main className={styles.shell}><header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link href="/submissions" className={styles.back}>← Submissions</Link></header><div className={styles.content}><p className={styles.eyebrow}>STUDENT PAPER / PHOTOS</p><h1>{submission.student.name}</h1><p className={styles.description}>{submission.quiz.title} · Upload clear, well-lit JPEG or PNG photos, one per page. Maximum 8 MB per photo.</p>{submission.expectedPages ? <PhotoPages id={id} expectedPages={submission.expectedPages} status={submission.status} pages={submission.pages.map(p => ({ ...p, retryAt: p.retryAt?.toISOString() ?? null }))} /> : <p className={styles.error}>This older submission has no expected page count and cannot accept photos yet.</p>}</div></main>;
}
