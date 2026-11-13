"use client";
import Link from "next/link";
import styles from "../../submissions.module.css";
export default function ReviewBackLink({ id, finalized, button = false }: { id: string; finalized: boolean; button?: boolean }) {
  return <Link href={finalized ? "/submissions" : `/submissions/${encodeURIComponent(id)}`} className={button ? styles.secondary : styles.back} onClick={event => { if (!finalized && !window.confirm("Go back to paper photos? Any answer or name changes you have not confirmed will be lost.")) event.preventDefault(); }}>{finalized ? "← Back to student papers" : "← Back to paper photos"}</Link>;
}

export function ReviewQuizLink({ quizId, finalized }: { quizId: string; finalized: boolean }) {
  return <Link href={`/quizzes/${encodeURIComponent(quizId)}/overview`} className={styles.back} onClick={event => { if (!finalized && !window.confirm("Return to the quiz? Any answer or name changes you have not confirmed will be lost.")) event.preventDefault(); }}>← Back to quiz</Link>;
}
