"use client";
import { PendingScreen } from "@/app/pending-screen";

import { useActionState, useState } from "react";
import { login, register } from "./auth-actions";
import styles from "./page.module.css";

export default function PasswordForm() {
  const [creating, setCreating] = useState(false);
  const [loginState, loginAction, loginPending] = useActionState(login, { error: "" });
  const [registerState, registerAction, registerPending] = useActionState(register, { error: "" });
  const error = creating ? registerState.error : loginState.error;
  return <>
    <form className={styles.authForm} action={creating ? registerAction : loginAction}><PendingScreen pending={loginPending || registerPending} message={creating ? "Creating your account…" : "Signing in…"} />
      {creating && <label>Name<input name="name" autoComplete="name" maxLength={120} required /></label>}
      <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>Password<input name="password" type="password" autoComplete={creating ? "new-password" : "current-password"} minLength={creating ? 12 : undefined} maxLength={128} required /></label>
      {creating && <><label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label><p className={styles.passwordHint}>Use at least 12 characters.</p></>}
      {error && <p className={styles.warning} role="alert">{error}</p>}
      <button className={styles.authSubmit} type="submit" disabled={loginPending || registerPending}>{loginPending || registerPending ? "Please wait…" : creating ? "Create account" : "Sign in"}</button>
    </form>
    <p className={styles.authToggle}>{creating ? "Already have an account? " : "New to CheckMate? "}<button type="button" onClick={() => setCreating(!creating)}>{creating ? "Sign in" : "Create account"}</button></p>
  </>;
}
