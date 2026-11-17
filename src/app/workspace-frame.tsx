import Link from "next/link";
import { db } from "@/lib/db";
import { auth, signOut } from "@/auth";
import { teacherGoogleProfile } from "@/lib/teacher-google-profile";
import { PendingSubmit } from "./pending-screen";
import WorkspaceNavigation from "./workspace-navigation";
import WorkspaceMobileMenu from "./workspace-mobile-menu";
import styles from "./workspace.module.css";
import WorkspaceProfileLink from "./workspace-profile-link";

export type Active = "overview" | "quizzes" | "students";
export function WorkspaceShell({ email, name, image, children }: { active?: Active; email?: string | null; name?: string | null; image?: string | null; children: React.ReactNode }) {
  return <div className={styles.app}><a className={styles.skipLink} href="#workspace-content">Skip to content</a><aside className={styles.rail}><Link className={styles.brand} href="/dashboard">checkmate<span>.</span></Link><WorkspaceNavigation /><div className={styles.railBottom}><WorkspaceProfileLink name={name} email={email} image={image}><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><PendingSubmit className={styles.accountSignOut} pendingLabel="Signing out…"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17v3H5V4h5v3M14 8l4 4-4 4M8 12h10" /></svg>Sign out</PendingSubmit></form></WorkspaceProfileLink></div></aside><header className={styles.mobileHeader}><Link className={styles.brand} href="/dashboard">checkmate<span>.</span></Link><WorkspaceMobileMenu><WorkspaceNavigation /><div className={styles.mobileProfile}><WorkspaceProfileLink name={name} email={email} image={image}><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><PendingSubmit className={styles.accountSignOut} pendingLabel="Signing out…"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17v3H5V4h5v3M14 8l4 4-4 4M8 12h10" /></svg>Sign out</PendingSubmit></form></WorkspaceProfileLink></div></WorkspaceMobileMenu></header><main id="workspace-content" tabIndex={-1} className={styles.main}>{children}</main></div>;
}

export default async function WorkspaceFrame({ active, teacherId, children }: { active: Active; teacherId: string; children: React.ReactNode }) {
  const [user, session] = await Promise.all([db.user.findUnique({ where: { id: teacherId }, select: { email: true, name: true, googleId: true } }), auth()]);
  return <WorkspaceShell active={active} email={user?.email} name={user?.name} image={user ? teacherGoogleProfile(user.googleId, session?.user)?.image : null}>{children}</WorkspaceShell>;
}
