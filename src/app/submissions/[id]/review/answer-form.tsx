"use client";
import { useActionState } from "react";
import { saveAnswer } from "./actions";
import styles from "../../submissions.module.css";

export default function AnswerForm({ submissionId, questionId, value }: { submissionId: string; questionId: string; value: string | null }) {
  const [state, action, pending] = useActionState(saveAnswer.bind(null, submissionId, questionId), { message: "", ok: false });
  return <form action={action} className={styles.answerForm}><label htmlFor={`answer-${questionId}`}>Student answer</label><textarea id={`answer-${questionId}`} name="answer" defaultValue={value ?? ""} maxLength={4000} rows={3} /><label className={styles.check}><input type="checkbox" name="blank" defaultChecked={value === ""} /> Mark as blank</label><button className={styles.secondary} disabled={pending}>{pending ? "Saving…" : value === null ? "Confirm answer" : "Update answer"}</button>{state.message && <p className={state.ok ? styles.success : styles.error} role="status">{state.message}</p>}</form>;
}
