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

export const instant = false;
export default async function AdminPage() {
  await connection();
  const session = await auth();
  const admin = session?.user?.id ? await db.user.findUnique({ where: { googleId: session.user.id }, select: { role: true, enabled: true, email: true, name: true } }) : null;
  if (!admin?.enabled || admin.role !== "ADMIN") redirect("/");
  const [users, quizzes, papers, activity] = await Promise.all([
    db.user.findMany({ where: { role: { in: ["TEACHER", "STUDENT"] } }, select: { id: true, name: true, email: true, role: true, enabled: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
    db.quiz.count(), db.submission.count({ where: { status: "FINALIZED" } }),
    db.adminActivity.findMany({ orderBy: { createdAt: "desc" }, take: 25, select: { id: true, action: true, createdAt: true, actor: { select: { name: true, email: true } }, target: { select: { name: true, email: true } } } }),
  ]);
  const format = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
  const signout = <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><PendingSubmit className={workspace.signOut} pendingLabel="Signing out…">Sign out ↗</PendingSubmit></form>;
  const nav = <nav className={workspace.nav} aria-label="Admin workspace"><p className={workspace.label}>ADMIN WORKSPACE</p><Link href="/admin" className={`${workspace.navItem} ${workspace.active}`} aria-current="page"><span className={workspace.plus} aria-hidden="true">▦</span>Overview</Link><a href="#accounts" className={workspace.navItem}>Accounts</a><a href="#activity" className={workspace.navItem}>Activity</a></nav>;
  return <div className={workspace.app}><a className={workspace.skipLink} href="#admin-content">Skip to content</a><aside className={workspace.rail}><Link className={workspace.brand} href="/admin">checkmate<span>.</span></Link>{nav}<div className={workspace.railBottom}><p>Admin workspace</p><span>{admin.email}</span>{signout}</div></aside><header className={workspace.mobileHeader}><Link className={workspace.brand} href="/admin">checkmate<span>.</span></Link><WorkspaceMobileMenu>{nav}{signout}</WorkspaceMobileMenu></header><main id="admin-content" tabIndex={-1} className={workspace.main}>
    <div className={styles.page}><p className={styles.eyebrow}>ADMIN WORKSPACE <span>✳</span></p><header className={styles.heading}><h1>Admin overview.</h1><p>Manage access and keep track of your workspace.</p></header>
      <section className={styles.metrics} aria-label="System overview"><div><span>ACCOUNTS</span><strong>{users.length}</strong><small>Teachers and students</small></div><div><span>QUIZZES</span><strong>{quizzes}</strong><small>Created and saved keys</small></div><div><span>FINALIZED</span><strong>{papers}</strong><small>Checked papers</small></div></section>
      <section id="accounts" className={styles.section}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>01 / MANAGE ACCESS</p><h2>Accounts</h2><p>Find teachers and students, and manage their access.</p></div></div><AccountList users={users.map(user => ({ ...user, createdAt: format.format(user.createdAt) }))} /></section>
      <section id="activity" className={styles.section}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>02 / RECENT CHANGES</p><h2>Activity</h2><p>Most recent account access changes, up to 25.</p></div></div>{activity.length ? <ul className={styles.activity}>{activity.map(event => <li key={event.id}><span className={styles.activityIcon} aria-hidden="true">↗</span><div><strong>{event.action === "ACCOUNT_ENABLED" ? "Access enabled" : event.action === "ACCOUNT_DISABLED" ? "Access disabled" : "Account updated"}</strong><p>{event.target.name} · {event.target.email}</p><small>By {event.actor.name} ({event.actor.email}) · {format.format(event.createdAt)}</small></div></li>)}</ul> : <div className={styles.empty}><strong>No activity yet</strong><p>Account access changes will appear here.</p></div>}</section>
    </div>
  </main></div>;
}
