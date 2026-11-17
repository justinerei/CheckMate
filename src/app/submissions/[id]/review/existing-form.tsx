"use client";
import { PendingScreen } from "@/app/pending-screen";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Mascot from "@/app/mascot";
import NextPaperButton from "../next-paper-button";
import ConfirmDialog from "../../confirm-dialog";
import { useRouter } from "next/navigation";
import { useReviewDraftGuard } from "../../review-draft-context";
import { saveExistingAnswer, finalizeExisting, confirmClearAnswers, reopenFinalizedPaper } from "./existing-actions";
import styles from "../../submissions.module.css";
type Criterion = { id: string; title: string; description: string; maxPoints: string; score: string; feedback: string };
export function ExistingAnswerForm({ formatConcern, advance, submissionId, questionId, value, comment, essay, score, points, decision, criteria }: { formatConcern: boolean; advance: boolean; submissionId: string; questionId: string; value: string | null; comment: string | null; essay: boolean; score: string | null; points: string; decision: string | null; criteria: Criterion[] }) {
  const [state, action, pending] = useActionState(saveExistingAnswer.bind(null, submissionId, questionId), { message: "", ok: false });
  const guard = useReviewDraftGuard();
  const saveResult = guard?.saveResult;
  useEffect(() => { if (state.message && !pending) saveResult?.(questionId, state.ok); }, [state, pending, questionId, saveResult]);
  const [blank, setBlank] = useState(value === ""); const [answer, setAnswer] = useState(value ?? "");
  const [ratings, setRatings] = useState(criteria); const [suggesting, setSuggesting] = useState(false); const [suggestionMessage, setSuggestionMessage] = useState("");
  const [openFeedback, setOpenFeedback] = useState<string[]>(() => criteria.filter(item => item.feedback.trim()).map(item => item.id));
  const [flagging, setFlagging] = useState(false);
  const reviewFormat = formatConcern || flagging || decision === "VIOLATION";
  const update = (id: string, patch: Partial<Criterion>) => setRatings(old => old.map(item => item.id === id ? { ...item, ...patch } : item));
  async function suggest() {
    if (ratings.some(item => item.score || item.feedback) && !window.confirm("Replace the current criterion scores and feedback with AI suggestions?")) return;
    setSuggesting(true); setSuggestionMessage("");
    try { const response = await fetch(`/api/submissions/${submissionId}/essay-suggestion`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId, answer }) }); const result = await response.json(); if (!response.ok) { setSuggestionMessage(result.error); return; } setRatings(old => old.map(item => { const found = result.assessments.find((a: { id: string }) => a.id === item.id); return found ? { ...item, score: String(found.score), feedback: found.feedback } : item; })); guard?.markDirty(questionId); setOpenFeedback(result.assessments.filter((item: { feedback?: string }) => item.feedback?.trim()).map((item: { id: string }) => item.id)); setSuggestionMessage("Review the suggested scores and feedback before confirming."); }
    catch { setSuggestionMessage("Could not suggest scores. Please retry or score manually."); } finally { setSuggesting(false); }
  }
  return <form action={action} className={styles.answerForm} data-review-question={questionId} data-save-confirmed={state.ok && !pending ? "true" : undefined}><PendingScreen pending={pending || suggesting} message={suggesting ? "Suggesting scores…" : "Saving your review…"} /><details data-accordion open={!value || essay || undefined}><summary>Edit student answer</summary><label>Student answer<textarea name="answer" value={answer} onChange={e => setAnswer(e.target.value)} maxLength={4000} rows={3} disabled={blank} /></label><input type="hidden" name="answer" value="" disabled={!blank} /><label className={styles.check}><input type="checkbox" name="blank" checked={blank} onChange={e => setBlank(e.target.checked)} /> Mark as blank</label></details>{essay && ratings.length > 0 && <section className={styles.compactRubric} aria-labelledby={`rubric-${questionId}`}>
    <div className={styles.rubricHeader}><div><h3 id={`rubric-${questionId}`}>Score this essay</h3><p>Give each criterion a score, then confirm.</p></div><span>{ratings.every(item => item.score.trim() !== "") ? Math.round(ratings.reduce((sum, item) => sum + (Number(item.score) || 0), 0) * 100) / 100 : "—"} / {points} points</span></div>
    <div className={styles.rubricAi}><button type="button" className={styles.secondary} disabled={suggesting || blank || !answer.trim()} onClick={suggest}>{suggesting ? "Suggesting…" : "Suggest scores with AI"}</button><small>Sends the answer and rubric to Gemini, or Groq if Gemini fails.</small></div>
    {suggestionMessage && <p className={styles.rubricMessage} role="status">{suggestionMessage}</p>}
    <div className={styles.criteriaList}>{ratings.map(item => <div key={item.id} className={styles.compactCriterion}>
      <div className={styles.criterionHead}><div><strong>{item.title}</strong><p>{item.description}</p></div><label>Score <span className={styles.scoreField}><input className={styles.keyInput} aria-label={`Score for ${item.title} (out of ${item.maxPoints})`} type="number" name={`criterion-${item.id}`} min="0" max={item.maxPoints} step="0.01" value={item.score} onChange={e => update(item.id, { score: e.target.value })} required /><span>/ {item.maxPoints}</span></span></label></div>
      <details data-accordion className={styles.criterionFeedback} open={openFeedback.includes(item.id)} onToggle={e => { const open = e.currentTarget.open; setOpenFeedback(old => open ? old.includes(item.id) ? old : [...old, item.id] : old.filter(id => id !== item.id)); }}><summary>{item.feedback.trim() ? "View feedback" : "Add feedback (optional)"}</summary><label>Feedback for {item.title}<textarea name={`feedback-${item.id}`} value={item.feedback} maxLength={4000} rows={2} onChange={e => update(item.id, { feedback: e.target.value })} /></label></details>
    </div>)}</div>
  </section>}{essay && ratings.length === 0 && <label>Teacher score (out of {points})<input className={styles.keyInput} type="number" name="score" min="0" max={points} step="0.01" defaultValue={score ?? ""} required /></label>}{reviewFormat ? (
    <fieldset className={styles.instructionChoice}>
      <legend>Check the instructions</legend>
      <label><input type="radio" name="instruction" value="FOLLOWED" defaultChecked={decision === "FOLLOWED"} required /> Accept this answer and grade it</label>
      <label><input type="radio" name="instruction" value="VIOLATION" defaultChecked={decision === "VIOLATION"} required /> Confirm instruction violation (0 points)</label>
      {flagging && !formatConcern && decision !== "VIOLATION" && <button type="button" className={styles.formatToggle} onClick={() => setFlagging(false)}>Cancel flag</button>}
    </fieldset>
  ) : (
    <>
      <input type="hidden" name="instruction" value="FOLLOWED" />
      <button type="button" className={styles.formatToggle} onClick={() => { setFlagging(true); guard?.markDirty(questionId); }}>Flag an instruction issue</button>
    </>
  )}<details data-accordion open={comment ? true : undefined}><summary>Teacher comment</summary><label>Comment (optional)<textarea name="comment" defaultValue={comment ?? ""} maxLength={4000} rows={2} /></label></details><button className={styles.primary} disabled={pending} aria-busy={pending}>{pending ? "Saving…" : advance ? "Confirm & continue" : "Confirm answer"}</button>{state.message && <p className={state.ok ? styles.success : styles.error} role="status">{state.message}</p>}</form>;
}
export function FinalizeButton({ batchId, id, name, quizTitle, maximum, ready, finalized, finalScore }: { batchId: string | null; id: string; name: string; quizTitle: string; maximum: number; ready: boolean; finalized: boolean; finalScore: string | null }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter(); const dialog = useRef<HTMLDialogElement>(null);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const marker = `checkmate-finalized-${id}`;
  useEffect(() => { if (!finalized) return; try { if (sessionStorage.getItem(marker) && dialog.current && !dialog.current.open) dialog.current.showModal(); } catch {} }, [finalized, marker]);
  function dismiss() { try { sessionStorage.removeItem(marker); } catch {} }
  async function finalize() { setConfirmFinalize(false); setBusy(true); setError(""); try { try { sessionStorage.setItem(marker, "pending"); } catch {} const result = await finalizeExisting(id); if (result.error || result.total === undefined) { dismiss(); setError(result.error || "Could not finalize the paper."); return; } router.refresh(); } catch { setError("Could not confirm the result. Refresh to check whether it was saved."); } finally { setBusy(false); } }
  return <div><PendingScreen pending={busy} message="Finalizing the score…" />{!finalized && <button type="button" className={styles.primary} disabled={busy || !ready} onClick={() => setConfirmFinalize(true)}>{busy ? "Finalizing…" : "Finalize score"}</button>}{error && <p className={styles.error} role="alert">{error}</p>}{confirmFinalize && <ConfirmDialog title="Finalize this score?" message="Review the answers before continuing. You can reopen the result later if a correction is needed." confirmLabel="Finalize score" onCancel={() => setConfirmFinalize(false)} onConfirm={finalize} />}<dialog ref={dialog} className={styles.successDialog} aria-labelledby="success-title" onClose={dismiss}><Mascot state="celebrate" width={104} height={104} className={styles.successMate} /><h2 id="success-title">Paper checked!</h2><p>{name} · {quizTitle}</p><p className={styles.finalScore}>{finalScore ?? "—"} / {maximum}</p><div className={styles.dialogActions}>{batchId ? <Link className={styles.primary} href={`/batches/${batchId}`} onClick={dismiss}>Back to batch</Link> : <NextPaperButton id={id} onStart={dismiss} />}<button type="button" className={styles.secondary} onClick={() => dialog.current?.close()}>View result</button></div></dialog></div>;
}

