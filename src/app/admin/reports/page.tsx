import { connection } from "next/server";
import { db } from "@/lib/db";
import AdminShell from "../admin-shell";
import Reports from "../reports";
import { requireAdmin } from "../require-admin";
import styles from "../admin.module.css";

export const instant = false;

export default async function ReportsPage() {
  await connection();
  const admin = await requireAdmin();
  const [users, quizzes, submissions, pages] = await Promise.all([
    db.user.findMany({ where: { role: { in: ["TEACHER", "STUDENT"] } }, select: { createdAt: true } }),
    db.quiz.findMany({ select: { createdAt: true } }),
    db.submission.findMany({ where: { status: "FINALIZED" }, select: { finalizedAt: true } }),
    db.submissionPage.findMany({ where: { status: { in: ["COMPLETE", "FAILED"] } }, select: { createdAt: true, status: true } }),
  ]);
  const entries = [
    ...users.map(user => ({ kind: "account" as const, date: user.createdAt.toISOString() })),
    ...quizzes.map(quiz => ({ kind: "quiz" as const, date: quiz.createdAt.toISOString() })),
    ...submissions.flatMap(paper => paper.finalizedAt ? [{ kind: "finalized" as const, date: paper.finalizedAt.toISOString() }] : []),
    ...pages.map(page => ({ kind: page.status === "COMPLETE" ? "complete" as const : "failed" as const, date: page.createdAt.toISOString() })),
  ];
  return <AdminShell admin={admin} active="/admin/reports" title="Reports." description="Explore account, quiz and checking activity.">
    <section className={styles.section}><Reports entries={entries} /></section>
  </AdminShell>;
}
