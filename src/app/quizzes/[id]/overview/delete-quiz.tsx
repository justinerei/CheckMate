"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/app/submissions/confirm-dialog";
import { PendingScreen } from "@/app/pending-screen";
import { deleteQuiz, setQuizArchived } from "@/app/quizzes/delete-actions";
import styles from "./quiz-overview.module.css";

type Choice = "archive" | "delete";
export default function DeleteQuiz({ id, title, hasPapers, hasBatches, archived }: { id: string; title: string; hasPapers: boolean; hasBatches: boolean; archived: boolean }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function change(action: Choice | "restore") {
    setChoice(null); setBusy(true); setError("");
    try {
      const result = action === "delete" ? await deleteQuiz(id) : await setQuizArchived(id, action === "archive");
      if (result.error) { setError(result.error); return; }
      if (action !== "restore") router.push("/quizzes");
      router.refresh();
    } catch { setError("Could not update this quiz. Refresh and try again."); }
    finally { setBusy(false); }
  }
  const canDelete = !hasPapers;
  return <div className={styles.deleteQuiz}>
    <PendingScreen pending={busy} message="Updating quiz…" />
    <div className={styles.quizManagement}>
      {archived ? <button type="button" disabled={busy} onClick={() => change("restore")}>Restore quiz</button> : <button type="button" disabled={busy} onClick={() => setChoice("archive")}>Archive quiz</button>}
      {canDelete && <button type="button" disabled={busy} onClick={() => setChoice("delete")}>Delete quiz</button>}
    </div>
    <p>{archived ? "Archived. You can still view its papers and restore it." : canDelete ? hasBatches ? "Archive to keep this quiz, or delete it along with its empty batches." : "Archive to keep this quiz, or delete it permanently." : "This quiz has papers. Archive it to keep its records."}</p>
    {error && <p role="alert">{error}</p>}
    {choice && <ConfirmDialog mascot title={`${choice === "archive" ? "Archive" : "Delete"} ${title}?`} message={choice === "archive" ? "This moves the quiz to Archived quizzes and keys. Its papers and scores stay available, and you can restore it anytime." : "This permanently deletes the quiz, its questions, answer key, uploaded modules, and any empty batches. This cannot be undone."} confirmLabel={choice === "archive" ? "Archive quiz" : "Delete quiz"} onCancel={() => setChoice(null)} onConfirm={() => change(choice)} />}
  </div>;
}
