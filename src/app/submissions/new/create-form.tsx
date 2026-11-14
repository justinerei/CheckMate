"use client";
import { useActionState } from "react";
import Link from "next/link";
import { createSubmission, type CreateState } from "../actions";
import styles from "../submissions.module.css";

type Option = { id: string; label: string };
const initial: CreateState = { error: "" };
export default function CreateForm({ quizzes, selectedQuizId }: { quizzes: Option[]; selectedQuizId?: string }) {
  const [state, action, pending] = useActionState(createSubmission, initial);
  if (!quizzes.length) return <div className={styles.empty}><p>Create a quiz or answer key first.</p><div className={styles.links}><Link href="/quizzes/new">Create a quiz ↗</Link><Link href="/quizzes/existing">Use an existing quiz ↗</Link></div></div>;
  return <form action={action} className={styles.form}><label htmlFor="quiz">Saved answer key or quiz</label><select id="quiz" name="quizId" defaultValue={quizzes.some(q => q.id === selectedQuizId) ? selectedQuizId : ""} required><option value="" disabled>Select an answer key</option>{quizzes.map(quiz => <option key={quiz.id} value={quiz.id}>{quiz.label}</option>)}</select><label htmlFor="expected">Pages in the first paper</label><input id="expected" name="expectedPages" type="number" min="1" max="3" step="1" required defaultValue="1" /><p className={styles.help}>Each paper can have up to three pages. Add up to five papers to the batch.</p>{state.error && <div className={styles.error} role="alert">{state.error}</div>}<button className={styles.primary} disabled={pending} aria-busy={pending}>{pending ? "Creating…" : "Continue to photos"}</button></form>;
}
