"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styles from "./workspace.module.css";

export default function WorkspaceMobileMenu({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (menu.current) menu.current.open = false; }, [pathname]);
  return <details ref={menu} className={styles.mobileMenu}><summary aria-label="Open workspace menu">Menu <span aria-hidden="true">☰</span></summary><div className={styles.menuPanel}>{children}</div></details>;
}
