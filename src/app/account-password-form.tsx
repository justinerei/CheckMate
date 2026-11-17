"use client";

import { useActionState } from "react";
import { changeAdminPassword } from "./account-profile-actions";
import styles from "./account-profile.module.css";

export default function AccountPasswordForm({ onClose }: { onClose: (message?: string) => void }) {
  const [state, save, pending] = useActionState(async (_state: { ok: boolean; message: string }, form: FormData) => {
    const result = await changeAdminPassword(form);
    if (result.ok) onClose(result.message);
    return result;
  }, { ok: false, message: "" });

  return <form action={save} className={styles.editForm}>
    <label htmlFor="current-password">Current password</label>
    <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required readOnly={pending} autoFocus />
    <label htmlFor="new-password">New password</label>
    <input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required readOnly={pending} />
    <label htmlFor="confirm-password">Confirm new password</label>
    <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required readOnly={pending} />
    <div className={styles.editActions}>
      <button type="submit" className={styles.editPrimary} disabled={pending}>{pending ? "Saving…" : "Save password"}</button>
      <button type="button" className={styles.editButton} disabled={pending} onClick={() => onClose()}>Cancel</button>
    </div>
    {!state.ok && state.message && <p className={styles.editMessage} role="alert">{state.message}</p>}
  </form>;
}
