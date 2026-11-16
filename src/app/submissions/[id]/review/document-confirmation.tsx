"use client";
import { useActionState } from "react";
import { confirmPaperPage } from "./document-actions";
import styles from "../../submissions.module.css";

export default function DocumentConfirmation({ submissionId, pageId, pageNumber }: { submissionId: string; pageId: string; pageNumber: number }) {
  const [state, action, pending] = useActionState(confirmPaperPage.bind(null, submissionId, pageId), { message: "", ok: false });
  return <form action={action} className={styles.documentConfirm}>
    <div><strong>Check page {pageNumber}</strong><p>The AI could not confidently identify this page as a student paper.</p><a href={`/api/submissions/${encodeURIComponent(submissionId)}/pages/${encodeURIComponent(pageId)}`} target="_blank" rel="noreferrer">View page {pageNumber} photo ↗</a></div>
    <label className={styles.check}><input type="checkbox" name="checked" required /> I checked the photo: this page belongs to this student and quiz.</label>
    <button type="submit" className={styles.secondary} disabled={pending}>{pending ? "Saving…" : "Confirm page"}</button>
    {state.message && <p className={state.ok ? styles.success : styles.error} role="status">{state.message}</p>}
  </form>;
}
