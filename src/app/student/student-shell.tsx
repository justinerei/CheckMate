import Link from "next/link";
import { signOut } from "@/auth";
import { PendingSubmit } from "@/app/pending-screen";
import WorkspaceMobileMenu from "@/app/workspace-mobile-menu";
import WorkspaceProfileLink from "@/app/workspace-profile-link";
import workspace from "@/app/workspace.module.css";

export default function StudentShell({ user, active, children }: {
  user: { name: string; email: string };
  active: "overview" | "classes" | "results" | "profile";
  children: React.ReactNode;
}) {
  const overview = active === "overview";
  const nav = <nav className={workspace.nav} aria-label="Student workspace">
    <p className={workspace.label}>YOUR WORKSPACE</p>
    <Link href="/student" className={`${workspace.navItem} ${overview ? workspace.active : ""}`} aria-current={overview ? "page" : undefined}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z" /></svg>
      Overview
    </Link>
    <Link href="/student/classes" className={`${workspace.navItem} ${active === "classes" ? workspace.active : ""}`} aria-current={active === "classes" ? "page" : undefined}>
      <span aria-hidden="true">▦</span>My classes
    </Link>
    <Link href="/student/results" className={`${workspace.navItem} ${active === "results" ? workspace.active : ""}`} aria-current={active === "results" ? "page" : undefined}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6" /></svg>
      My results
    </Link>
  </nav>;
  const account = <WorkspaceProfileLink name={user.name} email={user.email} role="Student" href="/student/profile">
    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
      <PendingSubmit pendingLabel="Signing out…">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17v3H5V4h5v3M14 8l4 4-4 4M8 12h10" /></svg>
        Sign out
      </PendingSubmit>
    </form>
  </WorkspaceProfileLink>;
  return <div className={workspace.app}>
    <a className={workspace.skipLink} href="#student-content">Skip to content</a>
    <aside className={workspace.rail}>
      <Link className={workspace.brand} href="/student">checkmate<span>.</span></Link>
      {nav}<div className={workspace.railBottom}>{account}</div>
    </aside>
    <header className={workspace.mobileHeader}>
      <Link className={workspace.brand} href="/student">checkmate<span>.</span></Link>
      <WorkspaceMobileMenu>{nav}<div className={workspace.mobileProfile}>{account}</div></WorkspaceMobileMenu>
    </header>
    <main id="student-content" tabIndex={-1} className={workspace.main}>{children}</main>
  </div>;
}
