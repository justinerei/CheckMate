"use client";
import Link from "next/link";
export default function QuizBackLink() {
  return <Link className="back-navigation" href="/quizzes" onClick={event => { const input = document.querySelector<HTMLInputElement>('input[name="title"]'); if (input?.value.trim() && !window.confirm("Your quiz title has not been saved. Leave without creating the draft?")) event.preventDefault(); }}>Back to quizzes &amp; keys</Link>;
}
