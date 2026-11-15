"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styles from "./workspace.module.css";

export default function WorkspaceMobileMenu({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (menu.current) menu.current.open = false; }, [pathname]);
  useEffect(() => {
    function dismissOnOutsidePointer(event: PointerEvent) {
      if (menu.current?.open && !menu.current.contains(event.target as Node)) menu.current.open = false;
    }
    document.addEventListener("pointerdown", dismissOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", dismissOnOutsidePointer);
  }, []);
  return <details ref={menu} className={styles.mobileMenu} onKeyDown={event => { if (event.key === "Escape" && menu.current?.open) { event.preventDefault(); menu.current.open = false; menu.current.querySelector("summary")?.focus(); } }}><summary>Menu <span aria-hidden="true">☰</span></summary><div className={styles.menuPanel}>{children}</div></details>;
}
