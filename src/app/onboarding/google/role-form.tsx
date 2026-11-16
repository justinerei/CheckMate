"use client";
import { useActionState } from "react";
import { completeGoogleAccount } from "./actions";
import styles from "@/app/page.module.css";

export default function RoleForm() {
  const [state, action, pending] = useActionState(completeGoogleAccount, { error: "" });
  return <form action={action} className={styles.roleForm}><fieldset><legend>Choose your account type</legend><label><input type="radio" name="role" value="TEACHER" required /> <span><strong>Teacher</strong><small>Create quizzes and check papers.</small></span></label><label><input type="radio" name="role" value="STUDENT" required /> <span><strong>Student</strong><small>Connect with your teacher and view results.</small></span></label></fieldset><button type="submit" className={styles.authSubmit} disabled={pending}>{pending ? "Creating account…" : "Create account"}</button>{state.error && <p className={styles.warning} role="alert">{state.error}</p>}</form>;
}
