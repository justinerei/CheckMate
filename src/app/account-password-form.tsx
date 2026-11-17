"use client";

import { useActionState, useState } from "react";
import { changeAdminPassword } from "./account-profile-actions";
import styles from "./account-profile.module.css";

export default function AccountPasswordForm() {
  const [open, setOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [state, save, pending] = useActionState(async (_state: { ok: boolean; message: string }, form: FormData) => {
    const result = await changeAdminPassword(form);
    setShowMessage(true);
    if (result.ok) setOpen(false);
    return result;
  }, { ok: false, message: "" });

  return <div className={styles.editor}>
    {open ? <form action={save} className={styles.editForm}>
      <label htmlFor="current-password">Current password</label>
      <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required readOnly={pending} />
      <label htmlFor="new-password">New password</label>
      <input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required readOnly={pending} />
      <label htmlFor="confirm-password">Confirm new password</label>
      <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required readOnly={pending} />
      <div className={styles.editActions}>
        <button type="submit" className={styles.editPrimary} disabled={pending}>{pending ? "Saving…" : "Save password"}</button>
        <button type="button" className={styles.editButton} disabled={pending} onClick={() => {
          setOpen(false);
          setShowMessage(false);
        }}>Cancel</button>
      </div>
    </form> : <button type="button" className={styles.editButton} onClick={() => {
      setShowMessage(false);
      setOpen(true);
    }}>Change password</button>}
    {showMessage && <p className={styles.editMessage} role={state.ok ? "status" : "alert"}>{state.message}</p>}
  </div>;
}
