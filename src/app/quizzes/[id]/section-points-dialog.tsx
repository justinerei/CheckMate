"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./quiz-editor.module.css";

export default function SectionPointsDialog({ children, openOnError = false }: { children: ReactNode; openOnError?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (openOnError && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [openOnError]);
  useEffect(() => {
    const closeForRubric = () => { if (window.location.hash.startsWith("#rubric-")) dialog.current?.close(); };
    window.addEventListener("hashchange", closeForRubric);
    return () => window.removeEventListener("hashchange", closeForRubric);
  }, []);
  return <>
    <button type="button" className={styles.pointsTrigger} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}><strong>Edit section points</strong><small>Set points for each section</small></button>
    <dialog ref={dialog} className={styles.pointsDialog} aria-labelledby="section-points-title" onClickCapture={event => { if (event.target instanceof Element && event.target.closest("a[data-close-points-dialog]")) dialog.current?.close(); }}>
      <div className={styles.pointsDialogHeader}><div><h2 id="section-points-title">Edit section points</h2></div><button type="button" className={styles.secondaryButton} onClick={() => dialog.current?.close()}>Close</button></div>
      <div className={styles.pointsDialogBody}>{children}</div>
    </dialog>
  </>;
}
