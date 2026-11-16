import Link from "next/link";
import { signOut } from "@/auth";
import { PendingSubmit } from "@/app/pending-screen";
import WorkspaceMobileMenu from "@/app/workspace-mobile-menu";
import workspace from "@/app/workspace.module.css";
import styles from "./admin.module.css";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/queue", label: "Checking queue" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/reports", label: "Reports" },
];

export default function AdminShell({ email, active, title, description, children }: {
  email: string;
  active: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const signout = <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><PendingSubmit className={workspace.signOut} pendingLabel="Signing out…">Sign out ↗</PendingSubmit></form>;
  const nav = <nav className={workspace.nav} aria-label="Admin workspace"><p className={workspace.label}>ADMIN WORKSPACE</p>{links.map(link => <Link key={link.href} href={link.href} className={`${workspace.navItem} ${active === link.href ? workspace.active : ""}`} aria-current={active === link.href ? "page" : undefined}>{link.label}</Link>)}</nav>;
  return <div className={workspace.app}>
    <a className={workspace.skipLink} href="#admin-content">Skip to content</a>
    <aside className={workspace.rail}><Link className={workspace.brand} href="/admin">checkmate<span>.</span></Link>{nav}<div className={workspace.railBottom}><p>Admin workspace</p><span>{email}</span>{signout}</div></aside>
    <header className={workspace.mobileHeader}><Link className={workspace.brand} href="/admin">checkmate<span>.</span></Link><WorkspaceMobileMenu>{nav}{signout}</WorkspaceMobileMenu></header>
    <main id="admin-content" tabIndex={-1} className={workspace.main}><div className={styles.page}>
      <p className={styles.eyebrow}>ADMIN WORKSPACE</p>
      <header className={styles.heading}><h1>{title}</h1><p>{description}</p></header>
      {children}
    </div></main>
  </div>;
}
