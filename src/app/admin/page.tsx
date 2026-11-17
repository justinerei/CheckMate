import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AdminShell from "./admin-shell";
import CheckingOverview from "./checking-overview";
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
  const [active, disabled, locked, quizzes, finalized, activity] = await Promise.all([
    db.user.count({ where: { ...accountWhere, enabled: true } }),
    db.user.count({ where: { ...accountWhere, enabled: false } }),
    db.user.count({ where: { ...accountWhere, lockedUntil: { gt: now } } }),
    db.quiz.count(),
    db.submission.count({ where: { status: "FINALIZED" } }),
    db.adminActivity.findMany({ orderBy: { createdAt: "desc" }, take: 3, select: { id: true, action: true, createdAt: true, target: { select: { name: true } } } }),
  ]);
  const actionLabels: Record<string, string> = { ACCOUNT_ENABLED: "Access enabled", ACCOUNT_DISABLED: "Access disabled", ACCOUNT_UNLOCKED: "Account unlocked", PAGE_RETRY: "Page queued for retry" };
  const format = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
  return <AdminShell admin={admin} active="/admin" title="Admin overview." description="Manage access and keep track of your workspace.">
    <div className={styles.overviewPanels}>
      <section className={styles.overviewPanel}><div className={styles.overviewHeader}><h2>Account access</h2><Link href="/admin/accounts">View accounts →</Link></div><div className={styles.overviewRows}><Link className={styles.overviewRow} href="/admin/accounts?status=LOCKED"><span>Locked accounts</span><strong>{locked}</strong></Link><Link className={styles.overviewRow} href="/admin/accounts?status=DISABLED"><span>Disabled accounts</span><strong>{disabled}</strong></Link></div></section>
      <section className={styles.overviewPanel}><div className={styles.overviewHeader}><h2>Recent activity</h2><Link href="/admin/activity">View all →</Link></div>{activity.length ? <ul className={styles.overviewActivity}>{activity.map(event => <li key={event.id}><strong>{actionLabels[event.action] ?? event.action}</strong><span>{event.target.name} · {format.format(event.createdAt)}</span></li>)}</ul> : <p className={styles.overviewEmpty}>Account access changes and retries will appear here.</p>}</section>
    </div>
    <CheckingOverview />
    <section className={styles.metrics} aria-label="System overview">
      <Link href="/admin/accounts?status=ACTIVE"><span>Active accounts</span><strong>{active}</strong><small>Teachers and students</small></Link>
      <div><span>Quizzes</span><strong>{quizzes}</strong><small>Created and saved</small></div>
      <div><span>Finalized papers</span><strong>{finalized}</strong><small>Checked papers</small></div>
    </section>
  </AdminShell>;
}
