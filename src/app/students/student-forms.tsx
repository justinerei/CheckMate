"use client";

import { useActionState, useState } from "react";
import { createStudent, linkStudent, type ActionState } from "./actions";
import styles from "./students.module.css";

const initial: ActionState = { kind: "idle", message: "" };

export function CreateStudentForm() {
  const [name, setName] = useState("");
  const [state, action, pending] = useActionState(async (previous: ActionState, form: FormData) => { const result = await createStudent(previous, form); if (result.kind === "success") setName(""); return result; }, initial);
  return <form action={action} className={styles.form}><label htmlFor="student-name">Student name</label><input id="student-name" name="name" value={name} onChange={event => setName(event.target.value)} required maxLength={120} autoComplete="off" placeholder="e.g. Alex Santos" /><p className={styles.help}>A unique sharing code will be created with the student record.</p>{state.message && <p className={state.kind === "error" ? styles.error : styles.success} role={state.kind === "error" ? "alert" : "status"}>{state.message}</p>}<button className={styles.primary} disabled={pending}>{pending ? "Adding…" : "Add student"}</button></form>;
}

export function LinkStudentForm() {
  const [code, setCode] = useState("");
  const [state, action, pending] = useActionState(async (previous: ActionState, form: FormData) => { const result = await linkStudent(previous, form); if (result.kind === "success") setCode(""); return result; }, initial);
  return <form action={action} className={styles.form}><label htmlFor="student-code">CheckMate student code</label><input id="student-code" name="code" value={code} onChange={event => setCode(event.target.value)} required autoComplete="off" maxLength={38} spellCheck={false} placeholder="CM-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX" /><p className={styles.help}>Ask a teacher who already has this student for their code.</p>{state.message && <p className={state.kind === "error" ? styles.error : styles.success} role={state.kind === "error" ? "alert" : "status"}>{state.message}</p>}<button className={styles.primary} disabled={pending}>{pending ? "Linking…" : "Link student"}</button></form>;
}
