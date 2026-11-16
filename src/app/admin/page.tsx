import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AdminShell from "./admin-shell";
import { requireAdmin } from "./require-admin";
import styles from "./admin.module.css";

export const instant = false;

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ queue?: string; accounts?: string }> }) {
  await connection();
  const admin = await requireAdmin();
  const params = await searchParams;
  if (params.accounts) redirect(`/admin/accounts?status=${encodeURIComponent(params.accounts)}`);
  if (params.queue) redirect(`/admin/queue?status=${encodeURIComponent(params.queue)}`);
  const now = new Date();
  const accountWhere = { role: { in: ["TEACHER", "STUDENT"] as ("TEACHER" | "STUDENT")[] } };
  const [active, disabled, locked, quizzes, finalized, pageCounts] = await Promise.all([
    db.user.count({ where: { ...accountWhere, enabled: true } }),
    db.user.count({ where: { ...accountWhere, enabled: false } }),
    db.user.count({ where: { ...accountWhere, lockedUntil: { gt: now } } }),
    db.quiz.count(),
    db.submission.count({ where: { status: "FINALIZED" } }),
    db.submissionPage.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const statuses = ["PENDING", "PROCESSING", "COMPLETE", "FAILED"] as const;
  return <AdminShell email={admin.email} active="/admin" title="Admin overview." description="Manage access and keep track of your workspace.">
    <section className={styles.metrics} aria-label="System overview">
      <Link href="/admin/accounts?status=ACTIVE"><span>ACTIVE ACCOUNTS</span><strong>{active}</strong></Link>
      <Link href="/admin/accounts?status=DISABLED"><span>DISABLED ACCOUNTS</span><strong>{disabled}</strong></Link>
      <Link href="/admin/accounts?status=LOCKED"><span>LOCKED ACCOUNTS</span><strong>{locked}</strong></Link>
      <div><span>QUIZZES</span><strong>{quizzes}</strong></div>
      <div><span>FINALIZED PAPERS</span><strong>{finalized}</strong></div>
      {statuses.map(status => <Link key={status} href={`/admin/queue?status=${status}`}><span>{status} PAGES</span><strong>{pageCounts.find(group => group.status === status)?._count._all ?? 0}</strong></Link>)}
    </section>
  </AdminShell>;
}
