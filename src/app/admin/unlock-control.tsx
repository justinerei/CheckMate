"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/app/submissions/confirm-dialog";
import { unlockAccount } from "./actions";
import styles from "./admin.module.css";

export default function UnlockControl({ id, name }: { id: string; name: string }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function unlock() {
    setConfirm(false);
    setBusy(true);
    setError("");
    try {
      const result = await unlockAccount(id);
      setError(result.error);
      if (!result.error) router.refresh();
    } catch { setError("Could not unlock account. Try again."); }
    finally { setBusy(false); }
  }

  return <div className={styles.accountControl}>
    <button type="button" disabled={busy} onClick={() => setConfirm(true)}>{busy ? "Unlocking…" : "Unlock account"}</button>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {confirm && <ConfirmDialog mascot title="Unlock account?" message={`${name} can try signing in again.`} confirmLabel="Unlock account" onCancel={() => setConfirm(false)} onConfirm={() => void unlock()} />}
  </div>;
}
