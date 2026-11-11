"use client";
import { useActionState, useState } from "react";
import { confirmPaperName } from "./name-actions";
import styles from "../../submissions.module.css";
export default function NameForm({ id, value, suggestion, reviewed }: { id: string; value: string | null; suggestion: string | null; reviewed: boolean }) {
  const [state, action, pending] = useActionState(confirmPaperName.bind(null, id), { message: "", ok: false });
  const [unnamed, setUnnamed] = useState(reviewed && !value);
  return <section className={styles.confirm}><h2>Check the name</h2><p>AI suggestion: {suggestion || "No readable name detected"}. Check the photo and correct it if needed.</p><form action={action} className={styles.answerForm}><label>Student name<input className={styles.keyInput} name="name" defaultValue={value ?? suggestion ?? ""} disabled={unnamed} maxLength={120} /></label>{unnamed && <input type="hidden" name="name" value="" />}<label className={styles.check}><input type="checkbox" name="unnamed" checked={unnamed} onChange={e => setUnnamed(e.target.checked)} /> No readable name on this paper</label><button className={styles.secondary} disabled={pending}>{pending ? "Saving…" : "Confirm name"}</button>{reviewed && <p>Previously confirmed: {value || "No readable name"}</p>}{state.message && <p className={state.ok ? styles.success : styles.error} role="status">{state.message}</p>}</form></section>;
}
