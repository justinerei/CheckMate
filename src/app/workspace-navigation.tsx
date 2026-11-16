"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { workspaceActive } from "@/lib/workspace-navigation";
import styles from "./workspace.module.css";

const links = [
  { id: "overview", label: "Overview", href: "/dashboard", path: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z" },
  { id: "quizzes", label: "Quizzes & keys", href: "/quizzes", path: "M6 3h9l3 3v15H6z M14 3v4h4 M9 11h6 M9 15h6" },
  { id: "students", label: "Classes", href: "/students", path: "M4 5h16v14H4z M4 10h16 M9 10v9" },
] as const;
export default function WorkspaceNavigation() {
  const active = workspaceActive(usePathname());
  return <nav className={styles.nav} aria-label="Workspace"><p className={styles.label}>WORKSPACE</p>{links.map(link => <Link key={link.id} href={link.href} className={`${styles.navItem} ${active === link.id ? styles.active : ""}`} aria-current={active === link.id ? "page" : undefined}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={link.path}/></svg><span>{link.label}</span></Link>)}<div className={styles.navDivider}/><Link href="/quizzes/new" className={styles.navItem}><span className={styles.plus} aria-hidden="true">+</span><span>Create a quiz</span></Link></nav>;
}
