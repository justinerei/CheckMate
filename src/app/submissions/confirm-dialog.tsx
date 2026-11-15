"use client";
import { useEffect, useId, useRef } from "react";
import Mascot from "@/app/mascot";
import styles from "./submissions.module.css";

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, mascot = false }: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; mascot?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();
  useEffect(() => { const element = dialog.current; if (element && !element.open) element.showModal(); return () => { if (element?.open) element.close(); }; }, []);
  return <dialog ref={dialog} className={styles.confirmDialog} aria-labelledby={titleId} aria-describedby={messageId} onCancel={event => { event.preventDefault(); onCancel(); }}>
    {mascot ? <Mascot state="focused" width={88} height={88} /> : <span className={styles.confirmDialogIcon} aria-hidden="true">!</span>}
    <h2 id={titleId}>{title}</h2><p id={messageId}>{message}</p>
    <div className={styles.confirmDialogActions}><button type="button" className={styles.secondary} autoFocus onClick={onCancel}>Cancel</button><button type="button" className={styles.primary} onClick={onConfirm}>{confirmLabel}</button></div>
  </dialog>;
}
