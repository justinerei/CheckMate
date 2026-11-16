"use client";

import { useEffect, useRef } from "react";
import styles from "./admin.module.css";

export default function AccountMenu({ email, children }: { email: string; children: React.ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (menu.current?.open && !menu.current.contains(event.target as Node)) menu.current.open = false;
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  return <details ref={menu} className={styles.accountMenu} onKeyDown={event => {
    if (event.key === "Escape" && menu.current?.open) {
      event.preventDefault();
      event.stopPropagation();
      menu.current.open = false;
      menu.current.querySelector("summary")?.focus();
    }
  }}>
    <summary className={styles.accountTrigger}>
      <span className={styles.profileAvatar} aria-hidden="true">A</span>
      <span className={styles.accountTriggerText}>My profile <small>Administrator</small></span>
      <span className={styles.accountChevron} aria-hidden="true">⌃</span>
    </summary>
    <div className={styles.accountPopover}>
      <span className={styles.accountPopoverLabel}>Signed in as</span>
      <span className={styles.accountEmail}>{email}</span>
      {children}
    </div>
  </details>;
}
