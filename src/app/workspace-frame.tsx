import Link from "next/link";
import { signOut } from "@/auth";
import { db } from "@/lib/db";
import styles from "./workspace.module.css";
import { PendingSubmit } from "./pending-screen";

type Active = "overview" | "quizzes" | "students";
const links: { id: Active; label: string; href: string; path: string }[] = [
  { id: "overview", label: "Overview", href: "/dashboard", path: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z" },
  { id: "quizzes", label: "Quizzes & keys", href: "/quizzes", path: "M6 3h9l3 3v15H6z M14 3v4h4 M9 11h6 M9 15h6" },
  { id: "students", label: "Students", href: "/students", path: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M5 20a7 7 0 0 1 14 0" },
];
function Navigation({ active }: { active: Active }) {
  return <nav className={styles.nav} aria-label="Workspace"><p className={styles.label}>WORKSPACE</p>{links.map(link => <Link key={link.id} href={link.href} className={`${styles.navItem} ${active === link.id ? styles.active : ""}`} aria-current={active === link.id ? "page" : undefined}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={link.path}/></svg><span>{link.label}</span></Link>)}<div className={styles.navDivider}/><Link href="/quizzes/new" className={styles.navItem}><span className={styles.plus} aria-hidden="true">+</span><span>Create a quiz</span></Link></nav>;
}
export default async function WorkspaceFrame({ active, teacherId, children }: { active: Active; teacherId: string; children: React.ReactNode }) {
  const user = await db.user.findUnique({ where: { id: teacherId }, select: { email: true } });
  return <div className={styles.app}><aside className={styles.rail}><Link className={styles.brand} href="/dashboard">checkmate<span>.</span></Link><Navigation active={active}/><div className={styles.railBottom}><p>Your classroom, in one place.</p><span>{user?.email}</span><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><PendingSubmit className={styles.signOut} pendingLabel="Signing out…">Sign out ↗</PendingSubmit></form></div></aside><header className={styles.mobileHeader}><Link className={styles.brand} href="/dashboard">checkmate<span>.</span></Link><details className={styles.mobileMenu}><summary aria-label="Open workspace menu">Menu <span aria-hidden="true">☰</span></summary><div className={styles.menuPanel}><Navigation active={active}/><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><PendingSubmit className={styles.signOut} pendingLabel="Signing out…">Sign out ↗</PendingSubmit></form></div></details></header><main className={styles.main}>{children}</main></div>;
}
