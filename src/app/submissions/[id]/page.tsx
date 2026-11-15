import { paperBackDestination, paperOrigin } from "@/lib/back-navigation";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import PhotoPages from "./photo-pages";
import styles from "../submissions.module.css";

export const instant = false;
export default async function SubmissionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ camera?: string | string[]; from?: string; origin?: string }> }) {
  await connection();
  const teacher = await getTeacher();
  if (!teacher) redirect("/");
  const { id } = await params;
  const { camera: cameraParam, from, origin } = await searchParams;
  const camera = cameraParam === "1";
  const submission = await db.submission.findFirst({ where: { id, teacherId: teacher.id, quiz: { teacherId: teacher.id } }, select: { id: true, quizId: true, batchId: true, status: true, expectedPages: true, paperName: true, student: { select: { name: true } }, batch: { select: { _count: { select: { submissions: true } } } }, quiz: { select: { title: true, source: true } }, pages: { orderBy: { pageNumber: "asc" }, select: { id: true, pageNumber: true, status: true, error: true, retryAt: true } } } });
  if (!submission) notFound();
  const back = paperBackDestination(submission, from, origin);
  const reviewOrigin = from === "review" ? paperOrigin(origin) : paperOrigin(from);
  return <main className={styles.shell}><header className={styles.header}><Link href="/dashboard" className={styles.logo}>checkmate<span>.</span></Link><Link href={back.href} className="back-navigation">{back.label}</Link></header><div className={styles.content}><p className={styles.eyebrow}>STUDENT PAPER / PHOTOS</p><h1>{submission.paperName || submission.student?.name || "Student paper"}</h1><p className={styles.description}>{submission.quiz.title} · Upload one clear, well-lit photo per page.</p>{submission.expectedPages ? <PhotoPages key={id} autoCamera={camera} reviewOrigin={reviewOrigin} id={id} batchId={submission.batchId} batchPaperCount={submission.batch?._count.submissions ?? 0} expectedPages={submission.expectedPages} status={submission.status} existing={submission.quiz.source === "EXISTING"} pages={submission.pages.map(p => ({ ...p, retryAt: p.retryAt?.toISOString() ?? null }))} /> : <p className={styles.error}>This older submission has no expected page count and cannot accept photos yet.</p>}</div></main>;
}
