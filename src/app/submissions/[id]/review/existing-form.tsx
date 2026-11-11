"use client";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { saveExistingAnswer, finalizeExisting } from "./existing-actions";
import styles from "../../submissions.module.css";
export function ExistingAnswerForm({ submissionId, questionId, value, comment, essay, score, points }: { submissionId: string; questionId: string; value: string | null; comment: string | null; essay: boolean; score: string | null; points: string }) {
  const [state, action, pending] = useActionState(saveExistingAnswer.bind(null, submissionId, questionId), { message: "", ok: false });
  const [blank, setBlank] = useState(value === "");
  return <form action={action} className={styles.answerForm}><label>Student answer<textarea name="answer" defaultValue={value ?? ""} maxLength={4000} rows={3} disabled={blank} /></label><input type="hidden" name="answer" value={blank ? "" : undefined} disabled={!blank} /><label className={styles.check}><input type="checkbox" name="blank" checked={blank} onChange={e => setBlank(e.target.checked)} /> Mark as blank</label>{essay && <label>Teacher score (out of {points})<input className={styles.keyInput} type="number" name="score" min="0" max={points} step="0.01" defaultValue={score ?? ""} required /></label>}<label>Comment (optional)<textarea name="comment" defaultValue={comment ?? ""} maxLength={4000} rows={2} /></label><button className={styles.secondary} disabled={pending}>{pending ? "Saving…" : "Confirm answer"}</button>{state.message && <p className={state.ok ? styles.success : styles.error} role="status">{state.message}</p>}</form>;
}
export function FinalizeButton({ id }: { id: string }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function finalize() { setBusy(true); const result = await finalizeExisting(id); setError(result.error); setBusy(false); if (!result.error) router.refresh(); }
  return <div><button type="button" className={styles.primary} disabled={busy} onClick={finalize}>{busy ? "Finalizing…" : "Finalize score"}</button>{error && <p className={styles.error} role="alert">{error}</p>}</div>;
}
