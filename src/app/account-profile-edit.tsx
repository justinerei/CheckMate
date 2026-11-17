"use client";

import { useActionState, useState } from "react";
import { updateProfileName } from "./account-profile-actions";
import styles from "./account-profile.module.css";

export default function AccountProfileEdit({ name }: { name: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [showMessage, setShowMessage] = useState(false);
  const [state, save, pending] = useActionState(async (_state: { ok: boolean; message: string }, form: FormData) => {
    const result = await updateProfileName(form);
    setShowMessage(true);
    if (result.ok) setEditing(false);
    return result;
  }, { ok: false, message: "" });

  return <div className={styles.editor}>
    {editing ? (
      <form action={save} className={styles.editForm}>
        <label htmlFor="profile-name">Account name</label>
        <input id="profile-name" name="name" value={draft} onChange={event => setDraft(event.target.value)}
          autoComplete="name" maxLength={120} required readOnly={pending} />
        <div className={styles.editActions}>
          <button type="submit" className={styles.editPrimary} disabled={pending || draft.trim() === name}>
            {pending ? "Saving…" : "Save changes"}
          </button>
          <button type="button" className={styles.editButton} disabled={pending} onClick={() => {
            setEditing(false);
            setShowMessage(false);
          }}>Cancel</button>
        </div>
      </form>
    ) : (
      <button type="button" className={styles.editButton} onClick={() => {
        setDraft(name);
        setShowMessage(false);
        setEditing(true);
      }}>Edit profile</button>
    )}
    {showMessage && <p className={styles.editMessage} role={state.ok ? "status" : "alert"}>{state.message}</p>}
  </div>;
}
