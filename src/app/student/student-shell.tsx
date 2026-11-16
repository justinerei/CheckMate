import Link from "next/link";
import { signOut } from "@/auth";
import { PendingSubmit } from "@/app/pending-screen";
import WorkspaceMobileMenu from "@/app/workspace-mobile-menu";
import workspace from "@/app/workspace.module.css";

export default function StudentShell({ email, active, children }: { email: string; active: "overview" | "results"; children: React.ReactNode }) {
  const nav = <nav className={workspace.nav} aria-label="Student workspace"><p className={workspace.label}>YOUR WORKSPACE</p><Link href="/student" className={`${workspace.navItem} ${active === "overview" ? workspace.active : ""}`} aria-current={active === "overview" ? "page" : undefined}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z" /></svg>Overview</Link><Link href="/student/results" className={`${workspace.navItem} ${active === "results" ? workspace.active : ""}`} aria-current={active === "results" ? "page" : undefined}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l3 3v15H6z M14 3v4h4 M9 11h6 M9 15h6" /></svg>My results</Link></nav>;
  const signout = <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><PendingSubmit className={workspace.signOut} pendingLabel="Signing out…">Sign out ↗</PendingSubmit></form>;
  return <div className={workspace.app}><a className={workspace.skipLink} href="#student-content">Skip to content</a><aside className={workspace.rail}><Link className={workspace.brand} href="/student">checkmate<span>.</span></Link>{nav}<div className={workspace.railBottom}><p>Your progress, in one place.</p><span>{email}</span>{signout}</div></aside><header className={workspace.mobileHeader}><Link className={workspace.brand} href="/student">checkmate<span>.</span></Link><WorkspaceMobileMenu>{nav}{signout}</WorkspaceMobileMenu></header><main id="student-content" tabIndex={-1} className={workspace.main}>{children}</main></div>;
}
