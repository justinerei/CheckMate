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
  return <form action={action} className={styles.form}><label htmlFor="quiz">Quiz</label><select id="quiz" name="quizId" defaultValue={quizzes.some(q => q.id === selectedQuizId) ? selectedQuizId : ""} required><option value="" disabled>Select a quiz</option>{quizzes.map(quiz => <option key={quiz.id} value={quiz.id}>{quiz.label}</option>)}</select><label htmlFor="expected">Number of pages</label><input id="expected" name="expectedPages" type="number" min="1" max="10" step="1" required defaultValue="1" /><p className={styles.help}>Count the printed pages for this quiz. You can upload each photo separately.</p>{state.error && <div className={styles.error} role="alert">{state.error} {state.existingId && <Link href={`/submissions/${state.existingId}`}>Open existing submission ↗</Link>}</div>}<button className={styles.primary} disabled={pending}>{pending ? "Creating…" : "Continue to photos"}</button></form>;
}
