import Link from "next/link";
import { signOut } from "@/auth";
import { db } from "@/lib/db";
import WorkspaceNavigation from "./workspace-navigation";
import WorkspaceMobileMenu from "./workspace-mobile-menu";
import styles from "./workspace.module.css";
import { PendingSubmit } from "./pending-screen";

export type Active = "overview" | "quizzes" | "students";
export function WorkspaceShell({ email, children }: { active?: Active; email?: string | null; children: React.ReactNode }) {
  return <div className={styles.app}><aside className={styles.rail}><Link className={styles.brand} href="/dashboard">checkmate<span>.</span></Link><WorkspaceNavigation /><div className={styles.railBottom}><p>Your classroom, in one place.</p><span>{email ?? ""}</span><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><PendingSubmit className={styles.signOut} pendingLabel="Signing out…">Sign out ↗</PendingSubmit></form></div></aside><header className={styles.mobileHeader}><Link className={styles.brand} href="/dashboard">checkmate<span>.</span></Link><WorkspaceMobileMenu><WorkspaceNavigation /><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><PendingSubmit className={styles.signOut} pendingLabel="Signing out…">Sign out ↗</PendingSubmit></form></WorkspaceMobileMenu></header><main className={styles.main}>{children}</main></div>;
}

export default async function WorkspaceFrame({ active, teacherId, children }: { active: Active; teacherId: string; children: React.ReactNode }) {
  const user = await db.user.findUnique({ where: { id: teacherId }, select: { email: true } });
  return <WorkspaceShell active={active} email={user?.email}>{children}</WorkspaceShell>;
}
