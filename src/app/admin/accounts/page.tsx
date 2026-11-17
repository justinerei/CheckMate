import { connection } from "next/server";
import { db } from "@/lib/db";
import AdminShell from "../admin-shell";
import AccountList from "../account-list";
import { requireAdmin } from "../require-admin";
import styles from "../admin.module.css";

export const instant = false;

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await connection();
  const admin = await requireAdmin();
  const { status, q } = await searchParams;
  const users = await db.user.findMany({
    where: { role: { in: ["TEACHER", "STUDENT"] } },
    select: { id: true, name: true, email: true, role: true, enabled: true, createdAt: true, lockedUntil: true, _count: { select: { quizzes: true, submissions: true } }, studentRecord: { select: { _count: { select: { submissions: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();
  const format = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
  const accounts = users.map(user => ({
    id: user.id, name: user.name, email: user.email, role: user.role, enabled: user.enabled,
    createdAt: format.format(user.createdAt),
    lockedUntil: user.lockedUntil && user.lockedUntil > now ? format.format(user.lockedUntil) : null,
    _count: { quizzes: user._count.quizzes, submissions: user.role === "STUDENT" ? user.studentRecord?._count.submissions ?? 0 : user._count.submissions },
  }));
  return <AdminShell admin={admin} active="/admin/accounts" title="Accounts." description="Find teachers and students, and manage their access.">
    <section className={styles.section}><AccountList key={JSON.stringify([status, q])} initialStatus={status} initialQuery={q} users={accounts} /></section>
  </AdminShell>;
}
