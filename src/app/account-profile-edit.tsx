"use client";

import { useActionState, useState } from "react";
import { updateProfileName } from "./account-profile-actions";
import styles from "./account-profile.module.css";

export default function AccountProfileEdit({ name, onClose }: { name: string; onClose: (message?: string) => void }) {
  const [draft, setDraft] = useState(name);
  const [state, save, pending] = useActionState(async (_state: { ok: boolean; message: string }, form: FormData) => {
    const result = await updateProfileName(form);
    if (result.ok) onClose(result.message);
    return result;
  }, { ok: false, message: "" });

  return <form action={save} className={styles.editForm}>
    <label htmlFor="profile-name">New account name</label>
    <input id="profile-name" name="name" value={draft} onChange={event => setDraft(event.target.value)}
      autoComplete="name" maxLength={120} required readOnly={pending} autoFocus />
    <div className={styles.editActions}>
      <button type="submit" className={styles.editPrimary} disabled={pending || draft.trim() === name}>
        {pending ? "Saving…" : "Save changes"}
      </button>
      <button type="button" className={styles.editButton} disabled={pending} onClick={() => onClose()}>Cancel</button>
    </div>
    {!state.ok && state.message && <p className={styles.editMessage} role="alert">{state.message}</p>}
  </form>;
}
