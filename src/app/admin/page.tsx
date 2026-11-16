import Link from "next/link";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { PendingSubmit } from "@/app/pending-screen";
import WorkspaceMobileMenu from "@/app/workspace-mobile-menu";
import workspace from "@/app/workspace.module.css";
import styles from "./admin.module.css";
import AccountList from "./account-list";
import CheckingQueue from "./checking-queue";
import ActivityHistory from "./activity-history";
import Reports from "./reports";

export const instant = false;

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ queue?: string; accounts?: string }> }) {
  await connection();
  const session = await auth();
  const admin = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { role: true, enabled: true, email: true } }) : null;
  if (!admin?.enabled || admin.role !== "ADMIN") redirect("/");
  const params = await searchParams;
  const [users, quizzes, submissions, pages, activity] = await Promise.all([
    db.user.findMany({ where: { role: { in: ["TEACHER", "STUDENT"] } }, select: { id: true, name: true, email: true, role: true, enabled: true, createdAt: true, lockedUntil: true, _count: { select: { quizzes: true, submissions: true } }, studentRecord: { select: { _count: { select: { submissions: true } } } } }, orderBy: { createdAt: "desc" } }),
    db.quiz.findMany({ select: { createdAt: true } }),
    db.submission.findMany({ where: { status: "FINALIZED" }, select: { finalizedAt: true } }),
    db.submissionPage.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, pageNumber: true, status: true, error: true, retryAt: true, createdAt: true, submission: { select: { batchId: true, status: true, quiz: { select: { title: true } }, teacher: { select: { name: true, email: true } } } } } }),
    db.adminActivity.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, action: true, reason: true, createdAt: true, actor: { select: { name: true, email: true } }, target: { select: { name: true, email: true } } } }),
  ]);
  const now = new Date();
  const format = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
  const statuses = ["PENDING", "PROCESSING", "COMPLETE", "FAILED"] as const;
  const accountData = users.map(user => ({ ...user, createdAt: format.format(user.createdAt), lockedUntil: user.lockedUntil && user.lockedUntil > now ? format.format(user.lockedUntil) : null, _count: { quizzes: user._count.quizzes, submissions: user.role === "STUDENT" ? user.studentRecord?._count.submissions ?? 0 : user._count.submissions } }));
  const pageData = pages.map(page => ({ id: page.id, pageNumber: page.pageNumber, status: page.status, error: page.error, retryAt: page.retryAt?.toISOString() ?? null, createdAt: page.createdAt.toISOString(), quiz: page.submission.quiz.title, teacher: `${page.submission.teacher.name} (${page.submission.teacher.email})`, batch: !!page.submission.batchId, inReview: page.submission.status === "IN_REVIEW" }));
  const entries = [
    ...users.map(user => ({ kind: "account" as const, date: user.createdAt.toISOString() })),
    ...quizzes.map(quiz => ({ kind: "quiz" as const, date: quiz.createdAt.toISOString() })),
    ...submissions.flatMap(paper => paper.finalizedAt ? [{ kind: "finalized" as const, date: paper.finalizedAt.toISOString() }] : []),
    ...pages.flatMap(page => page.status === "COMPLETE" || page.status === "FAILED" ? [{ kind: page.status === "COMPLETE" ? "complete" as const : "failed" as const, date: page.createdAt.toISOString() }] : []),
  ];
  const signout = <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><PendingSubmit className={workspace.signOut} pendingLabel="Signing out…">Sign out ↗</PendingSubmit></form>;
  const nav = <nav className={workspace.nav} aria-label="Admin workspace"><p className={workspace.label}>ADMIN WORKSPACE</p><Link href="/admin" className={`${workspace.navItem} ${workspace.active}`} aria-current="page">Overview</Link><a href="#accounts" className={workspace.navItem}>Accounts</a><a href="#queue" className={workspace.navItem}>Checking queue</a><a href="#activity" className={workspace.navItem}>Activity</a><a href="#reports" className={workspace.navItem}>Reports</a></nav>;
  return <div className={workspace.app}><a className={workspace.skipLink} href="#admin-content">Skip to content</a><aside className={workspace.rail}><Link className={workspace.brand} href="/admin">checkmate<span>.</span></Link>{nav}<div className={workspace.railBottom}><p>Admin workspace</p><span>{admin.email}</span>{signout}</div></aside><header className={workspace.mobileHeader}><Link className={workspace.brand} href="/admin">checkmate<span>.</span></Link><WorkspaceMobileMenu>{nav}{signout}</WorkspaceMobileMenu></header><main id="admin-content" tabIndex={-1} className={workspace.main}>
    <div className={styles.page}><p className={styles.eyebrow}>ADMIN WORKSPACE</p><header className={styles.heading}><h1>Admin overview.</h1><p>Manage access and keep track of your workspace.</p></header>
      <section className={styles.metrics} aria-label="System overview">
        <a href="/admin?accounts=ACTIVE#accounts"><span>ACTIVE ACCOUNTS</span><strong>{users.filter(user => user.enabled).length}</strong></a>
        <a href="/admin?accounts=DISABLED#accounts"><span>DISABLED ACCOUNTS</span><strong>{users.filter(user => !user.enabled).length}</strong></a>
        <a href="/admin?accounts=LOCKED#accounts"><span>LOCKED ACCOUNTS</span><strong>{users.filter(user => user.lockedUntil && user.lockedUntil > now).length}</strong></a>
        <div><span>QUIZZES</span><strong>{quizzes.length}</strong></div><div><span>FINALIZED PAPERS</span><strong>{submissions.length}</strong></div>
        {statuses.map(status => <a key={status} href={`/admin?queue=${status}#queue`}><span>{status} PAGES</span><strong>{pages.filter(page => page.status === status).length}</strong></a>)}
      </section>
      <section id="accounts" className={styles.section}><div className={styles.sectionHeading}><h2>Accounts</h2><p>Find teachers and students, and manage their access.</p></div><AccountList key={params.accounts} initialStatus={params.accounts} users={accountData} /></section>
      <section id="queue" className={styles.section}><div className={styles.sectionHeading}><h2>Checking queue</h2><p>Monitor uploaded pages and retry eligible batch pages.</p></div><CheckingQueue key={params.queue} initialStatus={params.queue} pages={pageData} /></section>
      <section id="activity" className={styles.section}><div className={styles.sectionHeading}><h2>Activity</h2><p>Review account and checking actions.</p></div><ActivityHistory events={activity.map(event => ({ ...event, createdAt: event.createdAt.toISOString() }))} /></section>
      <section id="reports" className={styles.section}><div className={styles.sectionHeading}><h2>Reports</h2><p>Explore account, quiz and checking activity.</p></div><Reports entries={entries} /></section>
    </div>
  </main></div>;
}
