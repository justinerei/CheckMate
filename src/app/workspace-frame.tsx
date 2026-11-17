import Link from "next/link";
import { db } from "@/lib/db";
import WorkspaceNavigation from "./workspace-navigation";
import WorkspaceMobileMenu from "./workspace-mobile-menu";
import styles from "./workspace.module.css";
import WorkspaceProfileLink from "./workspace-profile-link";

export type Active = "overview" | "quizzes" | "students";
export function WorkspaceShell({ email, children }: { active?: Active; email?: string | null; children: React.ReactNode }) {
  return <div className={styles.app}><a className={styles.skipLink} href="#workspace-content">Skip to content</a><aside className={styles.rail}><Link className={styles.brand} href="/dashboard">checkmate<span>.</span></Link><WorkspaceNavigation /><div className={styles.railBottom}><WorkspaceProfileLink email={email} /></div></aside><header className={styles.mobileHeader}><Link className={styles.brand} href="/dashboard">checkmate<span>.</span></Link><WorkspaceMobileMenu><WorkspaceNavigation /><div className={styles.mobileProfile}><WorkspaceProfileLink email={email} /></div></WorkspaceMobileMenu></header><main id="workspace-content" tabIndex={-1} className={styles.main}>{children}</main></div>;
}

export default async function WorkspaceFrame({ active, teacherId, children }: { active: Active; teacherId: string; children: React.ReactNode }) {
  const user = await db.user.findUnique({ where: { id: teacherId }, select: { email: true } });
  return <WorkspaceShell active={active} email={user?.email}>{children}</WorkspaceShell>;
}