export function ReopenPaper({ id }: { id: string }) {
  const [state, action, pending] = useActionState(reopenFinalizedPaper.bind(null, id), { message: "", ok: false });
  return <details data-accordion className={styles.reopenPaper}><summary>Reopen for correction</summary><p>This moves the paper back to review. The current result remains in its history until you finalize the revised score.</p><form action={action}><PendingScreen pending={pending} message="Reopening the paper…" /><label>Reason for reopening<textarea name="reason" maxLength={500} rows={2} required placeholder="For example: correct a misread answer" /></label><button type="submit" className={styles.secondary} disabled={pending}>{pending ? "Reopening…" : "Reopen paper"}</button>{state.message && <p role="status" className={state.ok ? styles.success : styles.error}>{state.message}</p>}</form></details>;
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
  return <details data-accordion className={styles.bulkReview}><PendingScreen pending={busy} message="Confirming answers…" /><summary>Review {items.length} clear {items.length === 1 ? "answer" : "answers"} together</summary><p>Compare these suggestions and answer styles with the original paper. Only confirm if every answer below is correct and followed the instructions. AI can be wrong.</p><div className={styles.bulkAnswers}>{items.map(item => <span key={item.id}><strong>{item.number}.</strong> {item.answer}</span>)}</div><label className={styles.check}><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} disabled={busy} /> I checked all answers above against the paper, and each followed the instructions.</label><button type="button" className={styles.secondary} disabled={!checked || busy} onClick={confirm}>{busy ? "Saving…" : "Confirm these answers"}</button>{message && <p role="status">{message}</p>}</details>;
}
