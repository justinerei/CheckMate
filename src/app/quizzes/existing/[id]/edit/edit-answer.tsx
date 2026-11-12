"use client";
import { useActionState } from "react";
import { updateKeyAnswer } from "./actions";
import styles from "../../../../submissions/submissions.module.css";
export default function EditAnswer({ quizId, questionId, value, number }: { quizId: string; questionId: string; value: string; number: number }) {
  const [state, action, pending] = useActionState(updateKeyAnswer.bind(null, quizId, questionId), { message: "", ok: false });
  return <form action={action} className={styles.editKeyRow} onSubmit={event => { const answer = new FormData(event.currentTarget).get("answers"); if (typeof answer === "string" && answer.trim() !== value.trim() && !window.confirm("Save this corrected answer? Scores for previously finalized papers may be recalculated.")) event.preventDefault(); }}><label>Question {number}<input name="answers" defaultValue={value} required maxLength={500} aria-label={`Correct answer for question ${number}`} /></label><button className={styles.secondary} disabled={pending}>{pending ? "Saving…" : "Save answer"}</button>{state.message && <p role="status" className={state.ok ? styles.success : styles.error}>{state.message}</p>}</form>;
}
