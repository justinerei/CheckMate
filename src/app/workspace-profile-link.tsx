"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./workspace.module.css";

export default function WorkspaceProfileLink({ email }: { email?: string | null }) {
  const current = usePathname() === "/profile";
  return <Link href="/profile" className={`${styles.profileLink} ${current ? styles.profileLinkActive : ""}`} aria-current={current ? "page" : undefined}>
    <span className={styles.profileIcon} aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M5 20a7 7 0 0 1 14 0" /></svg></span>
    <span className={styles.profileText}><strong>My profile</strong>{email && <small>{email}</small>}</span><span className={styles.profileChevron} aria-hidden="true">›</span>
  </Link>;
}
