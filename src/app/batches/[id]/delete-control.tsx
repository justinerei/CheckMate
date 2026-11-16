"use client";
import { PendingScreen } from "@/app/pending-screen";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "../../submissions/confirm-dialog";
import { removeFromBatch } from "./delete-actions";
import styles from "./batch.module.css";

export default function DeleteControl({ batchId, paperId, name, papers }: { batchId: string; paperId?: string; name?: string; papers?: { id: string; status: string }[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const finalized = papers?.filter(paper => paper.status === "FINALIZED").length ?? 0;
  async function remove() {
    setOpen(false); setBusy(true); setError("");
    try {
      const result = await removeFromBatch(batchId, paperId, papers);
      if (result.error) { setError(result.error); return; }
      if (!paperId && result.quizId) router.push(`/quizzes/${encodeURIComponent(result.quizId)}/overview?batchDeleted=1`);
      else router.refresh();
    } catch { setError("Could not remove this item. Refresh and try again."); }
    finally { setBusy(false); }
  }
  return <div className={styles.deleteControl}><PendingScreen pending={busy} mood="focused" message="Removing…" /><button type="button" className={styles.deleteButton} aria-label={busy ? "Removing…" : paperId ? `Remove ${name || "paper"}` : "Delete batch"} title={paperId ? `Remove ${name || "paper"}` : "Delete batch"} disabled={busy} onClick={() => setOpen(true)}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button>{error && <p className={styles.error} role="alert">{error}</p>}{open && <ConfirmDialog destructive title={paperId ? `Remove ${name || "this paper"}?` : "Delete this batch?"} message={paperId ? "This permanently removes the paper, its photos, checked answers, and any finalized score. The quiz and student record remain." : `This permanently removes ${papers?.length ?? 0} papers, including ${finalized} finalized results, their photos and checked answers. The quiz and student records remain.`} confirmLabel={paperId ? "Remove paper" : "Delete batch"} onCancel={() => setOpen(false)} onConfirm={remove} />}</div>;
}
