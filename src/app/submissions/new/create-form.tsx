"use client";
import { PendingScreen } from "@/app/pending-screen";
import { useActionState } from "react";
import Link from "next/link";
import { createSubmission, type CreateState } from "../actions";
import styles from "../submissions.module.css";

type Option = { id: string; label: string };
const initial: CreateState = { error: "" };
export default function CreateForm({ quizzes, selectedQuizId }: { quizzes: Option[]; selectedQuizId?: string }) {
  const [state, action, pending] = useActionState(createSubmission, initial);
  if (!quizzes.length) return <div className={`${styles.form} ${styles.newKeyEmpty}`}><strong>No saved answer keys yet</strong><p>Upload an answer key or enter answers manually to get started.</p><Link className={styles.primary} href="/quizzes/existing?from=check">Upload answer key →</Link></div>;
  return <form action={action} className={styles.form}><PendingScreen pending={pending} message="Creating your batch…" /><label htmlFor="quiz">Saved answer key or quiz</label><select id="quiz" name="quizId" defaultValue={quizzes.some(q => q.id === selectedQuizId) ? selectedQuizId : ""} required><option value="" disabled>Select an answer key</option>{quizzes.map(quiz => <option key={quiz.id} value={quiz.id}>{quiz.label}</option>)}</select><div className={styles.newKeyLink}><span>Have a new answer key?</span><Link href="/quizzes/existing?from=check">Upload answer key →</Link></div><label htmlFor="expected">Pages in the first paper</label><input id="expected" name="expectedPages" type="number" min="1" max="3" step="1" required defaultValue="1" /><p className={styles.help}>Each paper can have up to three pages. Add up to five papers to the batch.</p>{state.error && <div className={styles.error} role="alert">{state.error}</div>}<button className={styles.primary} disabled={pending} aria-busy={pending}>{pending ? "Creating…" : "Start batch & upload photos"}</button></form>;
}
