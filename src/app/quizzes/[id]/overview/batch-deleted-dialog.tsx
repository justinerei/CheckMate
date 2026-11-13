"use client";
import { useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../submissions/submissions.module.css";

export default function BatchDeletedDialog({ quizId }: { quizId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const router = useRouter();
  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); }, []);
  const finish = () => router.replace(`/quizzes/${encodeURIComponent(quizId)}/overview`);
  return <dialog ref={dialog} className={styles.successDialog} aria-labelledby={titleId} onClose={finish}>
    <div className={styles.successMark} aria-hidden="true">✓</div>
    <h2 id={titleId}>Batch deleted</h2>
    <p>The batch and its papers were removed. Photo cleanup continues in the background.</p>
    <div className={styles.dialogActions}><button type="button" className={styles.primary} autoFocus onClick={() => dialog.current?.close()}>Back to quiz</button></div>
  </dialog>;
}
