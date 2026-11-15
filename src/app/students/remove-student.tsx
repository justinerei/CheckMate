"use client";
import { PendingScreen } from "@/app/pending-screen";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "../submissions/confirm-dialog";
import { removeStudentFromList } from "./actions";
import styles from "./students.module.css";

export default function RemoveStudent({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function remove() {
    setOpen(false); setBusy(true); setError("");
    try { const result = await removeStudentFromList(id); if (result.error) setError(result.error); else router.refresh(); }
    catch { setError("Could not remove this student. Please refresh and try again."); }
    finally { setBusy(false); }
  }
  return <div className={styles.removeStudent}><PendingScreen pending={busy} mood="focused" message="Removing student…" /><button type="button" disabled={busy} onClick={() => setOpen(true)} aria-label={`Remove ${name} from your student list`}>{busy ? "Removing…" : "Remove student"}</button>{error && <p role="alert" className={styles.error}>{error}</p>}{open && <ConfirmDialog title={`Remove ${name}?`} message="This removes the student from your list and unlinks them from your papers. Your papers and scores stay. Other teachers and the shared student record are unaffected. You will need the student’s sharing code to link them again." confirmLabel="Remove student" onCancel={() => setOpen(false)} onConfirm={remove} />}</div>;
}
