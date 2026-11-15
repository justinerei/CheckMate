"use client";
import { PendingScreen } from "@/app/pending-screen";
import { useActionState } from "react";
import { createNextPaper } from "../actions";
import styles from "../submissions.module.css";

export default function NextPaperButton({ id, onStart }: { id: string; onStart?: () => void }) {
  const [state, action, pending] = useActionState(createNextPaper.bind(null, id), { error: "" });
  return <form action={action} onSubmit={onStart} className={styles.nextPaperForm}><PendingScreen pending={pending} message="Starting the next paper…" />
    <button type="submit" className={styles.primary} disabled={pending}>{pending ? "Starting…" : "Check another paper"}<span aria-hidden="true"> →</span></button>
    {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
  </form>;
}
