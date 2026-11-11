"use client";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { saveExistingAnswer, finalizeExisting, confirmClearAnswers } from "./existing-actions";
import styles from "../../submissions.module.css";
export function ExistingAnswerForm({ submissionId, questionId, value, comment, essay, score, points, decision }: { submissionId: string; questionId: string; value: string | null; comment: string | null; essay: boolean; score: string | null; points: string; decision: string | null }) {
  const [state, action, pending] = useActionState(saveExistingAnswer.bind(null, submissionId, questionId), { message: "", ok: false });
  const [blank, setBlank] = useState(value === "");
  return <form action={action} className={styles.answerForm}><label>Student answer<textarea name="answer" defaultValue={value ?? ""} maxLength={4000} rows={3} disabled={blank} /></label><input type="hidden" name="answer" value={blank ? "" : undefined} disabled={!blank} /><label className={styles.check}><input type="checkbox" name="blank" checked={blank} onChange={e => setBlank(e.target.checked)} /> Mark as blank</label>{essay && <label>Teacher score (out of {points})<input className={styles.keyInput} type="number" name="score" min="0" max={points} step="0.01" defaultValue={score ?? ""} required /></label>}<fieldset className={styles.instructionChoice}><legend>Did the student follow the answer instructions?</legend><p>Check the original paper. A confirmed violation receives zero points.</p><label><input type="radio" name="instruction" value="FOLLOWED" defaultChecked={decision === "FOLLOWED"} required /> Followed instructions</label><label><input type="radio" name="instruction" value="VIOLATION" defaultChecked={decision === "VIOLATION"} required /> Did not follow instructions — zero points</label></fieldset><label>Comment (optional)<textarea name="comment" defaultValue={comment ?? ""} maxLength={4000} rows={2} /></label><button className={styles.secondary} disabled={pending}>{pending ? "Saving…" : "Confirm answer"}</button>{state.message && <p className={state.ok ? styles.success : styles.error} role="status">{state.message}</p>}</form>;
}
export function FinalizeButton({ id }: { id: string }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function finalize() { setBusy(true); const result = await finalizeExisting(id); setError(result.error); setBusy(false); if (!result.error) router.refresh(); }
  return <div><button type="button" className={styles.primary} disabled={busy} onClick={finalize}>{busy ? "Finalizing…" : "Finalize score"}</button>{error && <p className={styles.error} role="alert">{error}</p>}</div>;
}

export function ConfirmClearAnswers({ id, items }: { id: string; items: { id: string; number: number; answer: string }[] }) {
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  if (!items.length) return null;
  async function confirm() {
    setBusy(true); setMessage("");
    try {
      const result = await confirmClearAnswers(id, items.map(({ id, answer }) => ({ id, answer })));
      setMessage(result.error || `${result.count} answers confirmed. Check any remaining items individually.`);
      if (!result.error) { setChecked(false); router.refresh(); }
    } catch { setMessage("Could not save these answers. Please try again."); }
    finally { setBusy(false); }
  }
  return <details className={styles.bulkReview}><summary>Review {items.length} clear {items.length === 1 ? "answer" : "answers"} together</summary><p>Compare these suggestions and answer styles with the original paper. Only confirm if every answer below is correct and followed the instructions. AI can be wrong.</p><div className={styles.bulkAnswers}>{items.map(item => <span key={item.id}><strong>{item.number}.</strong> {item.answer}</span>)}</div><label className={styles.check}><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} disabled={busy} /> I checked all answers above against the paper, and each followed the instructions.</label><button type="button" className={styles.secondary} disabled={!checked || busy} onClick={confirm}>{busy ? "Saving…" : "Confirm these answers"}</button>{message && <p role="status">{message}</p>}</details>;
}
