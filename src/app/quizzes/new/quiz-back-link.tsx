"use client";
import Link from "next/link";
import styles from "../../dashboard/dashboard.module.css";

export default function QuizBackLink({ importQuiz = false }: { importQuiz?: boolean }) {
  return <Link className={importQuiz ? styles.importLink : "back-navigation"} href={importQuiz ? "/quizzes/import" : "/quizzes"} onClick={event => { const input = document.querySelector<HTMLInputElement>('input[name="title"]'); if (input?.value.trim() && !window.confirm("Your quiz title has not been saved. Leave without creating the draft?")) event.preventDefault(); }}>{importQuiz ? <>Import a quiz <span aria-hidden="true">↗</span></> : "Back to quizzes & keys"}</Link>;
}
