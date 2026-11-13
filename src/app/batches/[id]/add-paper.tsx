"use client";
import { useActionState } from "react";
import { addBatchPaper } from "../../submissions/actions";
import styles from "./batch.module.css";

export default function AddPaper({ id }: { id: string }) {
  const [state, action, pending] = useActionState(addBatchPaper.bind(null, id), { error: "" });
  return <details className={styles.addPaper}>
    <summary><span aria-hidden="true">+</span> Add another paper</summary>
    <form action={action} className={styles.addForm}>
      <label htmlFor="batch-pages">How many pages are in this paper?</label>
      <div className={styles.addControls}><select id="batch-pages" name="expectedPages" defaultValue="1"><option value="1">1 page</option><option value="2">2 pages</option><option value="3">3 pages</option></select><button disabled={pending}>{pending ? "Adding…" : "Continue to photos"}</button></div>
      {state.error && <p className={styles.error} role="alert">{state.error}</p>}
    </form>
  </details>;
}
