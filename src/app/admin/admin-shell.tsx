import Link from "next/link";
import { signOut } from "@/auth";
import { PendingSubmit } from "@/app/pending-screen";
import WorkspaceMobileMenu from "@/app/workspace-mobile-menu";
import workspace from "@/app/workspace.module.css";
import styles from "./admin.module.css";
import WorkspaceProfileLink from "@/app/workspace-profile-link";
import { AdminLiveProvider } from "./admin-live-data";
import AdminNotifications from "./admin-notifications";
import live from "./admin-live.module.css";

const links = [
  { href: "/admin", label: "Overview", path: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z" },
  { href: "/admin/accounts", label: "Accounts", path: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M5 20a7 7 0 0 1 14 0" },
  { href: "/admin/queue", label: "Checking queue", path: "M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9z M12 7v5l3 2" },
  { href: "/admin/activity", label: "Activity", path: "M4 12h4l2-5 4 10 2-5h4" },
  { href: "/admin/reports", label: "Reports", path: "M5 20V10h3v10z M10.5 20V4h3v16z M16 20v-7h3v7z" },
];

export default function AdminShell({ admin, active, title, description, heading, children }: {
  admin: { id: string; name: string; email: string };
  active: string;
  title?: string;
  description?: string;
  heading?: React.ReactNode;
  children: React.ReactNode;
}) {
  const accountMenu = <WorkspaceProfileLink name={admin.name} email={admin.email} role="Administrator" href="/admin/profile">
    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
      <PendingSubmit pendingLabel="Signing out…"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17v3H5V4h5v3M14 8l4 4-4 4M8 12h10" /></svg>Sign out</PendingSubmit>
    </form>
  </WorkspaceProfileLink>;
  const nav = <nav className={workspace.nav} aria-label="Admin workspace"><p className={workspace.label}>ADMIN WORKSPACE</p>{links.map(link => <Link key={link.href} href={link.href} className={`${workspace.navItem} ${active === link.href ? workspace.active : ""}`} aria-current={active === link.href ? "page" : undefined}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={link.path} /></svg><span>{link.label}</span></Link>)}</nav>;
  return <div className={workspace.app}>
    <a className={workspace.skipLink} href="#admin-content">Skip to content</a>
    <aside className={workspace.rail}><Link className={workspace.brand} href="/admin">checkmate<span>.</span></Link>{nav}<div className={workspace.railBottom}>{accountMenu}</div></aside>
    <header className={workspace.mobileHeader}><Link className={workspace.brand} href="/admin">checkmate<span>.</span></Link><WorkspaceMobileMenu>{nav}<div className={workspace.mobileProfile}>{accountMenu}</div></WorkspaceMobileMenu></header>
    <main id="admin-content" tabIndex={-1} className={`${workspace.main} ${styles.adminMain}`}><div className={styles.page}>
      <AdminLiveProvider overview={active === "/admin"}>
        <div className={live.top}>
          {heading ?? (title && <div>
            <p className={styles.eyebrow}>ADMIN WORKSPACE <span aria-hidden="true"> / </span> {links.find(link => link.href === active)?.label.toUpperCase()}</p>
            <header className={styles.heading}><h1>{title}</h1><p>{description}</p></header>
          </div>)}
          <AdminNotifications adminId={admin.id} />
        </div>
        {children}
      </AdminLiveProvider>
    </div></main>
  </div>;
}
