import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import PhotoPages from "./photo-pages";
import styles from "../submissions.module.css";

export const instant = false;
export default async function SubmissionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ camera?: string | string[] }> }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const { id } = await params;
  const camera = (await searchParams).camera === "1";
  const submission = await db.submission.findFirst({ where: { id, teacherId: teacher.id, quiz: { teacherId: teacher.id } }, select: { id: true, status: true, expectedPages: true, paperName: true, student: { select: { name: true } }, quiz: { select: { title: true, source: true } }, pages: { orderBy: { pageNumber: "asc" }, select: { id: true, pageNumber: true, status: true, error: true, retryAt: true } } } });
  if (!submission) notFound();
  return <main className={styles.shell}><header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link href={submission.status === "DRAFT" ? "/submissions" : `/submissions/${id}/review`} className={styles.back}>{submission.status === "DRAFT" ? "← Back to student papers" : submission.status === "FINALIZED" ? "← Back to result" : "← Back to review"}</Link></header><div className={styles.content}><p className={styles.eyebrow}>STUDENT PAPER / PHOTOS</p><h1>{submission.paperName || submission.student?.name || "Student paper"}</h1><p className={styles.description}>{submission.quiz.title} · Upload clear, well-lit JPEG or PNG photos, one per page. Maximum 8 MB per photo.</p>{submission.expectedPages ? <PhotoPages autoCamera={camera} id={id} expectedPages={submission.expectedPages} status={submission.status} existing={submission.quiz.source === "EXISTING"} pages={submission.pages.map(p => ({ ...p, retryAt: p.retryAt?.toISOString() ?? null }))} /> : <p className={styles.error}>This older submission has no expected page count and cannot accept photos yet.</p>}<div className={styles.backFooter}><Link href={submission.status === "DRAFT" ? "/submissions" : `/submissions/${id}/review`} className={styles.secondary}>{submission.status === "DRAFT" ? "← Back to student papers" : submission.status === "FINALIZED" ? "← Back to result" : "← Back to review"}</Link>{submission.status === "DRAFT" && <p>Uploaded photos are saved. You can continue this paper from Student papers.</p>}</div></div></main>;
}
