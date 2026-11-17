"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./workspace.module.css";
import ProfileAvatar from "./profile-avatar";

export default function WorkspaceProfileLink({ name, email, image, role = "Teacher", href = "/profile", children }: { name?: string | null; email?: string | null; image?: string | null; role?: string; href?: string; children: React.ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const displayName = name?.trim() || role;
  useEffect(() => { if (menu.current) menu.current.open = false; }, [pathname]);
  useEffect(() => {
    function closeOutside(event: PointerEvent) { if (menu.current?.open && !menu.current.contains(event.target as Node)) menu.current.open = false; }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);
  return <details ref={menu} className={styles.accountMenu} onKeyDown={event => {
    if (event.key === "Escape" && menu.current?.open) { event.preventDefault(); event.stopPropagation(); menu.current.open = false; menu.current.querySelector("summary")?.focus(); }
  }}>
    <summary className={styles.accountTrigger}>
      <ProfileAvatar className={styles.accountAvatar} image={image} initial={displayName.charAt(0).toUpperCase()} />
      <span className={styles.accountName}><strong title={displayName}>{displayName}</strong><small>{role}</small></span>
      <span className={styles.accountChevron} aria-hidden="true">⌃</span>
    </summary>
    <div className={styles.accountPopover}>
      <div className={styles.accountIdentity}><ProfileAvatar className={styles.accountAvatar} image={image} initial={displayName.charAt(0).toUpperCase()} /><span><strong>{displayName}</strong>{email && <small>{email}</small>}</span></div>
      <div className={styles.accountActions}><Link href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => { if (menu.current) menu.current.open = false; }}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M5 20a7 7 0 0 1 14 0" /></svg>My profile</Link>{children}</div>
    </div>
  </details>;
}
