"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./quiz-editor.module.css";

export default function SectionPointsDialog({ children, openOnError = false }: { children: ReactNode; openOnError?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (openOnError && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [openOnError]);
  return <>
    <button type="button" className={styles.pointsTrigger} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}><strong>Edit section points</strong><small>Set points for each section</small></button>
    <dialog ref={dialog} className={styles.pointsDialog} aria-labelledby="section-points-title">
      <div className={styles.pointsDialogHeader}><div><p className={styles.eyebrow}>QUIZ TOOLS</p><h2 id="section-points-title">Edit section points</h2></div><button type="button" className={styles.secondaryButton} onClick={() => dialog.current?.close()}>Close</button></div>
      <div className={styles.pointsDialogBody}>{children}</div>
    </dialog>
  </>;
}
