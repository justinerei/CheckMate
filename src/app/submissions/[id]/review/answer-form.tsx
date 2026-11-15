"use client";
import { PendingScreen } from "@/app/pending-screen";
import { useActionState } from "react";
import { saveAnswer } from "./actions";
import styles from "../../submissions.module.css";

export default function AnswerForm({ submissionId, questionId, value, comment, multipleChoice, shape }: { submissionId: string; questionId: string; value: string | null; comment: string | null; multipleChoice: boolean; shape: string | null }) {
  const [state, action, pending] = useActionState(saveAnswer.bind(null, submissionId, questionId), { message: "", ok: false });
  return <form action={action} className={styles.answerForm} data-save-confirmed={state.ok && !pending ? "true" : undefined}><PendingScreen pending={pending} message="Saving your review…" /><label htmlFor={`answer-${questionId}`}>Student answer</label><textarea id={`answer-${questionId}`} name="answer" defaultValue={value ?? ""} maxLength={4000} rows={3} /><label className={styles.check}><input type="checkbox" name="blank" defaultChecked={value === ""} /> Mark as blank</label>{multipleChoice && <><label htmlFor={`shape-${questionId}`}>Mark shape (for non-blank answers)</label><select id={`shape-${questionId}`} name="markShape" defaultValue={shape ?? ""}><option value="">Select shape</option><option value="circle">Circle</option><option value="box">Box — incorrect</option><option value="triangle">Triangle — incorrect</option></select></>}<label htmlFor={`comment-${questionId}`}>Comment (optional)</label><textarea id={`comment-${questionId}`} name="comment" defaultValue={comment ?? ""} maxLength={4000} rows={2} /><button className={styles.secondary} disabled={pending} aria-busy={pending}>{pending ? "Saving…" : value === null ? "Confirm answer" : "Update answer"}</button>{state.message && <p className={state.ok ? styles.success : styles.error} role="status">{state.message}</p>}</form>;
}
