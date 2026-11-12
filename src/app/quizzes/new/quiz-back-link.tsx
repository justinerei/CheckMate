"use client";
import Link from "next/link";
import styles from "../../dashboard/dashboard.module.css";
export default function QuizBackLink() {
  return <Link className={styles.back} href="/quizzes" onClick={event => { const input = document.querySelector<HTMLInputElement>('input[name="title"]'); if (input?.value.trim() && !window.confirm("Your quiz title has not been saved. Leave without creating the draft?")) event.preventDefault(); }}>← Back to quizzes &amp; keys</Link>;
}
