"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/app/submissions/confirm-dialog";
import { setAccountEnabled } from "./actions";
import styles from "./admin.module.css";

export default function AccountControl({ id, name, enabled }: { id: string; name: string; enabled: boolean }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false); const router = useRouter();
  async function update() { setConfirm(false); setBusy(true); setError(""); try { const result = await setAccountEnabled(id, !enabled); setError(result.error); if (!result.error) router.refresh(); } catch { setError("Could not update account. Try again."); } finally { setBusy(false); } }
  return <div className={styles.accountControl}><button className={enabled ? styles.secondary : styles.primary} type="button" disabled={busy} onClick={() => setConfirm(true)}>{busy ? "Updating…" : enabled ? "Disable access" : "Enable access"}</button>{error && <p role="alert" className={styles.error}>{error}</p>}{confirm && <ConfirmDialog mascot destructive={enabled} title={`${enabled ? "Disable" : "Enable"} access?`} message={enabled ? `${name} will no longer be able to access CheckMate. Their records will be kept.` : `${name} will be able to access CheckMate again.`} confirmLabel={enabled ? "Disable access" : "Enable access"} onCancel={() => setConfirm(false)} onConfirm={() => void update()} />}</div>;
}
