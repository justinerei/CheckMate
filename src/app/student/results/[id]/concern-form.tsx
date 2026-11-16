"use client";
import { useActionState } from "react";
import { submitResultConcern } from "../../actions";
import styles from "../../student-workspace.module.css";

export default function ConcernForm({ id, questions }: { id: string; questions: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(submitResultConcern.bind(null, id), { message: "", ok: false });
  return <div className={styles.detailCard}><h2>Ask about a score</h2><p>Send your concern to the teacher who checked this paper. They can respond here.</p><form action={action}><label>Question<select name="questionId" required defaultValue=""><option value="" disabled>Select a question</option>{questions.map(question => <option key={question.id} value={question.id}>{question.label}</option>)}</select></label><label>Your concern<textarea name="message" maxLength={1000} rows={3} required placeholder="Explain what you would like your teacher to check." /></label><button disabled={pending}>{pending ? "Sending…" : "Send concern"}</button>{state.message && <p role="status">{state.message}</p>}</form></div>;
}
