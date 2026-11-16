import { connection } from "next/server";
import { db } from "@/lib/db";
import AdminShell from "../admin-shell";
import CheckingQueue from "../checking-queue";
import { requireAdmin } from "../require-admin";
import styles from "../admin.module.css";

export const instant = false;

export default async function QueuePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await connection();
  const admin = await requireAdmin();
  const { status } = await searchParams;
  const pages = await db.submissionPage.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, pageNumber: true, status: true, error: true, retryAt: true, createdAt: true, submission: { select: { batchId: true, status: true, quiz: { select: { title: true } }, teacher: { select: { name: true, email: true } } } } },
  });
  const pageData = pages.map(page => ({
    id: page.id, pageNumber: page.pageNumber, status: page.status, error: page.error,
    retryAt: page.retryAt?.toISOString() ?? null, createdAt: page.createdAt.toISOString(),
    quiz: page.submission.quiz.title, teacher: `${page.submission.teacher.name} (${page.submission.teacher.email})`,
    batch: !!page.submission.batchId, inReview: page.submission.status === "IN_REVIEW",
  }));
  return <AdminShell email={admin.email} active="/admin/queue" title="Checking queue." description="Monitor uploaded pages and retry eligible batch pages.">
    <section className={styles.section}><CheckingQueue key={status} initialStatus={status} pages={pageData} /></section>
  </AdminShell>;
}
