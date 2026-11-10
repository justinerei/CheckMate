"use client";
import { useActionState } from "react";
import Link from "next/link";
import { createSubmission, type CreateState } from "../actions";
import styles from "../submissions.module.css";

type Option = { id: string; label: string };
const initial: CreateState = { error: "" };
export default function CreateForm({ quizzes, students }: { quizzes: Option[]; students: Option[] }) {
  const [state, action, pending] = useActionState(createSubmission, initial);
  if (!quizzes.length || !students.length) return <div className={styles.empty}><p>Before uploading, add a quiz and a student to your list.</p><div className={styles.links}>{!quizzes.length && <Link href="/quizzes/new">Create a quiz ↗</Link>}{!students.length && <Link href="/students">Add a student ↗</Link>}</div></div>;
  return <form action={action} className={styles.form}><label htmlFor="quiz">Quiz</label><select id="quiz" name="quizId" defaultValue="" required><option value="" disabled>Select a quiz</option>{quizzes.map(quiz => <option key={quiz.id} value={quiz.id}>{quiz.label}</option>)}</select><label htmlFor="student">Student</label><select id="student" name="studentId" defaultValue="" required><option value="" disabled>Select a student</option>{students.map(student => <option key={student.id} value={student.id}>{student.label}</option>)}</select><label htmlFor="expected">Number of pages</label><input id="expected" name="expectedPages" type="number" min="1" max="10" step="1" required defaultValue="1" /><p className={styles.help}>Count the printed pages for this quiz. You can upload each photo separately.</p>{state.error && <div className={styles.error} role="alert">{state.error} {state.existingId && <Link href={`/submissions/${state.existingId}`}>Open existing submission ↗</Link>}</div>}<button className={styles.primary} disabled={pending}>{pending ? "Creating…" : "Continue to photos"}</button></form>;
}
